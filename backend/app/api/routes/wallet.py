from fastapi import APIRouter, HTTPException, status, Depends
from app.utils.auth import get_current_user
from app.services.wallet_service import wallet_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/wallet", tags=["Wallet"])

@router.get("/")
async def get_wallet(current_user_id: str = Depends(get_current_user)):
    """Get user's wallet information"""
    try:
        wallet = wallet_service.get_wallet_details(current_user_id)
        return wallet
    except Exception as e:
        logger.error(f"Error fetching wallet: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/balance")
async def get_balance(current_user_id: str = Depends(get_current_user)):
    """Get user's current wallet balance"""
    try:
        balance = wallet_service.get_balance(current_user_id)
        return {"balance": balance}
    except Exception as e:
        logger.error(f"Error fetching balance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/transactions")
async def get_transactions(
    limit: int = 50,
    current_user_id: str = Depends(get_current_user)
):
    """Get user's wallet transaction history"""
    try:
        transactions = wallet_service.get_transaction_history(current_user_id, limit)
        return transactions
    except Exception as e:
        logger.error(f"Error fetching transactions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/summary")
async def get_wallet_summary(current_user_id: str = Depends(get_current_user)):
    """Get complete wallet summary with recent transactions"""
    try:
        summary = wallet_service.get_transaction_summary(current_user_id)
        return summary
    except Exception as e:
        logger.error(f"Error fetching wallet summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
