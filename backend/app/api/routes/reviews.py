from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import ReviewCreate, ReviewResponse
from app.utils.auth import get_current_user
from app.database import get_db
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_review(review_data: ReviewCreate, current_user_id: str = Depends(get_current_user)):
    """Create a review for a session"""
    try:
        db = get_db()
        
        # Verify session exists and user is part of it
        session_result = db.table('learning_sessions').select('*').eq('id', str(review_data.session_id)).execute()
        
        if not session_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        session = session_result.data[0]
        
        # Verify user is mentor or learner in the session
        if session['mentor_id'] != current_user_id and session['learner_id'] != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You're not part of this session"
            )
        
        # Check if review already exists
        existing_review = db.table('reviews_ratings').select('id').eq('session_id', str(review_data.session_id)).eq('reviewer_id', current_user_id).execute()
        
        if existing_review.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already reviewed this session"
            )
        
        # Create review
        new_review = {
            'session_id': str(review_data.session_id),
            'reviewer_id': current_user_id,
            'reviewed_user_id': str(review_data.reviewed_user_id),
            'rating': review_data.rating,
            'review_text': review_data.review_text
        }
        
        result = db.table('reviews_ratings').insert(new_review).execute()
        
        # Update user's average rating
        await update_user_rating(str(review_data.reviewed_user_id), db)
        
        return {
            "message": "Review submitted successfully",
            "review": result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating review: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

async def update_user_rating(user_id: str, db):
    """Update user's average rating and total ratings"""
    try:
        # Get all reviews for user
        reviews_result = db.table('reviews_ratings').select('rating').eq('reviewed_user_id', user_id).execute()
        
        if not reviews_result.data:
            return
        
        ratings = [r['rating'] for r in reviews_result.data]
        average_rating = sum(ratings) / len(ratings)
        total_ratings = len(ratings)
        
        # Update user
        db.table('users').update({
            'average_rating': round(average_rating, 2),
            'total_ratings': total_ratings
        }).eq('id', user_id).execute()
    
    except Exception as e:
        logger.error(f"Error updating user rating: {str(e)}")

@router.get("/user/{user_id}", response_model=List[dict])
async def get_user_reviews(user_id: str):
    """Get all reviews for a user"""
    try:
        db = get_db()
        
        reviews_result = db.table('reviews_ratings').select('*').eq('reviewed_user_id', user_id).order('created_at', desc=True).execute()
        
        if not reviews_result.data:
            return []
        
        # Get reviewer details
        reviewer_ids = list(set([r['reviewer_id'] for r in reviews_result.data]))
        users_result = db.table('users').select('id, username, full_name, profile_photo').in_('id', reviewer_ids).execute()
        
        users_dict = {user['id']: user for user in users_result.data}
        
        results = []
        for review in reviews_result.data:
            reviewer = users_dict.get(review['reviewer_id'])
            if reviewer:
                results.append({
                    'review': review,
                    'reviewer': reviewer
                })
        
        return results
    
    except Exception as e:
        logger.error(f"Error fetching user reviews: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/session/{session_id}", response_model=List[ReviewResponse])
async def get_session_reviews(session_id: str):
    """Get reviews for a specific session"""
    try:
        db = get_db()
        
        reviews_result = db.table('reviews_ratings').select('*').eq('session_id', session_id).execute()
        
        return reviews_result.data if reviews_result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching session reviews: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )