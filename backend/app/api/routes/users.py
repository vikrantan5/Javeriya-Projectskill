from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import UserResponse, UserUpdate
from app.utils.auth import get_current_user
from app.database import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user_id: str = Depends(get_current_user)):
    """Get current user profile"""
    try:
        db = get_db()
        
        user_result = db.table('users').select('*').eq('id', current_user_id).execute()
        
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user_result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: str):
    """Get user profile by ID"""
    try:
        db = get_db()
        
        user_result = db.table('users').select('*').eq('id', user_id).execute()
        
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user_result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.patch("/me")
async def update_user_profile(update_data: UserUpdate, current_user_id: str = Depends(get_current_user)):
    """Update current user profile"""
    try:
        db = get_db()
        
        # Prepare update data
        update_dict = {}
        if update_data.full_name is not None:
            update_dict['full_name'] = update_data.full_name
        if update_data.bio is not None:
            update_dict['bio'] = update_data.bio
        if update_data.profile_photo is not None:
            update_dict['profile_photo'] = update_data.profile_photo
        if update_data.location is not None:
            update_dict['location'] = update_data.location
        if update_data.phone is not None:
            update_dict['phone'] = update_data.phone
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Update user
        result = db.table('users').update(update_dict).eq('id', current_user_id).execute()
        
        return {
            "message": "Profile updated successfully",
            "user": result.data[0] if result.data else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )