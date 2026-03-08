from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import SkillCreate, SkillResponse
from app.utils.auth import get_current_user
from app.database import get_db
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/skills", tags=["Skills"])

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_skill(skill_data: SkillCreate, current_user_id: str = Depends(get_current_user)):
    """Add a new skill to user profile"""
    try:
        db = get_db()
        
        # Check if skill already exists for user
        existing_skill = db.table('user_skills').select('id').eq('user_id', current_user_id).eq('skill_name', skill_data.skill_name).eq('skill_type', skill_data.skill_type).execute()
        
        if existing_skill.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have this skill added"
            )
        
        # Create new skill
        new_skill = {
            'user_id': current_user_id,
            'skill_name': skill_data.skill_name,
            'skill_type': skill_data.skill_type,
            'skill_level': skill_data.skill_level,
            'is_verified': False
        }
        
        result = db.table('user_skills').insert(new_skill).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add skill"
            )
        
        return {
            "message": "Skill added successfully",
            "skill": result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding skill: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/my-skills", response_model=List[SkillResponse])
async def get_my_skills(current_user_id: str = Depends(get_current_user)):
    """Get all skills for current user"""
    try:
        db = get_db()
        
        result = db.table('user_skills').select('*').eq('user_id', current_user_id).execute()
        
        return result.data if result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching skills: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/search", response_model=List[dict])
async def search_skills(skill_name: str, skill_type: str = "offered"):
    """Search for users by skill"""
    try:
        db = get_db()
        
        # Get users with the specified skill
        skills_result = db.table('user_skills').select('user_id, skill_name, skill_level, is_verified').eq('skill_name', skill_name).eq('skill_type', skill_type).execute()
        
        if not skills_result.data:
            return []
        
        # Get user details for each skill
        user_ids = [skill['user_id'] for skill in skills_result.data]
        users_result = db.table('users').select('id, username, full_name, profile_photo, average_rating, total_ratings, bio').in_('id', user_ids).execute()
        
        # Merge skill and user data
        users_dict = {user['id']: user for user in users_result.data}
        
        results = []
        for skill in skills_result.data:
            user = users_dict.get(skill['user_id'])
            if user:
                results.append({
                    'user': user,
                    'skill_level': skill['skill_level'],
                    'is_verified': skill['is_verified']
                })
        
        return results
    
    except Exception as e:
        logger.error(f"Error searching skills: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{skill_id}")
async def delete_skill(skill_id: str, current_user_id: str = Depends(get_current_user)):
    """Delete a skill from user profile"""
    try:
        db = get_db()
        
        # Verify skill belongs to user
        skill_result = db.table('user_skills').select('*').eq('id', skill_id).eq('user_id', current_user_id).execute()
        
        if not skill_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill not found or doesn't belong to you"
            )
        
        # Delete skill
        db.table('user_skills').delete().eq('id', skill_id).execute()
        
        return {"message": "Skill deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting skill: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/user/{user_id}", response_model=List[SkillResponse])
async def get_user_skills(user_id: str):
    """Get all skills for a specific user"""
    try:
        db = get_db()
        
        result = db.table('user_skills').select('*').eq('user_id', user_id).execute()
        
        return result.data if result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching user skills: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )