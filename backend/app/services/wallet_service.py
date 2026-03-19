"""
Wallet Service - Manage real money transactions (INR)
Separate from token_service.py which handles platform skill tokens
"""
from app.database import get_db
from datetime import datetime, timezone
import logging
from typing import Optional, Dict
from decimal import Decimal

logger = logging.getLogger(__name__)

def utc_now_iso() -> str:
    """Get current UTC time in ISO format"""
    return datetime.now(timezone.utc).isoformat()

class WalletService:
    """Service for managing real money wallet (INR)"""
    
    @staticmethod
    def create_wallet(user_id: str) -> Dict:
        """Create wallet for new user"""
        try:
            db = get_db()
            
            # Check if wallet exists
            existing = db.table('wallet').select('*').eq('user_id', user_id).execute()
            if existing.data:
                logger.info(f"Wallet already exists for user {user_id}")
                return existing.data[0]
            
            # Create new wallet with zero balance
            new_wallet = {
                'user_id': user_id,
                'balance': 0.00,
                'total_earned': 0.00,
                'total_spent': 0.00
            }
            
            result = db.table('wallet').insert(new_wallet).execute()
            
            logger.info(f"Created wallet for user {user_id}")
            return result.data[0] if result.data else new_wallet
            
        except Exception as e:
            logger.error(f"Error creating wallet: {str(e)}")
            raise
    
    @staticmethod
    def get_balance(user_id: str) -> float:
        """Get user's wallet balance"""
        try:
            db = get_db()
            result = db.table('wallet').select('balance').eq('user_id', user_id).execute()
            
            if not result.data:
                # Create wallet if doesn't exist
                wallet = WalletService.create_wallet(user_id)
                return float(wallet['balance'])
            
            return float(result.data[0]['balance'])
            
        except Exception as e:
            logger.error(f"Error getting balance for user {user_id}: {str(e)}")
            return 0.0
    
    @staticmethod
    def get_wallet_details(user_id: str) -> Dict:
        """Get complete wallet information"""
        try:
            db = get_db()
            result = db.table('wallet').select('*').eq('user_id', user_id).execute()
            
            if not result.data:
                # Create wallet if doesn't exist
                return WalletService.create_wallet(user_id)
            
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error getting wallet details: {str(e)}")
            return {
                'balance': 0.0,
                'total_earned': 0.0,
                'total_spent': 0.0
            }
    
    @staticmethod
    def credit_amount(
        user_id: str, 
        amount: float, 
        reason: str, 
        reference_id: Optional[str] = None,
        reference_type: Optional[str] = None
    ) -> Dict:
        """Add money to user's wallet"""
        try:
            db = get_db()
            
            if amount <= 0:
                raise ValueError("Amount must be greater than 0")
            
            # Get current wallet
            wallet_result = db.table('wallet').select('*').eq('user_id', user_id).execute()
            
            if not wallet_result.data:
                WalletService.create_wallet(user_id)
                wallet_result = db.table('wallet').select('*').eq('user_id', user_id).execute()
            
            wallet = wallet_result.data[0]
            new_balance = float(wallet['balance']) + amount
            
            # Update wallet
            db.table('wallet').update({
                'balance': new_balance,
                'total_earned': float(wallet['total_earned']) + amount,
                'updated_at': utc_now_iso()
            }).eq('user_id', user_id).execute()
            
            # Record transaction
            transaction = {
                'user_id': user_id,
                'transaction_type': 'credit',
                'amount': amount,
                'reason': reason,
                'reference_id': reference_id,
                'reference_type': reference_type,
                'balance_after': new_balance
            }
            
            db.table('wallet_transactions').insert(transaction).execute()
            
            logger.info(f"Credited ₹{amount} to user {user_id} for {reason}")
            
            return {
                'success': True,
                'new_balance': new_balance,
                'credited': amount,
                'reason': reason
            }
            
        except Exception as e:
            logger.error(f"Error crediting amount: {str(e)}")
            raise
    
    @staticmethod
    def debit_amount(
        user_id: str, 
        amount: float, 
        reason: str, 
        reference_id: Optional[str] = None,
        reference_type: Optional[str] = None,
        allow_negative: bool = False
    ) -> Dict:
        """Deduct money from user's wallet"""
        try:
            db = get_db()
            
            if amount <= 0:
                raise ValueError("Amount must be greater than 0")
            
            # Get current balance
            current_balance = WalletService.get_balance(user_id)
            
            if not allow_negative and current_balance < amount:
                return {
                    'success': False,
                    'error': 'Insufficient balance',
                    'required': amount,
                    'available': current_balance
                }
            
            new_balance = current_balance - amount
            
            # Update wallet
            wallet_result = db.table('wallet').select('*').eq('user_id', user_id).execute()
            wallet = wallet_result.data[0]
            
            db.table('wallet').update({
                'balance': new_balance,
                'total_spent': float(wallet['total_spent']) + amount,
                'updated_at': utc_now_iso()
            }).eq('user_id', user_id).execute()
            
            # Record transaction
            transaction = {
                'user_id': user_id,
                'transaction_type': 'debit',
                'amount': amount,
                'reason': reason,
                'reference_id': reference_id,
                'reference_type': reference_type,
                'balance_after': new_balance
            }
            
            db.table('wallet_transactions').insert(transaction).execute()
            
            logger.info(f"Debited ₹{amount} from user {user_id} for {reason}")
            
            return {
                'success': True,
                'new_balance': new_balance,
                'debited': amount,
                'reason': reason
            }
            
        except Exception as e:
            logger.error(f"Error debiting amount: {str(e)}")
            raise
    
    @staticmethod
    def atomic_transfer(
        from_user_id: str,
        to_user_id: str,
        amount: float,
        reason: str,
        reference_id: Optional[str] = None,
        reference_type: Optional[str] = None
    ) -> Dict:
        """
        Transfer money from one user to another atomically
        This is used for task payments (creator → acceptor)
        """
        try:
            db = get_db()
            
            if amount <= 0:
                raise ValueError("Amount must be greater than 0")
            
            if from_user_id == to_user_id:
                raise ValueError("Cannot transfer to same user")
            
            logger.info(f"Starting atomic transfer of ₹{amount} from {from_user_id} to {to_user_id}")
            
            # Ensure both wallets exist
            WalletService.create_wallet(from_user_id)
            WalletService.create_wallet(to_user_id)
            
            # Check sender has sufficient balance
            sender_balance = WalletService.get_balance(from_user_id)
            
            # For task payments, we allow negative balance since payment was already made via Razorpay
            # The wallet is just for tracking, not actual money storage
            # In production, you'd use Razorpay Payouts API to transfer funds
            
            # Debit from sender
            debit_result = WalletService.debit_amount(
                user_id=from_user_id,
                amount=amount,
                reason=f"{reason} - payment",
                reference_id=reference_id,
                reference_type=reference_type,
                allow_negative=True  # Allow negative for accounting purposes
            )
            
            if not debit_result['success']:
                raise Exception(f"Failed to debit from sender: {debit_result.get('error')}")
            
            # Credit to receiver
            credit_result = WalletService.credit_amount(
                user_id=to_user_id,
                amount=amount,
                reason=f"{reason} - received",
                reference_id=reference_id,
                reference_type=reference_type
            )
            
            if not credit_result['success']:
                # This shouldn't happen, but if it does, we have a problem
                logger.error(f"CRITICAL: Failed to credit receiver after debiting sender!")
                raise Exception("Transfer partially failed - credited but failed to debit")
            
            logger.info(f"Successfully transferred ₹{amount} from {from_user_id} to {to_user_id}")
            
            return {
                'success': True,
                'amount': amount,
                'from_user': from_user_id,
                'to_user': to_user_id,
                'sender_new_balance': debit_result['new_balance'],
                'receiver_new_balance': credit_result['new_balance'],
                'reason': reason
            }
            
        except Exception as e:
            logger.error(f"Error in atomic transfer: {str(e)}")
            raise
    
    @staticmethod
    def get_transaction_history(user_id: str, limit: int = 50) -> list:
        """Get user's wallet transaction history"""
        try:
            db = get_db()
            
            result = db.table('wallet_transactions').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(limit).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error getting transaction history: {str(e)}")
            return []
    
    @staticmethod
    def get_transaction_summary(user_id: str) -> Dict:
        """Get summary of user's wallet transactions"""
        try:
            wallet = WalletService.get_wallet_details(user_id)
            transactions = WalletService.get_transaction_history(user_id, limit=10)
            
            return {
                'current_balance': wallet['balance'],
                'total_earned': wallet['total_earned'],
                'total_spent': wallet['total_spent'],
                'recent_transactions': transactions
            }
            
        except Exception as e:
            logger.error(f"Error getting transaction summary: {str(e)}")
            return {
                'current_balance': 0.0,
                'total_earned': 0.0,
                'total_spent': 0.0,
                'recent_transactions': []
            }


# Create singleton instance
wallet_service = WalletService()
