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




@router.post("/request")
async def request_mentor(mentor_id: str, skill_name: str, message: str = "", current_user_id: str = Depends(get_current_user)):
    """
    Send a mentor request
    """
    try:
        from app.database import get_db
        db = get_db()
        
        # Verify mentor exists
        mentor_result = db.table('users').select('id, username, full_name').eq('id', mentor_id).execute()
        if not mentor_result.data:
            raise HTTPException(status_code=404, detail="Mentor not found")
        
        # Create mentor request
        request_data = {
            'learner_id': current_user_id,
            'mentor_id': mentor_id,
            'skill_name': skill_name,
            'message': message,
            'status': 'pending'
        }
        
        result = db.table('mentor_requests').insert(request_data).execute()
        
        # Create notification for mentor
        db.table('notifications').insert({
            'user_id': mentor_id,
            'title': 'New Mentor Request',
            'message': f'You have a new mentorship request for {skill_name}',
            'notification_type': 'mentor_request',
            'reference_id': result.data[0]['id'],
            'reference_type': 'mentor_request'
        }).execute()
        
        # Create notification for user
        db.table('notifications').insert({
            'user_id': current_user_id,
            'title': 'Mentorship Request Sent',
            'message': f'Your request for {skill_name} has been sent',
            'notification_type': 'mentor_request',
            'reference_id': result.data[0]['id'],
            'reference_type': 'mentor_request'
        }).execute()
        
        return {
            "message": "Mentor request sent successfully",
            "request": result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating mentor request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
