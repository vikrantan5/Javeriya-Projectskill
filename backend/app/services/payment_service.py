import razorpay
from app.config import settings
from app.database import get_db
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class PaymentService:
    def __init__(self):
        self.client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    
    def create_order(self, amount: float, currency: str = "INR", receipt: str = None) -> Dict[str, Any]:
        """Create Razorpay order"""
        try:
            # Amount should be in paise (multiply by 100)
            amount_paise = int(amount * 100)
            
            order_data = {
                "amount": amount_paise,
                "currency": currency,
                "receipt": receipt or f"order_{int(amount_paise)}",
                "payment_capture": 0  # Manual capture for escrow
            }
            
            order = self.client.order.create(data=order_data)
            logger.info(f"Razorpay order created: {order['id']}")
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
            logger.info(f"Payment verified successfully: {razorpay_payment_id}")
            return True
        except Exception as e:
            logger.error(f"Payment verification failed: {str(e)}")
            return False
    
    async def capture_payment(self, payment_id: str, amount: float) -> bool:
        """Capture payment (release from escrow)"""
        try:
            amount_paise = int(amount * 100)
            self.client.payment.capture(payment_id, amount_paise)
            logger.info(f"Payment captured: {payment_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to capture payment: {str(e)}")
            return False
    
    async def refund_payment(self, payment_id: str, amount: float = None) -> bool:
        """Refund payment"""
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
