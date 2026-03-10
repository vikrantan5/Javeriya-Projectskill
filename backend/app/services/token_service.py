"""
Token Economy Service - Manage skill tokens
"""
from app.database import get_db
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class TokenService:
    """Service for managing skill tokens"""
    
    # Token earning rules
    EARN_SESSION_COMPLETED = 50  # Tokens for completing a session as mentor
    EARN_TASK_COMPLETED = 100  # Tokens for completing a task
    EARN_HIGH_RATING = 25  # Tokens for receiving 5-star rating
    EARN_SKILL_VERIFIED = 30  # Tokens for verifying a skill
    EARN_SIGNUP_BONUS = 100  # Initial signup bonus
    
    # Token spending rules
    SPEND_BOOK_SESSION = 20  # Tokens to book a premium session
    SPEND_UNLOCK_CONTENT = 50  # Tokens to unlock premium content
    
    @staticmethod
    def create_token_account(user_id: str) -> dict:
        """Create token account for new user with signup bonus"""
        try:
            db = get_db()
            
            # Check if account exists
            existing = db.table('skill_tokens').select('*').eq('user_id', user_id).execute()
            if existing.data:
                return existing.data[0]
            
            # Create new account with signup bonus
            new_account = {
                'user_id': user_id,
                'balance': TokenService.EARN_SIGNUP_BONUS,
                'total_earned': TokenService.EARN_SIGNUP_BONUS,
                'total_spent': 0
            }
            
            result = db.table('skill_tokens').insert(new_account).execute()
            
            # Record transaction
            TokenService._record_transaction(
                user_id=user_id,
                transaction_type='earn',
                amount=TokenService.EARN_SIGNUP_BONUS,
                reason='signup_bonus',
                balance_after=TokenService.EARN_SIGNUP_BONUS
            )
            
            logger.info(f"Created token account for user {user_id}")
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error creating token account: {str(e)}")
            raise
    
    @staticmethod
    def get_balance(user_id: str) -> int:
        """Get user's token balance"""
        try:
            db = get_db()
            result = db.table('skill_tokens').select('balance').eq('user_id', user_id).execute()
            
            if not result.data:
                # Create account if doesn't exist
                account = TokenService.create_token_account(user_id)
                return account['balance']
            
            return result.data[0]['balance']
            
        except Exception as e:
            logger.error(f"Error getting balance: {str(e)}")
            return 0
    
    @staticmethod
    def earn_tokens(user_id: str, amount: int, reason: str, reference_id: Optional[str] = None) -> dict:
        """Award tokens to user"""
        try:
            db = get_db()
            
            # Get current account
            account_result = db.table('skill_tokens').select('*').eq('user_id', user_id).execute()
            
            if not account_result.data:
                TokenService.create_token_account(user_id)
                account_result = db.table('skill_tokens').select('*').eq('user_id', user_id).execute()
            
            account = account_result.data[0]
            new_balance = account['balance'] + amount
            
            # Update account
            db.table('skill_tokens').update({
                'balance': new_balance,
                'total_earned': account['total_earned'] + amount
            }).eq('user_id', user_id).execute()
            
            # Record transaction
            TokenService._record_transaction(
                user_id=user_id,
                transaction_type='earn',
                amount=amount,
                reason=reason,
                reference_id=reference_id,
                balance_after=new_balance
            )
            
            logger.info(f"User {user_id} earned {amount} tokens for {reason}")
            
            return {
                'success': True,
                'new_balance': new_balance,
                'earned': amount,
                'reason': reason
            }
            
        except Exception as e:
            logger.error(f"Error earning tokens: {str(e)}")
            raise
    
    @staticmethod
    def spend_tokens(user_id: str, amount: int, reason: str, reference_id: Optional[str] = None) -> dict:
        """Deduct tokens from user balance"""
        try:
            db = get_db()
            
            # Get current balance
            balance = TokenService.get_balance(user_id)
            
            if balance < amount:
                return {
                    'success': False,
                    'error': 'Insufficient tokens',
                    'required': amount,
                    'available': balance
                }
            
            new_balance = balance - amount
            
            # Update account
            account_result = db.table('skill_tokens').select('*').eq('user_id', user_id).execute()
            account = account_result.data[0]
            
            db.table('skill_tokens').update({
                'balance': new_balance,
                'total_spent': account['total_spent'] + amount
            }).eq('user_id', user_id).execute()
            
            # Record transaction
            TokenService._record_transaction(
                user_id=user_id,
                transaction_type='spend',
                amount=amount,
                reason=reason,
                reference_id=reference_id,
                balance_after=new_balance
            )
            
            logger.info(f"User {user_id} spent {amount} tokens for {reason}")
            
            return {
                'success': True,
                'new_balance': new_balance,
                'spent': amount,
                'reason': reason
            }
            
        except Exception as e:
            logger.error(f"Error spending tokens: {str(e)}")
            raise
    
    @staticmethod
    def _record_transaction(user_id: str, transaction_type: str, amount: int, reason: str, balance_after: int, reference_id: Optional[str] = None) -> None:
        """Record token transaction"""
        try:
            db = get_db()
            
            transaction = {
                'user_id': user_id,
                'transaction_type': transaction_type,
                'amount': amount,
                'reason': reason,
                'reference_id': reference_id,
                'balance_after': balance_after
            }
            
            db.table('token_transactions').insert(transaction).execute()
            
        except Exception as e:
            logger.error(f"Error recording transaction: {str(e)}")
    
    @staticmethod
    def get_transaction_history(user_id: str, limit: int = 20) -> list:
        """Get user's token transaction history"""
        try:
            db = get_db()
            
            result = db.table('token_transactions').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(limit).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error getting transaction history: {str(e)}")
            return []


token_service = TokenService()
