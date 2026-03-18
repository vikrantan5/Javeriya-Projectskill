from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from app.utils.auth import get_current_user
from app.database import get_db
from typing import Optional, List
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ratings", tags=["Ratings"])

class RatingCreate(BaseModel):
    receiver_id: str
    task_id: Optional[str] = None
    session_id: Optional[str] = None
    rating: int = Field(..., ge=1, le=5, description="Rating must be between 1 and 5")
    review: Optional[str] = None

class RatingResponse(BaseModel):
    id: str
    giver_id: str
    receiver_id: str
    task_id: Optional[str]
    session_id: Optional[str]
    rating: int
    review: Optional[str]
    created_at: str

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

@router.post("/add", response_model=dict)
async def add_rating(
    rating_data: RatingCreate,
    current_user_id: str = Depends(get_current_user)
):
    """
    Add a rating for a user after task completion or session
    Rules:
    - Only allow rating after completion
    - Prevent duplicate ratings
    - Either task_id OR session_id must exist
    """
    try:
        db = get_db()
        
        # Validate that either task_id or session_id is provided
        if not rating_data.task_id and not rating_data.session_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either task_id or session_id must be provided"
            )
        
        # Cannot rate yourself
        if rating_data.receiver_id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot rate yourself"
            )
        
        # Verify task or session exists and is completed
        if rating_data.task_id:
            # Check task exists and is completed
            task_result = db.table('tasks').select('*').eq('id', rating_data.task_id).execute()
            
            if not task_result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Task not found"
                )
            
            task = task_result.data[0]
            
            # Verify task is completed
            if task['status'] != 'completed':
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Can only rate after task completion"
                )
            
            # Verify current user is involved in the task
            if task['creator_id'] != current_user_id and task.get('acceptor_id') != current_user_id and task.get('assigned_user_id') != current_user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not involved in this task"
                )
            
            # Check for duplicate rating
            existing_rating = db.table('ratings').select('*').eq('task_id', rating_data.task_id).eq('giver_id', current_user_id).execute()
            
            if existing_rating.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You have already rated this task"
                )
        
        elif rating_data.session_id:
            # Check learning session
            session_result = db.table('learning_sessions').select('*').eq('id', rating_data.session_id).execute()
            
            if session_result.data:
                session = session_result.data[0]
                
                # Verify session is completed
                if session['status'] != 'completed':
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Can only rate after session completion"
                    )
                
                # Verify current user is involved
                if session['mentor_id'] != current_user_id and session['learner_id'] != current_user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You are not involved in this session"
                    )
            else:
                # Check skill exchange session
                skill_session_result = db.table('skill_exchange_sessions').select('*').eq('id', rating_data.session_id).execute()
                
                if not skill_session_result.data:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Session not found"
                    )
                
                session = skill_session_result.data[0]
                
                # Verify current user is participant
                if session['participant1_id'] != current_user_id and session['participant2_id'] != current_user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You are not involved in this session"
                    )
            
            # Check for duplicate rating
            existing_rating = db.table('ratings').select('*').eq('session_id', rating_data.session_id).eq('giver_id', current_user_id).execute()
            
            if existing_rating.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You have already rated this session"
                )
        
        # Create rating
        new_rating = {
            'giver_id': current_user_id,
            'receiver_id': rating_data.receiver_id,
            'task_id': rating_data.task_id,
            'session_id': rating_data.session_id,
            'rating': rating_data.rating,
            'review': rating_data.review,
            'created_at': utc_now_iso()
        }
        
        result = db.table('ratings').insert(new_rating).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create rating"
            )
        
        # Update receiver's average rating
        await update_user_average_rating(rating_data.receiver_id)
        
        # Create notification for receiver
        db.table('notifications').insert({
            'user_id': rating_data.receiver_id,
            'title': 'New Rating Received! ⭐',
            'message': f'You received a {rating_data.rating}-star rating',
            'notification_type': 'rating',
            'reference_id': result.data[0]['id'],
            'reference_type': 'rating'
        }).execute()
        
        return {
            "message": "Rating submitted successfully",
            "rating": result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding rating: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

async def update_user_average_rating(user_id: str):
    """Calculate and update user's average rating"""
    try:
        db = get_db()
        
        # Get all ratings for user
        ratings_result = db.table('ratings').select('rating').eq('receiver_id', user_id).execute()
        
        if ratings_result.data and len(ratings_result.data) > 0:
            ratings = [r['rating'] for r in ratings_result.data]
            average_rating = round(sum(ratings) / len(ratings), 1)
            
            # Update user's average rating
            db.table('users').update({
                'average_rating': average_rating,
                'total_ratings': len(ratings)
            }).eq('id', user_id).execute()
            
            logger.info(f"Updated average rating for user {user_id}: {average_rating}")
    
    except Exception as e:
        logger.error(f"Error updating average rating: {str(e)}")

@router.get("/received", response_model=List[dict])
async def get_received_ratings(
    limit: int = 20,
    current_user_id: str = Depends(get_current_user)
):
    """Get ratings received by current user"""
    try:
        db = get_db()
        
        # Get ratings with giver details
        ratings_result = db.table('ratings').select('*').eq('receiver_id', current_user_id).order('created_at', desc=True).limit(limit).execute()
        
        if not ratings_result.data:
            return []
        
        # Get giver details
        giver_ids = [r['giver_id'] for r in ratings_result.data]
        users_result = db.table('users').select('id, username, full_name, profile_photo').in_('id', giver_ids).execute()
        users_dict = {user['id']: user for user in (users_result.data or [])}
        
        # Combine data
        ratings_with_users = []
        for rating in ratings_result.data:
            giver = users_dict.get(rating['giver_id'])
            ratings_with_users.append({
                **rating,
                'giver': giver
            })
        
        return ratings_with_users
    
    except Exception as e:
        logger.error(f"Error fetching received ratings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/given", response_model=List[dict])
async def get_given_ratings(
    limit: int = 20,
    current_user_id: str = Depends(get_current_user)
):
    """Get ratings given by current user"""
    try:
        db = get_db()
        
        ratings_result = db.table('ratings').select('*').eq('giver_id', current_user_id).order('created_at', desc=True).limit(limit).execute()
        
        if not ratings_result.data:
            return []
        
        # Get receiver details
        receiver_ids = [r['receiver_id'] for r in ratings_result.data]
        users_result = db.table('users').select('id, username, full_name, profile_photo').in_('id', receiver_ids).execute()
        users_dict = {user['id']: user for user in (users_result.data or [])}
        
        # Combine data
        ratings_with_users = []
        for rating in ratings_result.data:
            receiver = users_dict.get(rating['receiver_id'])
            ratings_with_users.append({
                **rating,
                'receiver': receiver
            })
        
        return ratings_with_users
    
    except Exception as e:
        logger.error(f"Error fetching given ratings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/user/{user_id}", response_model=dict)
async def get_user_ratings(user_id: str):
    """Get rating summary for a specific user"""
    try:
        db = get_db()
        
        # Get all ratings for user
        ratings_result = db.table('ratings').select('*').eq('receiver_id', user_id).order('created_at', desc=True).execute()
        
        if not ratings_result.data:
            return {
                "average_rating": 0.0,
                "total_ratings": 0,
                "rating_breakdown": {
                    "5": 0, "4": 0, "3": 0, "2": 0, "1": 0
                },
                "recent_reviews": []
            }
        
        ratings = ratings_result.data
        
        # Calculate average
        total_rating = sum([r['rating'] for r in ratings])
        average_rating = round(total_rating / len(ratings), 1)
        
        # Rating breakdown
        rating_breakdown = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
        for rating in ratings:
            rating_breakdown[str(rating['rating'])] += 1
        
        # Get recent reviews with text
        recent_reviews = [
            {
                **r,
                'giver_username': None  # Can fetch if needed
            }
            for r in ratings[:5] if r.get('review')
        ]
        
        return {
            "average_rating": average_rating,
            "total_ratings": len(ratings),
            "rating_breakdown": rating_breakdown,
            "recent_reviews": recent_reviews
        }
    
    except Exception as e:
        logger.error(f"Error fetching user ratings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
