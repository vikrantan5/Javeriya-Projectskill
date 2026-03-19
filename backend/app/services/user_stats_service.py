"""
User Statistics Service
Computes detailed user statistics for AI decision making and profile display
"""
from app.database import get_db
from typing import Dict, List, Optional
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class UserStatsService:
    """Service for computing and retrieving user statistics"""
    
    def get_user_statistics(self, user_id: str) -> Dict:
        """
        Get comprehensive user statistics
        
        Returns:
            - tasks_completed: Total tasks completed
            - tasks_failed: Tasks not completed/cancelled
            - success_rate: % of tasks successfully completed
            - avg_rating: Average rating received
            - total_reviews: Total number of reviews
            - on_time_percentage: % of tasks delivered on time
            - late_submissions: Number of late submissions
            - skills: List of user skills with verification status
            - recent_reviews: Last 5 reviews with details
            - connection_count: Number of connections
            - sessions_completed: Number of learning sessions completed
        """
        try:
            db = get_db()
            
            # Get basic user data
            user_result = db.table('users').select('*').eq('id', user_id).execute()
            if not user_result.data:
                return None
            
            user = user_result.data[0]
            
            # Get tasks completed
            completed_tasks = db.table('tasks').select('id, deadline, created_at').or_(
                f'acceptor_id.eq.{user_id},assigned_user_id.eq.{user_id}'
            ).eq('status', 'completed').execute()
            
            tasks_completed = len(completed_tasks.data or [])
            
            # Get tasks failed/cancelled
            failed_tasks = db.table('tasks').select('id').or_(
                f'acceptor_id.eq.{user_id},assigned_user_id.eq.{user_id}'
            ).in_('status', ['cancelled', 'rejected']).execute()
            
            tasks_failed = len(failed_tasks.data or [])
            
            # Calculate success rate
            total_tasks_attempted = tasks_completed + tasks_failed
            success_rate = (tasks_completed / total_tasks_attempted * 100) if total_tasks_attempted > 0 else 0
            
            # Calculate on-time delivery
            on_time_count = 0
            late_count = 0
            
            for task in (completed_tasks.data or []):
                if task.get('deadline'):
                    # Get submission time
                    submission_result = db.table('task_submissions').select('submitted_at').eq('task_id', task['id']).eq('submitter_id', user_id).order('submitted_at', desc=False).limit(1).execute()
                    
                    if submission_result.data:
                        submitted_at = datetime.fromisoformat(submission_result.data[0]['submitted_at'].replace('Z', '+00:00'))
                        deadline = datetime.fromisoformat(task['deadline'].replace('Z', '+00:00'))
                        
                        if submitted_at <= deadline:
                            on_time_count += 1
                        else:
                            late_count += 1
            
            on_time_percentage = (on_time_count / tasks_completed * 100) if tasks_completed > 0 else 0
            
            # Get ratings data
            ratings_result = db.table('ratings').select('rating, review, created_at, giver_id').eq('receiver_id', user_id).order('created_at', desc=True).execute()
            
            ratings_data = ratings_result.data or []
            avg_rating = user.get('average_rating', 0.0)
            total_reviews = len(ratings_data)
            
            # Get recent reviews with giver details
            recent_reviews = []
            for rating in ratings_data[:5]:
                if rating.get('review'):
                    giver_result = db.table('users').select('id, username, full_name, profile_photo').eq('id', rating['giver_id']).execute()
                    giver = giver_result.data[0] if giver_result.data else None
                    
                    recent_reviews.append({
                        'rating': rating['rating'],
                        'review': rating['review'],
                        'created_at': rating['created_at'],
                        'giver': giver
                    })
            
            # Get skills
            skills_result = db.table('user_skills').select('skill_name, skill_level, is_verified').eq('user_id', user_id).execute()
            skills = skills_result.data or []
            
            # Get connections count
            try:
                connections_as_initiator = db.table('connections').select('id').eq('user_id', user_id).eq('status', 'accepted').execute()
                connections_as_receiver = db.table('connections').select('id').eq('connected_user_id', user_id).eq('status', 'accepted').execute()
                connection_count = len((connections_as_initiator.data or [])) + len((connections_as_receiver.data or []))
            except Exception as conn_error:
                logger.warning(f"Connections table not available: {conn_error}")
                connection_count = 0
            
            # Get sessions completed
            mentor_sessions = db.table('learning_sessions').select('id').eq('mentor_id', user_id).eq('status', 'completed').execute()
            learner_sessions = db.table('learning_sessions').select('id').eq('learner_id', user_id).eq('status', 'completed').execute()
            sessions_completed = len((mentor_sessions.data or [])) + len((learner_sessions.data or []))
            
            return {
                'user_id': user_id,
                'tasks_completed': tasks_completed,
                'tasks_failed': tasks_failed,
                'total_tasks_attempted': total_tasks_attempted,
                'success_rate': round(success_rate, 1),
                'avg_rating': avg_rating,
                'total_reviews': total_reviews,
                'on_time_percentage': round(on_time_percentage, 1),
                'late_submissions': late_count,
                'recent_reviews': recent_reviews,
                'skills': skills,
                'connection_count': connection_count,
                'sessions_completed': sessions_completed,
                'profile_data': {
                    'id': user['id'],
                    'username': user['username'],
                    'full_name': user.get('full_name'),
                    'bio': user.get('bio'),
                    'profile_photo': user.get('profile_photo'),
                    'location': user.get('location'),
                    'is_verified': user.get('is_verified', False)
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting user statistics: {str(e)}")
            raise

user_stats_service = UserStatsService()