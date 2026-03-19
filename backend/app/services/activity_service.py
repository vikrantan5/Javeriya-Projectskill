"""
Activity Service - Track all user activities
Creates activity logs for dashboard and activity feed
"""
from app.database import get_db
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

def utc_now_iso() -> str:
    """Get current UTC time in ISO format"""
    return datetime.now(timezone.utc).isoformat()

class ActivityService:
    """Service for creating and managing activity logs"""
    
    @staticmethod
    def create_activity(
        user_id: str,
        activity_type: str,
        title: str,
        description: str = None,
        reference_id: str = None,
        reference_type: str = None,
        metadata: dict = None
    ):
        """
        Create an activity log entry
        
        Activity Types:
        - task_created
        - task_accepted
        - task_assigned
        - task_submitted
        - task_completed
        - session_booked
        - session_completed
        - skill_exchange_matched
        - payment_made
        - payment_received
        """
        try:
            db = get_db()
            
            activity_data = {
                'user_id': user_id,
                'activity_type': activity_type,
                'title': title,
                'description': description,
                'reference_id': reference_id,
                'reference_type': reference_type,
                'metadata': metadata or {}
            }
            
            result = db.table('user_activities').insert(activity_data).execute()
            
            logger.info(f"Activity created: {activity_type} for user {user_id}")
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"Error creating activity: {str(e)}")
            # Don't raise exception - activities are non-critical
            return None
    
    @staticmethod
    def log_task_created(user_id: str, task_id: str, task_title: str):
        """Log task creation activity"""
        return ActivityService.create_activity(
            user_id=user_id,
            activity_type='task_created',
            title=f'Created task: {task_title}',
            reference_id=task_id,
            reference_type='task'
        )
    
    @staticmethod
    def log_task_accepted(user_id: str, task_id: str, task_title: str):
        """Log task acceptance activity"""
        return ActivityService.create_activity(
            user_id=user_id,
            activity_type='task_accepted',
            title=f'Applied for task: {task_title}',
            reference_id=task_id,
            reference_type='task'
        )
    
    @staticmethod
    def log_task_assigned(acceptor_id: str, creator_id: str, task_id: str, task_title: str):
        """Log task assignment - creates activity for both users"""
        # Activity for acceptor
        ActivityService.create_activity(
            user_id=acceptor_id,
            activity_type='task_assigned',
            title=f'Assigned to task: {task_title}',
            description='You have been selected to work on this task',
            reference_id=task_id,
            reference_type='task'
        )
        
        # Activity for creator
        ActivityService.create_activity(
            user_id=creator_id,
            activity_type='task_assigned',
            title=f'Assigned task: {task_title}',
            description='Task has been assigned to a worker',
            reference_id=task_id,
            reference_type='task'
        )
    
    @staticmethod
    def log_task_submitted(acceptor_id: str, creator_id: str, task_id: str, task_title: str):
        """Log task submission - creates activity for both users"""
        # Activity for acceptor
        ActivityService.create_activity(
            user_id=acceptor_id,
            activity_type='task_submitted',
            title=f'Submitted work for: {task_title}',
            description='Waiting for review',
            reference_id=task_id,
            reference_type='task'
        )
        
        # Activity for creator
        ActivityService.create_activity(
            user_id=creator_id,
            activity_type='task_submitted',
            title=f'Work submitted for: {task_title}',
            description='Review the submission and approve payment',
            reference_id=task_id,
            reference_type='task'
        )
    
    @staticmethod
    def log_task_completed(acceptor_id: str, creator_id: str, task_id: str, task_title: str, amount: float):
        """Log task completion - creates activity for both users"""
        # Activity for acceptor
        ActivityService.create_activity(
            user_id=acceptor_id,
            activity_type='task_completed',
            title=f'Task completed: {task_title}',
            description=f'Payment of ₹{amount} received',
            reference_id=task_id,
            reference_type='task',
            metadata={'amount': amount}
        )
        
        # Activity for creator
        ActivityService.create_activity(
            user_id=creator_id,
            activity_type='task_completed',
            title=f'Task completed: {task_title}',
            description=f'Payment of ₹{amount} released',
            reference_id=task_id,
            reference_type='task',
            metadata={'amount': amount}
        )
    
    @staticmethod
    def log_payment(payer_id: str, payee_id: str, amount: float, reason: str, reference_id: str = None):
        """Log payment activities"""
        # Activity for payer
        ActivityService.create_activity(
            user_id=payer_id,
            activity_type='payment_made',
            title=f'Payment made: ₹{amount}',
            description=reason,
            reference_id=reference_id,
            reference_type='payment',
            metadata={'amount': amount}
        )
        
        # Activity for payee
        ActivityService.create_activity(
            user_id=payee_id,
            activity_type='payment_received',
            title=f'Payment received: ₹{amount}',
            description=reason,
            reference_id=reference_id,
            reference_type='payment',
            metadata={'amount': amount}
        )
    
    @staticmethod
    def log_session_activity(user_id: str, session_id: str, skill_name: str, activity_type: str):
        """Log session-related activities"""
        type_titles = {
            'session_booked': f'Session booked: {skill_name}',
            'session_completed': f'Session completed: {skill_name}',
            'session_cancelled': f'Session cancelled: {skill_name}'
        }
        
        return ActivityService.create_activity(
            user_id=user_id,
            activity_type=activity_type,
            title=type_titles.get(activity_type, f'Session activity: {skill_name}'),
            reference_id=session_id,
            reference_type='session'
        )

# Create singleton instance
activity_service = ActivityService()
