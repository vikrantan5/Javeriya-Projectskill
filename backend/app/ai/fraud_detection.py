from app.database import get_db
import logging
from datetime import datetime, timedelta
from typing import Dict, Any

logger = logging.getLogger(__name__)

class FraudDetector:
    def __init__(self):
        self.cancellation_threshold = 3  # Max cancellations in 7 days
        self.spam_threshold = 5  # Max similar actions in 1 hour
    
    async def check_repeated_cancellations(self, user_id: str) -> Dict[str, Any]:
        """Check if user has too many session cancellations"""
        try:
            db = get_db()
            
            # Get cancellations in last 7 days
            seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
            
            cancelled_sessions = db.table('learning_sessions').select('id').eq('status', 'cancelled').or_(
                f'mentor_id.eq.{user_id},learner_id.eq.{user_id}'
            ).gte('created_at', seven_days_ago).execute()
            
            cancel_count = len(cancelled_sessions.data) if cancelled_sessions.data else 0
            
            if cancel_count >= self.cancellation_threshold:
                await self.log_fraud(
                    user_id=user_id,
                    fraud_type='repeated_cancellation',
                    severity='medium',
                    description=f'User cancelled {cancel_count} sessions in last 7 days',
                    confidence_score=0.75
                )
                return {
                    'is_suspicious': True,
                    'reason': 'Too many cancellations',
                    'count': cancel_count
                }
            
            return {'is_suspicious': False}
        
        except Exception as e:
            logger.error(f"Error checking cancellations: {str(e)}")
            return {'is_suspicious': False, 'error': str(e)}
    
    async def check_spam_behavior(self, user_id: str, action_type: str) -> Dict[str, Any]:
        """Check for spam behavior (too many similar actions)"""
        try:
            db = get_db()
            
            # Check based on action type
            one_hour_ago = (datetime.utcnow() - timedelta(hours=1)).isoformat()
            
            if action_type == 'session_request':
                recent_requests = db.table('session_requests').select('id').eq('sender_id', user_id).gte('created_at', one_hour_ago).execute()
                count = len(recent_requests.data) if recent_requests.data else 0
            elif action_type == 'task_creation':
                recent_tasks = db.table('tasks').select('id').eq('creator_id', user_id).gte('created_at', one_hour_ago).execute()
                count = len(recent_tasks.data) if recent_tasks.data else 0
            else:
                count = 0
            
            if count >= self.spam_threshold:
                await self.log_fraud(
                    user_id=user_id,
                    fraud_type='spam_behavior',
                    severity='low',
                    description=f'User performed {action_type} {count} times in last hour',
                    confidence_score=0.65
                )
                return {
                    'is_suspicious': True,
                    'reason': 'Spam behavior detected',
                    'count': count
                }
            
            return {'is_suspicious': False}
        
        except Exception as e:
            logger.error(f"Error checking spam behavior: {str(e)}")
            return {'is_suspicious': False, 'error': str(e)}
    
    async def check_fake_submissions(self, user_id: str) -> Dict[str, Any]:
        """Check if user has pattern of fake task submissions"""
        try:
            db = get_db()
            
            # Get user's submissions
            submissions = db.table('task_submissions').select('is_approved').eq('submitter_id', user_id).execute()
            
            if not submissions.data or len(submissions.data) < 3:
                return {'is_suspicious': False}  # Not enough data
            
            # Calculate rejection rate
            total = len(submissions.data)
            approved = sum(1 for s in submissions.data if s.get('is_approved') is True)
            rejected = sum(1 for s in submissions.data if s.get('is_approved') is False)
            
            rejection_rate = rejected / total if total > 0 else 0
            
            if rejection_rate > 0.6 and total >= 5:  # More than 60% rejected
                await self.log_fraud(
                    user_id=user_id,
                    fraud_type='fake_submissions',
                    severity='high',
                    description=f'High rejection rate: {rejection_rate:.2%} ({rejected}/{total})',
                    confidence_score=0.80
                )
                return {
                    'is_suspicious': True,
                    'reason': 'High submission rejection rate',
                    'rejection_rate': rejection_rate
                }
            
            return {'is_suspicious': False}
        
        except Exception as e:
            logger.error(f"Error checking fake submissions: {str(e)}")
            return {'is_suspicious': False, 'error': str(e)}
    
    async def log_fraud(self, user_id: str, fraud_type: str, severity: str, description: str, confidence_score: float):
        """Log fraud detection to database"""
        try:
            db = get_db()
            
            # Determine action
            action_map = {
                'low': 'warning',
                'medium': 'rating_penalty',
                'high': 'temporary_ban',
                'critical': 'admin_review'
            }
            
            fraud_log = {
                'user_id': user_id,
                'fraud_type': fraud_type,
                'severity': severity,
                'description': description,
                'confidence_score': confidence_score,
                'action_taken': action_map.get(severity, 'warning')
            }
            
            db.table('fraud_logs').insert(fraud_log).execute()
            logger.warning(f"Fraud detected: {fraud_type} for user {user_id} (severity: {severity})")
            
            # Apply automatic penalty for high severity
            if severity in ['high', 'critical']:
                # Reduce user rating or trigger admin review
                pass  # Implement penalty logic
        
        except Exception as e:
            logger.error(f"Error logging fraud: {str(e)}")

fraud_detector = FraudDetector()