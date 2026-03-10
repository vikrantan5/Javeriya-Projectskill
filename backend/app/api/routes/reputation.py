from fastapi import APIRouter, HTTPException, Depends
from app.utils.auth import get_current_user
from app.services.reputation_service import reputation_service
from app.database import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reputation", tags=["Reputation"])

@router.get("/trust-score/{user_id}")
async def get_trust_score(user_id: str):
    """Get trust score for a specific user"""
    try:
        trust_score = reputation_service.calculate_trust_score(user_id)
        badge_info = reputation_service.get_mentor_badge(trust_score)
        
        db = get_db()
        user_result = db.table('users').select('trust_score, verified_skills_count, response_rate, total_sessions, average_rating').eq('id', user_id).execute()
        
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_result.data[0]
        
        return {
            "user_id": user_id,
            "trust_score": trust_score,
            "badge": badge_info,
            "stats": {
                "verified_skills_count": user_data.get('verified_skills_count', 0),
                "response_rate": user_data.get('response_rate', 0),
                "total_sessions": user_data.get('total_sessions', 0),
                "average_rating": user_data.get('average_rating', 0)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting trust score: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recalculate")
async def recalculate_my_trust_score(current_user_id: str = Depends(get_current_user)):
    """Recalculate trust score for the current user"""
    try:
        trust_score = reputation_service.calculate_trust_score(current_user_id)
        badge_info = reputation_service.get_mentor_badge(trust_score)
        
        return {
            "message": "Trust score recalculated successfully",
            "trust_score": trust_score,
            "badge": badge_info
        }
    except Exception as e:
        logger.error(f"Error recalculating trust score: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/leaderboard")
async def get_trust_score_leaderboard(limit: int = 10):
    """Get top users by trust score"""
    try:
        db = get_db()
        
        # Get top users sorted by trust score
        result = db.table('users').select('id, username, full_name, trust_score, average_rating, total_sessions, verified_skills_count, profile_photo').order('trust_score', desc=True).limit(limit).execute()
        
        leaderboard = []
        for idx, user in enumerate(result.data, 1):
            trust_score = user.get('trust_score', 0)
            badge_info = reputation_service.get_mentor_badge(trust_score)
            
            leaderboard.append({
                "rank": idx,
                "user_id": user['id'],
                "username": user['username'],
                "full_name": user.get('full_name'),
                "profile_photo": user.get('profile_photo'),
                "trust_score": trust_score,
                "badge": badge_info,
                "stats": {
                    "average_rating": user.get('average_rating', 0),
                    "total_sessions": user.get('total_sessions', 0),
                    "verified_skills_count": user.get('verified_skills_count', 0)
                }
            })
        
        return {
            "leaderboard": leaderboard,
            "total": len(leaderboard)
        }
    except Exception as e:
        logger.error(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
