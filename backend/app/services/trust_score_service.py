"""
Trust Score Service
Calculates a comprehensive trust score (0-100) for users based on multiple factors
"""
from app.database import get_db
from typing import Dict
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class TrustScoreService:
    """Service for calculating user trust scores"""
    
    def calculate_trust_score(self, user_id: str) -> Dict:
        """
        Calculate comprehensive trust score for a user
        
        Factors:
        - Rating history (30%): Average rating and consistency
        - Task completion (25%): Success rate and on-time delivery
        - Account age (10%): Older accounts are more trusted
        - Verification status (15%): Verified skills and identity
        - Activity level (10%): Regular engagement
        - Community feedback (10%): Review quality and sentiment
        
        Returns:
            {
                "trust_score": 0-100,
                "risk_level": "low" | "medium" | "high",
                "factors": {
                    "rating_score": 0-30,
                    "completion_score": 0-25,
                    "account_age_score": 0-10,
                    "verification_score": 0-15,
                    "activity_score": 0-10,
                    "community_score": 0-10
                },
                "risk_indicators": [],
                "trust_badges": []
            }
        """
        try:
            db = get_db()
            
            # Get user data
            user_result = db.table('users').select('*').eq('id', user_id).execute()
            if not user_result.data:
                return None
            
            user = user_result.data[0]
            
            # Initialize scores
            scores = {
                "rating_score": 0,
                "completion_score": 0,
                "account_age_score": 0,
                "verification_score": 0,
                "activity_score": 0,
                "community_score": 0
            }
            
            risk_indicators = []
            trust_badges = []
            
            # 1. Rating Score (30 points)
            avg_rating = user.get('average_rating', 0)
            ratings_result = db.table('ratings').select('rating').eq('receiver_id', user_id).execute()
            total_ratings = len(ratings_result.data or [])
            
            if total_ratings > 0:
                # Base rating score
                scores["rating_score"] = (avg_rating / 5) * 25
                
                # Bonus for consistency (low variance)
                if total_ratings >= 5:
                    ratings_list = [r['rating'] for r in ratings_result.data]
                    variance = sum((r - avg_rating) ** 2 for r in ratings_list) / len(ratings_list)
                    consistency_bonus = max(0, (1 - variance) * 5)  # Up to 5 bonus points
                    scores["rating_score"] += consistency_bonus
                
                # Check for excellence
                if avg_rating >= 4.8 and total_ratings >= 10:
                    trust_badges.append("Outstanding Reputation")
                elif avg_rating >= 4.5 and total_ratings >= 5:
                    trust_badges.append("Highly Rated")
                
                # Check for risk
                if avg_rating < 3.0 and total_ratings >= 3:
                    risk_indicators.append("Low average rating")
            else:
                risk_indicators.append("No ratings yet")
            
            # 2. Task Completion Score (25 points)
            completed_tasks = db.table('tasks').select('id, deadline, created_at').or_(
                f'acceptor_id.eq.{user_id},assigned_user_id.eq.{user_id}'
            ).eq('status', 'completed').execute()
            
            failed_tasks = db.table('tasks').select('id').or_(
                f'acceptor_id.eq.{user_id},assigned_user_id.eq.{user_id}'
            ).in_('status', ['cancelled', 'rejected']).execute()
            
            tasks_completed = len(completed_tasks.data or [])
            tasks_failed = len(failed_tasks.data or [])
            total_tasks = tasks_completed + tasks_failed
            
            if total_tasks > 0:
                success_rate = (tasks_completed / total_tasks) * 100
                scores["completion_score"] = (success_rate / 100) * 20  # Base 20 points
                
                # Bonus for on-time delivery
                on_time_count = 0
                for task in (completed_tasks.data or []):
                    if task.get('deadline'):
                        submission_result = db.table('task_submissions').select('submitted_at').eq('task_id', task['id']).eq('submitter_id', user_id).order('submitted_at', desc=False).limit(1).execute()
                        if submission_result.data:
                            try:
                                submitted_at = datetime.fromisoformat(submission_result.data[0]['submitted_at'].replace('Z', '+00:00'))
                                deadline = datetime.fromisoformat(task['deadline'].replace('Z', '+00:00'))
                                if submitted_at <= deadline:
                                    on_time_count += 1
                            except:
                                pass
                
                if tasks_completed > 0:
                    on_time_rate = (on_time_count / tasks_completed) * 100
                    scores["completion_score"] += (on_time_rate / 100) * 5  # Up to 5 bonus points
                
                # Trust badges
                if success_rate >= 95 and tasks_completed >= 10:
                    trust_badges.append("Reliable Performer")
                elif success_rate >= 85 and tasks_completed >= 5:
                    trust_badges.append("Dependable")
                
                # Risk indicators
                if success_rate < 70 and total_tasks >= 3:
                    risk_indicators.append(f"Low success rate ({success_rate:.0f}%)")
                
                if tasks_failed > 5:
                    risk_indicators.append(f"Multiple failed tasks ({tasks_failed})")
            
            # 3. Account Age Score (10 points)
            created_at = user.get('created_at')
            if created_at:
                try:
                    account_created = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    account_age_days = (datetime.now(account_created.tzinfo) - account_created).days
                    
                    # Score based on age (maxes out at 180 days)
                    scores["account_age_score"] = min((account_age_days / 180) * 10, 10)
                    
                    if account_age_days >= 365:
                        trust_badges.append("Veteran Member")
                    elif account_age_days < 7:
                        risk_indicators.append("New account")
                except:
                    pass
            
            # 4. Verification Score (15 points)
            # Identity verification
            if user.get('is_verified'):
                scores["verification_score"] += 7
                trust_badges.append("Verified User")
            
            # Skill verification
            verified_skills = db.table('user_skills').select('id').eq('user_id', user_id).eq('is_verified', True).execute()
            verified_count = len(verified_skills.data or [])
            
            if verified_count > 0:
                scores["verification_score"] += min(verified_count * 2, 8)  # Up to 8 points for verified skills
                
                if verified_count >= 3:
                    trust_badges.append("Multi-Skilled Expert")
            
            # 5. Activity Score (10 points)
            # Recent activity (last 30 days)
            thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
            
            recent_sessions = db.table('learning_sessions').select('id').or_(
                f'mentor_id.eq.{user_id},learner_id.eq.{user_id}'
            ).gte('created_at', thirty_days_ago).execute()
            
            recent_tasks = db.table('tasks').select('id').or_(
                f'creator_id.eq.{user_id},acceptor_id.eq.{user_id}'
            ).gte('created_at', thirty_days_ago).execute()
            
            activity_count = len((recent_sessions.data or [])) + len((recent_tasks.data or []))
            
            # Score based on activity (maxes at 20 activities in 30 days)
            scores["activity_score"] = min((activity_count / 20) * 10, 10)
            
            if activity_count >= 20:
                trust_badges.append("Highly Active")
            elif activity_count == 0:
                risk_indicators.append("Inactive user")
            
            # 6. Community Score (10 points)
            # Based on helpful reviews received
            reviews_with_text = db.table('ratings').select('review, rating').eq('receiver_id', user_id).execute()
            helpful_reviews = [r for r in (reviews_with_text.data or []) if r.get('review') and len(r['review']) > 20]
            
            if len(helpful_reviews) > 0:
                scores["community_score"] = min(len(helpful_reviews) * 2, 10)
                
                if len(helpful_reviews) >= 5:
                    trust_badges.append("Well Reviewed")
            
            # Calculate total trust score
            total_score = sum(scores.values())
            
            # Determine risk level
            if total_score >= 75:
                risk_level = "low"
            elif total_score >= 50:
                risk_level = "medium"
            else:
                risk_level = "high"
            
            # Additional risk checks
            if len(risk_indicators) >= 3:
                risk_level = "high"
            elif len(risk_indicators) >= 2 and total_score < 60:
                risk_level = "medium"
            
            return {
                "trust_score": round(total_score, 1),
                "risk_level": risk_level,
                "factors": {k: round(v, 1) for k, v in scores.items()},
                "risk_indicators": risk_indicators,
                "trust_badges": trust_badges,
                "metrics": {
                    "total_ratings": total_ratings,
                    "tasks_completed": tasks_completed,
                    "tasks_failed": tasks_failed,
                    "verified_skills": verified_count,
                    "account_age_days": account_age_days if 'account_age_days' in locals() else 0,
                    "recent_activity_count": activity_count
                }
            }
            
        except Exception as e:
            logger.error(f"Error calculating trust score: {str(e)}")
            raise

trust_score_service = TrustScoreService()
