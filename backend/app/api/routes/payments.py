from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import PaymentCreate, PaymentResponse, PaymentVerifyRequest
from app.utils.auth import get_current_user
from app.database import get_db
from app.services.payment_service import payment_service
from app.config import settings
from typing import List
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/key")
async def get_razorpay_key(current_user_id: str = Depends(get_current_user)):
    """Return Razorpay publishable key for checkout."""
    return {"key_id": settings.RAZORPAY_KEY_ID}


@router.get("/task/{task_id}/status")
async def get_task_payment_status(task_id: str, current_user_id: str = Depends(get_current_user)):
    """Get latest payment status for a specific task."""
    try:
        db = get_db()
        task_result = db.table('tasks').select('id, creator_id, acceptor_id').eq('id', task_id).limit(1).execute()
        if not task_result.data:
            raise HTTPException(status_code=404, detail="Task not found")

        task = task_result.data[0]
        if current_user_id not in [task.get('creator_id'), task.get('acceptor_id')]:
            raise HTTPException(status_code=403, detail="Not authorized")

        payment_result = db.table('payments').select('*').eq('task_id', task_id).order('created_at', desc=True).limit(1).execute()
        return {
            "has_payment": bool(payment_result.data),
            "payment": payment_result.data[0] if payment_result.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-order", response_model=dict)
async def create_payment_order(payment_data: PaymentCreate, current_user_id: str = Depends(get_current_user)):
    """Create a Razorpay order for task payment"""
    try:
        db = get_db()
        
        # Verify task exists
        task_result = db.table('tasks').select('*').eq('id', str(payment_data.task_id)).execute()
        
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        task = task_result.data[0]
        
        # Verify user is the creator
        if task['creator_id'] != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only task creator can create payment"
            )


        if not task.get('acceptor_id'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task must be accepted before creating payment"
            )  
        # Create Razorpay order
        order = payment_service.create_order(
            amount=payment_data.amount,
            currency=payment_data.currency
        )
        
        # Create payment record
        new_payment = {
            'task_id': str(payment_data.task_id),
            'payer_id': current_user_id,
            'payee_id': task.get('acceptor_id'),
            'amount': payment_data.amount,
            'currency': payment_data.currency,
            'razorpay_order_id': order['id'],
            'status': 'pending',
            'is_escrowed': True
        }
        
        payment_result = db.table('payments').insert(new_payment).execute()
        
        return {
            "order_id": order['id'],
            "amount": order['amount'],
            "currency": order['currency'],
            "payment_id": payment_result.data[0]['id'] if payment_result.data else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/verify")
async def verify_payment(payload: PaymentVerifyRequest, current_user_id: str = Depends(get_current_user)):

    """Verify Razorpay payment"""
    try:
        db = get_db()
        
        # Verify payment signature
        is_valid = payment_service.verify_payment(
            payload.razorpay_order_id,
            payload.razorpay_payment_id,
            payload.razorpay_signature
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment signature"
            )
        
        # Update payment record
        payment_update = {
            'razorpay_payment_id': payload.razorpay_payment_id,
            'razorpay_signature': payload.razorpay_signature,
            'status': 'completed',
            'escrowed_at': utc_now_iso()
        }
        
        result = db.table('payments').update(payment_update).eq('razorpay_order_id', payload.razorpay_order_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Payment record not found")
        
        return {
            "message": "Payment verified successfully",
            "status": "completed"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/release/{payment_id}")
async def release_payment(payment_id: str, current_user_id: str = Depends(get_current_user)):
    """Release escrowed payment to payee"""
    try:
        db = get_db()
        
        # Get payment
        payment_result = db.table('payments').select('*').eq('id', payment_id).execute()
        
        if not payment_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        payment = payment_result.data[0]
        
        # Verify user is the payer
        if payment['payer_id'] != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only payer can release payment"
            )
        
        # Check if payment is escrowed
        if not payment['is_escrowed'] or payment['status'] != 'completed':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment cannot be released"
            )
        
        # Update payment
        db.table('payments').update({
            'status': 'released',
             'released_at': utc_now_iso()
        }).eq('id', payment_id).execute()
        
        # Create notification for payee
        if payment['payee_id']:
            notification = {
                'user_id': payment['payee_id'],
                'title': 'Payment Released',
                'message': f'Payment of ₹{payment["amount"]} has been released to you',
                'notification_type': 'payment',
                'reference_id': payment_id,
                'reference_type': 'payment'
            }
            db.table('notifications').insert(notification).execute()
        
        return {
            "message": "Payment released successfully",
            "payment_id": payment_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error releasing payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/my-payments", response_model=List[PaymentResponse])
async def get_my_payments(current_user_id: str = Depends(get_current_user)):
    """Get all payments for current user (as payer or payee)"""
    try:
        db = get_db()
        
        # Get payments where user is payer or payee
        payer_payments = db.table('payments').select('*').eq('payer_id', current_user_id).execute()
        payee_payments = db.table('payments').select('*').eq('payee_id', current_user_id).execute()
        
        all_payments = (payer_payments.data or []) + (payee_payments.data or [])
        
        return all_payments
    
    except Exception as e:
        logger.error(f"Error fetching payments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )