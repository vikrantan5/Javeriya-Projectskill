from fastapi import APIRouter, HTTPException, Depends
from app.utils.auth import get_current_user
from app.services.mentor_matching_service import mentor_matching_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mentors", tags=["Mentor Matching"])

@router.get("/find/{skill_name}")
async def find_mentors(skill_name: str, limit: int = 10, current_user_id: str = Depends(get_current_user)):
    """
    Find best matching mentors for a specific skill
    
    Args:
        skill_name: The skill to find mentors for
        limit: Maximum number of mentors to return
    """
    try:
        mentors = mentor_matching_service.find_mentors(current_user_id, skill_name, limit)
        
        return {
            "skill_name": skill_name,
            "total_mentors_found": len(mentors),
            "mentors": mentors
        }
        
    except Exception as e:
        logger.error(f"Error finding mentors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations")
async def get_mentor_recommendations(limit: int = 5, current_user_id: str = Depends(get_current_user)):
    """
    Get personalized mentor recommendations based on user's wanted skills
    """
    try:
        recommendations = mentor_matching_service.get_mentor_recommendations(current_user_id, limit)
        
        return {
            "total_recommendations": len(recommendations),
            "recommendations": recommendations
        }
        
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
