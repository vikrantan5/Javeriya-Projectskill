"""
Reputation Service - Calculate Trust Scores for Users
"""
from app.database import get_db
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

class ReputationService:
    """Service for calculating and managing user reputation/trust scores"""
    
    @staticmethod
    def calculate_trust_score(user_id: str) -> float:
        """
        Calculate Trust Score for a user based on multiple factors
        
        Trust Score Formula:
        - Sessions Completed (35%)
        - Average Rating (30%)
        - Verified Skills Count (20%)
        - Response Rate (15%)
        
        Returns: Score normalized to 0-100 scale
        """
        try:
            db = get_db()
            
            # Get user data
            user_result = db.table('users').select('*').eq('id', user_id).execute()
            if not user_result.data:
                logger.error(f"User {user_id} not found")
                return 0.0
            
            user = user_result.data[0]
            
            # Get verified skills count
            verified_skills_result = db.table('user_skills').select('id').eq('user_id', user_id).eq('is_verified', True).execute()
            verified_skills_count = len(verified_skills_result.data) if verified_skills_result.data else 0
            
            # Get session completion data
            completed_sessions_result = db.table('learning_sessions').select('id').or_(f'mentor_id.eq.{user_id},learner_id.eq.{user_id}').eq('status', 'completed').execute()
            sessions_completed = len(completed_sessions_result.data) if completed_sessions_result.data else 0
            
            # Get total session requests to calculate response rate
            total_requests_result = db.table('session_requests').select('id').eq('receiver_id', user_id).execute()
            total_requests = len(total_requests_result.data) if total_requests_result.data else 0
            
            responded_requests_result = db.table('session_requests').select('id').eq('receiver_id', user_id).in_('status', ['accepted', 'rejected']).execute()
            responded_requests = len(responded_requests_result.data) if responded_requests_result.data else 0
            
            response_rate = (responded_requests / total_requests * 100) if total_requests > 0 else 100
            
            # Get average rating
            average_rating = float(user.get('average_rating', 0))
            
            # Normalize factors to 0-100 scale
            sessions_score = min(sessions_completed * 2, 100)  # Cap at 50 sessions = 100 points
            rating_score = (average_rating / 5.0) * 100  # Convert 0-5 to 0-100
            skills_score = min(verified_skills_count * 10, 100)  # Cap at 10 skills = 100 points
            response_score = response_rate  # Already in 0-100
            
            # Calculate weighted trust score
            trust_score = (
                sessions_score * 0.35 +
                rating_score * 0.30 +
                skills_score * 0.20 +
                response_score * 0.15
            )
            
            # Update user record with new trust score
            db.table('users').update({
                'trust_score': round(trust_score, 2),
                'verified_skills_count': verified_skills_count,
                'response_rate': round(response_rate, 2)
            }).eq('id', user_id).execute()
            
            logger.info(f"Trust score calculated for user {user_id}: {trust_score:.2f}")
            
            return round(trust_score, 2)
            
        except Exception as e:
            logger.error(f"Error calculating trust score for user {user_id}: {str(e)}")
            return 0.0
    
    @staticmethod
    def get_mentor_badge(trust_score: float) -> Dict[str, str]:
        """
        Get mentor badge based on trust score
        
        Returns: Dict with badge name and color
        """
        if trust_score >= 90:
            return {
                "badge": "Gold Mentor",
                "color": "gold",
                "icon": "🏆"
            }
        elif trust_score >= 75:
            return {
                "badge": "Silver Mentor",
                "color": "silver",
                "icon": "🥈"
            }
        elif trust_score >= 60:
            return {
                "badge": "Bronze Mentor",
                "color": "bronze",
                "icon": "🥉"
            }
        else:
            return {
                "badge": "Aspiring Mentor",
                "color": "gray",
                "icon": "⭐"
            }
    
    @staticmethod
    def update_user_stats_after_session(session_id: str) -> None:
        """
        Update user statistics after a session is completed
        """
        try:
            db = get_db()
            
            # Get session data
            session_result = db.table('learning_sessions').select('*').eq('id', session_id).execute()
            if not session_result.data:
                return
            
            session = session_result.data[0]
            mentor_id = session['mentor_id']
            learner_id = session['learner_id']
            
            # Update mentor's total sessions
            db.table('users').update({
                'total_sessions': db.raw('total_sessions + 1')
            }).eq('id', mentor_id).execute()
            
            # Update learner's total sessions
            db.table('users').update({
                'total_sessions': db.raw('total_sessions + 1')
            }).eq('id', learner_id).execute()
            
            # Recalculate trust scores for both users
            ReputationService.calculate_trust_score(mentor_id)
            ReputationService.calculate_trust_score(learner_id)
            
            logger.info(f"Updated stats for session {session_id}")
            
        except Exception as e:
            logger.error(f"Error updating user stats: {str(e)}")
    
    @staticmethod
    def update_rating_after_review(user_id: str) -> None:
        """
        Recalculate average rating for a user after a new review
        """
        try:
            db = get_db()
            
            # Get all reviews for this user
            reviews_result = db.table('reviews_ratings').select('rating').eq('reviewed_user_id', user_id).execute()
            
            if not reviews_result.data:
                return
            
            reviews = reviews_result.data
            total_ratings = len(reviews)
            average_rating = sum(r['rating'] for r in reviews) / total_ratings
            
            # Update user record
            db.table('users').update({
                'average_rating': round(average_rating, 2),
                'total_ratings': total_ratings
            }).eq('id', user_id).execute()
            
            # Recalculate trust score
            ReputationService.calculate_trust_score(user_id)
            
            logger.info(f"Updated rating for user {user_id}: {average_rating:.2f}")
            
        except Exception as e:
            logger.error(f"Error updating rating: {str(e)}")


# Initialize service instance
reputation_service = ReputationService()
