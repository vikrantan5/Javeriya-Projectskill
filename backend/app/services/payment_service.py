import razorpay
from app.config import settings
from app.database import get_db
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

class PaymentService:
    def __init__(self):
        """Initialize Razorpay client with TEST mode keys"""
        self.client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        self.payment_mode = "TEST"  # Always TEST mode for now
        logger.info(f"Payment service initialized in {self.payment_mode} mode")
    
    def create_order(self, amount: float, currency: str = "INR", receipt: str = None) -> Dict[str, Any]:
        """Create Razorpay order in TEST mode"""
        try:
            # Amount should be in paise (multiply by 100)
            amount_paise = int(amount * 100)
            
            order_data = {
                "amount": amount_paise,
                "currency": currency,
                "receipt": receipt or f"order_test_{int(amount_paise)}",
                "payment_capture": 0  # Manual capture for escrow
            }
            
            order = self.client.order.create(data=order_data)
            logger.info(f"[TEST MODE] Razorpay order created: {order['id']} for ₹{amount}")
            return order
        except Exception as e:
            logger.error(f"Failed to create Razorpay order: {str(e)}")
            raise Exception(f"Payment order creation failed: {str(e)}")
    
    def verify_payment(self, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        """Verify Razorpay payment signature"""
        try:
            params_dict = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            }
            
            self.client.utility.verify_payment_signature(params_dict)
            logger.info(f"[TEST MODE] Payment verified successfully: {razorpay_payment_id}")
            return True
        except Exception as e:
            logger.error(f"Payment verification failed: {str(e)}")
            return False
    
    async def hold_in_escrow(self, payment_id: str, task_id: str, amount: float) -> Dict[str, Any]:
        """
        Hold payment in escrow (TEST mode - just update database status)
        In production, this would use Razorpay's authorization hold
        """
        try:
            db = get_db()
            
            # Update payment record to ESCROW_HELD
            result = db.table('payments').update({
                'escrow_status': 'ESCROW_HELD',
                'payment_mode': 'TEST',
                'escrowed_at': utc_now_iso()
            }).eq('id', payment_id).execute()
            
            logger.info(f"[TEST MODE] Payment {payment_id} held in escrow for task {task_id}, amount: ₹{amount}")
            return {
                "status": "success",
                "escrow_status": "ESCROW_HELD",
                "payment_mode": "TEST"
            }
        except Exception as e:
            logger.error(f"Failed to hold payment in escrow: {str(e)}")
            raise Exception(f"Escrow hold failed: {str(e)}")
    
    async def release_from_escrow(self, payment_id: str, razorpay_payment_id: str, amount: float) -> bool:
        """
        Release payment from escrow (TEST mode - simulated)
        In production, this would capture the payment via Razorpay
        """
        try:
            db = get_db()
            
            # In TEST mode, just update database status
            if self.payment_mode == "TEST":
                result = db.table('payments').update({
                    'escrow_status': 'RELEASED_TEST',
                    'status': 'released',
                    'released_at': utc_now_iso()
                }).eq('id', payment_id).execute()
                
                logger.info(f"[TEST MODE] Payment {payment_id} released from escrow (simulated): ₹{amount}")
                return True
            else:
                # In LIVE mode, capture the payment
                amount_paise = int(amount * 100)
                self.client.payment.capture(razorpay_payment_id, amount_paise)
                
                result = db.table('payments').update({
                    'escrow_status': 'RELEASED',
                    'status': 'released',
                    'released_at': utc_now_iso()
                }).eq('id', payment_id).execute()
                
                logger.info(f"[LIVE MODE] Payment {payment_id} captured and released: ₹{amount}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to release payment from escrow: {str(e)}")
            return False
    
    async def refund_from_escrow(self, payment_id: str, razorpay_payment_id: Optional[str], amount: float, reason: str) -> bool:
        """
        Refund payment from escrow (TEST mode - simulated)
        In production, this would process actual refund via Razorpay
        """
        try:
            db = get_db()
            
            # In TEST mode, just update database status
            if self.payment_mode == "TEST":
                result = db.table('payments').update({
                    'escrow_status': 'REFUNDED_TEST',
                    'status': 'refunded',
                    'refunded_at': utc_now_iso(),
                    'refund_reason': reason
                }).eq('id', payment_id).execute()
                
                logger.info(f"[TEST MODE] Payment {payment_id} refunded from escrow (simulated): ₹{amount}, reason: {reason}")
                return True
            else:
                # In LIVE mode, process actual refund
                if razorpay_payment_id:
                    refund_data = {
                        "payment_id": razorpay_payment_id,
                        "amount": int(amount * 100)
                    }
                    self.client.payment.refund(razorpay_payment_id, refund_data)
                
                result = db.table('payments').update({
                    'escrow_status': 'REFUNDED',
                    'status': 'refunded',
                    'refunded_at': utc_now_iso(),
                    'refund_reason': reason
                }).eq('id', payment_id).execute()
                
                logger.info(f"[LIVE MODE] Payment {payment_id} refunded: ₹{amount}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to refund payment: {str(e)}")
            return False

    async def capture_payment(self, payment_id: str, amount: float) -> bool:
        """Capture payment (release from escrow) - Legacy method"""
        try:
            amount_paise = int(amount * 100)
            self.client.payment.capture(payment_id, amount_paise)
            logger.info(f"Payment captured: {payment_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to capture payment: {str(e)}")
            return False
    
    async def refund_payment(self, payment_id: str, amount: float = None) -> bool:
        """Refund payment - Legacy method"""
        try:
            refund_data = {"payment_id": payment_id}
            if amount:
                refund_data["amount"] = int(amount * 100)
            
            self.client.payment.refund(payment_id, refund_data)
            logger.info(f"Payment refunded: {payment_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to refund payment: {str(e)}")
            return False

payment_service = PaymentService()