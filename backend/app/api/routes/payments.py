from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import PaymentCreate, PaymentResponse
from app.utils.auth import get_current_user
from app.database import get_db
from app.services.payment_service import payment_service
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])

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
async def verify_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    current_user_id: str = Depends(get_current_user)
):
    """Verify Razorpay payment"""
    try:
        db = get_db()
        
        # Verify payment signature
        is_valid = payment_service.verify_payment(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment signature"
            )
        
        # Update payment record
        payment_update = {
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature,
            'status': 'completed',
            'escrowed_at': 'now()'
        }
        
        result = db.table('payments').update(payment_update).eq('razorpay_order_id', razorpay_order_id).execute()
        
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
            'released_at': 'now()'
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