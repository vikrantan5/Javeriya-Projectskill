from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.utils.auth import get_current_user
from app.services.roadmap_generator_service import roadmap_generator_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/roadmap", tags=["Learning Roadmap"])

class RoadmapRequest(BaseModel):
    career_goal: str
    current_skills: Optional[List[str]] = None

class ProgressUpdate(BaseModel):
    current_step: int
    completion_percentage: float

@router.post("/generate")
async def generate_roadmap(
    request: RoadmapRequest,
    current_user_id: str = Depends(get_current_user)
):
    """
    Generate a personalized learning roadmap using AI
    
    Args:
        career_goal: Target career or role
        current_skills: Optional list of current skills
    """
    try:
        result = roadmap_generator_service.generate_roadmap(
            user_id=current_user_id,
            career_goal=request.career_goal,
            current_skills=request.current_skills
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error generating roadmap: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-roadmaps")
async def get_my_roadmaps(
    active_only: bool = True,
    current_user_id: str = Depends(get_current_user)
):
    """Get all roadmaps for the current user"""
    try:
        roadmaps = roadmap_generator_service.get_user_roadmaps(current_user_id, active_only)
        
        return {
            "total": len(roadmaps),
            "roadmaps": roadmaps
        }
        
    except Exception as e:
        logger.error(f"Error getting roadmaps: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{roadmap_id}")
async def get_roadmap(
    roadmap_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Get a specific roadmap by ID"""
    try:
        from app.database import get_db
        db = get_db()
        
        result = db.table('learning_roadmaps').select('*').eq('id', roadmap_id).eq('user_id', current_user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting roadmap: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{roadmap_id}/progress")
async def update_roadmap_progress(
    roadmap_id: str,
    progress: ProgressUpdate,
    current_user_id: str = Depends(get_current_user)
):
    """Update progress on a roadmap"""
    try:
        success = roadmap_generator_service.update_progress(
            roadmap_id=roadmap_id,
            user_id=current_user_id,
            current_step=progress.current_step,
            completion_percentage=progress.completion_percentage
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Roadmap not found or unauthorized")
        
        return {
            "message": "Progress updated successfully",
            "current_step": progress.current_step,
            "completion_percentage": progress.completion_percentage
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating progress: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{roadmap_id}/complete")
async def complete_roadmap(
    roadmap_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Mark a roadmap as completed"""
    try:
        success = roadmap_generator_service.complete_roadmap(roadmap_id, current_user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Roadmap not found or unauthorized")
        
        return {
            "message": "Congratulations! Roadmap completed successfully",
            "tokens_earned": 200
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing roadmap: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
