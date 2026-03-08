from app.database import get_db
from datetime import datetime, timedelta
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class FraudDetectionService:
    def __init__(self):
        self.thresholds = {
            'max_cancellations_per_week': 3,
            'min_session_completion_rate': 0.7,
            'max_task_rejections_per_month': 5,
            'suspicious_rating_pattern_threshold': 0.3,
            'spam_message_keywords': ['spam', 'scam', 'fake', 'click here', 'buy now']
        }
    
    async def check_user_behavior(self, user_id: str) -> Dict[str, Any]:
        """Comprehensive fraud check for a user"""
        try:
            db = get_db()
            
            # Initialize fraud report
            fraud_report = {
                'user_id': user_id,
                'is_suspicious': False,
                'fraud_indicators': [],
                'severity': 'low',
                'recommended_action': 'none'
            }
            
            # Check 1: Session cancellation pattern
            cancellation_check = await self._check_session_cancellations(user_id, db)
            if cancellation_check['is_suspicious']:
                fraud_report['fraud_indicators'].append(cancellation_check)
            
            # Check 2: Task submission quality
            task_check = await self._check_task_submissions(user_id, db)
            if task_check['is_suspicious']:
                fraud_report['fraud_indicators'].append(task_check)
            
            # Check 3: Rating patterns
            rating_check = await self._check_rating_patterns(user_id, db)
            if rating_check['is_suspicious']:
                fraud_report['fraud_indicators'].append(rating_check)
            
            # Check 4: Spam behavior
            spam_check = await self._check_spam_behavior(user_id, db)
            if spam_check['is_suspicious']:
                fraud_report['fraud_indicators'].append(spam_check)
            
            # Calculate overall severity
            if len(fraud_report['fraud_indicators']) > 0:
                fraud_report['is_suspicious'] = True
                
                if len(fraud_report['fraud_indicators']) >= 3:
                    fraud_report['severity'] = 'critical'
                    fraud_report['recommended_action'] = 'temporary_ban'
                elif len(fraud_report['fraud_indicators']) == 2:
                    fraud_report['severity'] = 'high'
                    fraud_report['recommended_action'] = 'rating_penalty'
                else:
                    fraud_report['severity'] = 'medium'
                    fraud_report['recommended_action'] = 'warning'
                
                # Log fraud detection
                await self._log_fraud_detection(user_id, fraud_report, db)
            
            return fraud_report
        
        except Exception as e:
            logger.error(f"Error in fraud detection: {str(e)}")
            return {'user_id': user_id, 'is_suspicious': False, 'error': str(e)}
    
    async def _check_session_cancellations(self, user_id: str, db) -> Dict[str, Any]:
        """Check for excessive session cancellations"""
        try:
            one_week_ago = (datetime.now() - timedelta(days=7)).isoformat()
            
            # Get sessions in last week
            sessions = db.table('learning_sessions').select(
                'status'
            ).or_(f'mentor_id.eq.{user_id},learner_id.eq.{user_id}').gte('created_at', one_week_ago).execute()
            
            if not sessions.data:
                return {'is_suspicious': False, 'type': 'cancellation'}
            
            total_sessions = len(sessions.data)
            cancelled_sessions = sum(1 for s in sessions.data if s['status'] == 'cancelled')
            
            if cancelled_sessions >= self.thresholds['max_cancellations_per_week']:
                return {
                    'is_suspicious': True,
                    'type': 'repeated_cancellation',
                    'details': f'{cancelled_sessions} cancellations in last week',
                    'confidence': min(1.0, cancelled_sessions / 5.0)
                }
            
            return {'is_suspicious': False, 'type': 'cancellation'}
        
        except Exception as e:
            logger.error(f"Error checking cancellations: {str(e)}")
            return {'is_suspicious': False, 'type': 'cancellation', 'error': str(e)}
    
    async def _check_task_submissions(self, user_id: str, db) -> Dict[str, Any]:
        """Check for poor quality task submissions"""
        try:
            one_month_ago = (datetime.now() - timedelta(days=30)).isoformat()
            
            # Get task submissions
            submissions = db.table('task_submissions').select(
                'is_approved'
            ).eq('submitter_id', user_id).gte('submitted_at', one_month_ago).execute()
            
            if not submissions.data or len(submissions.data) < 3:
                return {'is_suspicious': False, 'type': 'task_quality'}
            
            total_submissions = len(submissions.data)
            rejected_submissions = sum(1 for s in submissions.data if s['is_approved'] is False)
            
            if rejected_submissions >= self.thresholds['max_task_rejections_per_month']:
                return {
                    'is_suspicious': True,
                    'type': 'fake_submission',
                    'details': f'{rejected_submissions} rejections out of {total_submissions} submissions',
                    'confidence': min(1.0, rejected_submissions / total_submissions)
                }
            
            return {'is_suspicious': False, 'type': 'task_quality'}
        
        except Exception as e:
            logger.error(f"Error checking task submissions: {str(e)}")
            return {'is_suspicious': False, 'type': 'task_quality', 'error': str(e)}
    
    async def _check_rating_patterns(self, user_id: str, db) -> Dict[str, Any]:
        """Check for suspicious rating patterns"""
        try:
            # Get ratings given by user
            ratings = db.table('reviews_ratings').select(
                'rating'
            ).eq('reviewer_id', user_id).execute()
            
            if not ratings.data or len(ratings.data) < 5:
                return {'is_suspicious': False, 'type': 'rating_pattern'}
            
            rating_values = [r['rating'] for r in ratings.data]
            
            # Check if all ratings are either very high or very low (suspicious pattern)
            all_extreme = all(r <= 2 or r >= 4 for r in rating_values)
            variance = sum((r - sum(rating_values) / len(rating_values)) ** 2 for r in rating_values) / len(rating_values)
            
            if all_extreme and variance < 0.5:
                return {
                    'is_suspicious': True,
                    'type': 'suspicious_rating_pattern',
                    'details': 'All ratings are extreme (too high or too low)',
                    'confidence': 0.7
                }
            
            return {'is_suspicious': False, 'type': 'rating_pattern'}
        
        except Exception as e:
            logger.error(f"Error checking rating patterns: {str(e)}")
            return {'is_suspicious': False, 'type': 'rating_pattern', 'error': str(e)}
    
    async def _check_spam_behavior(self, user_id: str, db) -> Dict[str, Any]:
        """Check for spam in session requests and messages"""
        try:
            # Get recent session requests
            one_day_ago = (datetime.now() - timedelta(days=1)).isoformat()
            
            requests = db.table('session_requests').select(
                'message'
            ).eq('sender_id', user_id).gte('created_at', one_day_ago).execute()
            
            if not requests.data:
                return {'is_suspicious': False, 'type': 'spam'}
            
            # Check for spam keywords
            spam_count = 0
            for req in requests.data:
                if req.get('message'):
                    message_lower = req['message'].lower()
                    if any(keyword in message_lower for keyword in self.thresholds['spam_message_keywords']):
                        spam_count += 1
            
            # Check for too many requests in short time
            if len(requests.data) > 10 or spam_count > 2:
                return {
                    'is_suspicious': True,
                    'type': 'spam',
                    'details': f'{len(requests.data)} requests in 24h, {spam_count} spam messages detected',
                    'confidence': min(1.0, (spam_count / len(requests.data)) if requests.data else 0.5)
                }
            
            return {'is_suspicious': False, 'type': 'spam'}
        
        except Exception as e:
            logger.error(f"Error checking spam behavior: {str(e)}")
            return {'is_suspicious': False, 'type': 'spam', 'error': str(e)}
    
    async def _log_fraud_detection(self, user_id: str, fraud_report: Dict[str, Any], db) -> None:
        """Log fraud detection to database"""
        try:
            for indicator in fraud_report['fraud_indicators']:
                fraud_log = {
                    'user_id': user_id,
                    'fraud_type': indicator['type'],
                    'severity': fraud_report['severity'],
                    'description': indicator.get('details', ''),
                    'confidence_score': indicator.get('confidence', 0.5),
                    'action_taken': fraud_report['recommended_action']
                }
                
                db.table('fraud_logs').insert(fraud_log).execute()
            
            logger.info(f"Fraud detection logged for user {user_id}: {fraud_report['severity']}")
        
        except Exception as e:
            logger.error(f"Error logging fraud detection: {str(e)}")
    
    async def get_fraud_stats(self) -> Dict[str, Any]:
        """Get overall fraud statistics"""
        try:
            db = get_db()
            
            # Get fraud logs from last 30 days
            thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
            
            fraud_logs = db.table('fraud_logs').select(
                'severity, fraud_type'
            ).gte('created_at', thirty_days_ago).execute()
            
            if not fraud_logs.data:
                return {'total_incidents': 0}
            
            # Aggregate stats
            stats = {
                'total_incidents': len(fraud_logs.data),
                'by_severity': {},
                'by_type': {}
            }
            
            for log in fraud_logs.data:
                severity = log['severity']
                fraud_type = log['fraud_type']
                
                stats['by_severity'][severity] = stats['by_severity'].get(severity, 0) + 1
                stats['by_type'][fraud_type] = stats['by_type'].get(fraud_type, 0) + 1
            
            return stats
        
        except Exception as e:
            logger.error(f"Error getting fraud stats: {str(e)}")
            return {'error': str(e)}

fraud_detection_service = FraudDetectionService()
