from fastapi import APIRouter, HTTPException, Depends
from app.utils.auth import get_current_user
from app.services.leaderboard_service import leaderboard_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

@router.get("/")
async def get_leaderboard(category: str = "top_mentor", limit: int = 10):
    """
    Get leaderboard for a specific category
    
    Args:
        category: 'top_mentor', 'top_learner', or 'top_contributor'
        limit: Number of top users to return
    """
    try:
        if category not in ['top_mentor', 'top_learner', 'top_contributor']:
            raise HTTPException(status_code=400, detail="Invalid category. Must be 'top_mentor', 'top_learner', or 'top_contributor'")
        
        leaderboard = leaderboard_service.get_leaderboard(category, limit)
        
        return {
            "category": category,
            "week": "current",
            "total": len(leaderboard),
            "leaderboard": leaderboard
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update/{category}")
async def update_leaderboard_category(
    category: str,
    limit: int = 100,
    current_user_id: str = Depends(get_current_user)
):
    """
    Manually trigger leaderboard update for a category (admin function)
    """
    try:
        if category not in ['top_mentor', 'top_learner', 'top_contributor']:
            raise HTTPException(status_code=400, detail="Invalid category")
        
        leaderboard_service.update_leaderboard(category, limit)
        
        return {
            "message": f"Leaderboard updated for {category}",
            "category": category
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all-categories")
async def get_all_leaderboards(limit: int = 10):
    """Get leaderboards for all categories"""
    try:
        categories = ['top_mentor', 'top_learner', 'top_contributor']
        
        all_leaderboards = {}
        for category in categories:
            leaderboard = leaderboard_service.get_leaderboard(category, limit)
            all_leaderboards[category] = leaderboard
        
        return {
            "categories": categories,
            "leaderboards": all_leaderboards
        }
        
    except Exception as e:
        logger.error(f"Error getting all leaderboards: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
