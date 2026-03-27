"""
Leaderboard Service - Manage weekly leaderboards for top users
"""
from app.database import get_db
import logging
from datetime import datetime, timedelta
from typing import List, Dict

logger = logging.getLogger(__name__)

class LeaderboardService:
    """Service for managing leaderboards"""
    
    @staticmethod
    def get_current_week_dates() -> tuple:
        """Get start and end dates for current week"""
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        return week_start, week_end
    
    @staticmethod
    def update_leaderboard(category: str, limit: int = 100) -> None:
        """
        Update leaderboard for a specific category
        Categories: 'top_mentor', 'top_learner', 'top_contributor'
        Scoring includes: tasks completed, skill exchanges completed, on-time completion, user rating
        """
        try:
            db = get_db()
            week_start, week_end = LeaderboardService.get_current_week_dates()
            
            # Delete existing entries for this week and category
            db.table('leaderboard_entries').delete().eq('category', category).eq('week_start_date', str(week_start)).execute()
            
            # Get all users with their stats
            users_result = db.table('users').select('id, username, total_sessions, average_rating, total_tasks_completed, total_ratings, total_skill_exchanges_completed').order('total_sessions', desc=True).limit(limit).execute()
            
            # Calculate scores based on category
            entries = []
            for rank, user in enumerate(users_result.data if users_result.data else [], 1):
                if category == 'top_mentor':
                    # Mentors scored on sessions + rating + skill exchanges
                    score = (
                        user.get('total_sessions', 0) * 3 + 
                        user.get('average_rating', 0) * 10 +
                        user.get('total_skill_exchanges_completed', 0) * 2
                    )
                elif category == 'top_learner':
                    # Learners scored on tasks completed + sessions + skill exchanges
                    score = (
                        user.get('total_tasks_completed', 0) * 5 + 
                        user.get('total_sessions', 0) * 2 +
                        user.get('total_skill_exchanges_completed', 0) * 3
                    )
                elif category == 'top_contributor':
                    # Overall contribution score
                    score = (
                        user.get('total_sessions', 0) * 2 + 
                        user.get('total_tasks_completed', 0) * 3 + 
                        user.get('total_ratings', 0) +
                        user.get('total_skill_exchanges_completed', 0) * 2 +
                        user.get('average_rating', 0) * 5
                    )
                else:
                    continue
                
                entries.append({
                    'user_id': user['id'],
                    'category': category,
                    'score': int(score),
                    'rank': rank,
                    'week_start_date': str(week_start),
                    'week_end_date': str(week_end)
                })
            
            # Re-sort by score and update ranks
            entries.sort(key=lambda x: x['score'], reverse=True)
            for rank, entry in enumerate(entries, 1):
                entry['rank'] = rank
            
            if entries:
                db.table('leaderboard_entries').insert(entries).execute()
            
            logger.info(f"Updated leaderboard for {category} with {len(entries)} entries")
            
        except Exception as e:
            logger.error(f"Error updating leaderboard: {str(e)}")
    
    @staticmethod
    def get_leaderboard(category: str, limit: int = 10) -> List[Dict]:
        """Get current week's leaderboard"""
        try:
            db = get_db()
            week_start, week_end = LeaderboardService.get_current_week_dates()
            
            # Get leaderboard entries
            result = db.table('leaderboard_entries').select('*').eq('category', category).eq('week_start_date', str(week_start)).order('rank', desc=False).limit(limit).execute()
            
            if not result.data:
                # If no data, update leaderboard first
                LeaderboardService.update_leaderboard(category, limit)
                result = db.table('leaderboard_entries').select('*').eq('category', category).eq('week_start_date', str(week_start)).order('rank', desc=False).limit(limit).execute()
            
            leaderboard = []
            if result.data:
                # Get user details including skill exchanges
                user_ids = [entry['user_id'] for entry in result.data]
                users_result = db.table('users').select('id, username, full_name, profile_photo, average_rating, total_sessions, trust_score, total_tasks_completed, total_skill_exchanges_completed').in_('id', user_ids).execute()
                
                users_dict = {user['id']: user for user in (users_result.data or [])}
                
                for entry in result.data:
                    user = users_dict.get(entry['user_id'])
                    if user:
                        leaderboard.append({
                            'rank': entry['rank'],
                            'user_id': entry['user_id'],
                            'username': user['username'],
                            'full_name': user.get('full_name'),
                            'profile_photo': user.get('profile_photo'),
                            'score': entry['score'],
                            'trust_score': user.get('trust_score', 0),
                            'category': entry['category'],
                            'stats': {
                                'total_sessions': user.get('total_sessions', 0),
                                'average_rating': user.get('average_rating', 0),
                                'total_tasks_completed': user.get('total_tasks_completed', 0),
                                'total_skill_exchanges_completed': user.get('total_skill_exchanges_completed', 0)
                            }
                        })
            
            return leaderboard
            
        except Exception as e:
            logger.error(f"Error getting leaderboard: {str(e)}")
            return []


leaderboard_service = LeaderboardService()
