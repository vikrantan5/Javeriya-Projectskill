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
        """
        try:
            db = get_db()
            week_start, week_end = LeaderboardService.get_current_week_dates()
            
            # Delete existing entries for this week and category
            db.table('leaderboard_entries').delete().eq('category', category).eq('week_start_date', str(week_start)).execute()
            
            if category == 'top_mentor':
                # Get top mentors based on sessions completed this week
                query = f"""
                SELECT 
                    u.id as user_id,
                    COUNT(ls.id) as weekly_sessions,
                    AVG(u.average_rating) as avg_rating,
                    u.total_sessions
                FROM users u
                INNER JOIN learning_sessions ls ON u.id = ls.mentor_id
                WHERE ls.status = 'completed'
                  AND ls.created_at >= '{week_start}'
                  AND ls.created_at <= '{week_end}'
                GROUP BY u.id
                ORDER BY weekly_sessions DESC, avg_rating DESC
                LIMIT {limit}
                """
                
            elif category == 'top_learner':
                # Get top learners based on sessions attended and tasks completed
                query = f"""
                SELECT 
                    u.id as user_id,
                    COUNT(DISTINCT ls.id) + COUNT(DISTINCT t.id) as activity_score,
                    u.total_sessions
                FROM users u
                LEFT JOIN learning_sessions ls ON u.id = ls.learner_id AND ls.status = 'completed'
                LEFT JOIN tasks t ON u.id = t.acceptor_id AND t.status = 'completed'
                WHERE (ls.created_at >= '{week_start}' OR t.created_at >= '{week_start}')
                GROUP BY u.id
                ORDER BY activity_score DESC
                LIMIT {limit}
                """
                
            elif category == 'top_contributor':
                # Get top contributors based on overall platform engagement
                query = f"""
                SELECT 
                    u.id as user_id,
                    (u.total_sessions * 2 + u.total_tasks_completed * 3 + u.total_ratings) as contribution_score
                FROM users u
                ORDER BY contribution_score DESC
                LIMIT {limit}
                """
            else:
                return
            
            # Execute query (Note: Using Supabase RPC or direct SQL)
            # For now, we'll use a simplified approach with existing data
            users_result = db.table('users').select('id, username, total_sessions, average_rating, total_tasks_completed, total_ratings').order('total_sessions', desc=True).limit(limit).execute()
            
            # Insert leaderboard entries
            entries = []
            for rank, user in enumerate(users_result.data, 1):
                score = user.get('total_sessions', 0) * 2 + user.get('total_tasks_completed', 0) * 3
                
                entries.append({
                    'user_id': user['id'],
                    'category': category,
                    'score': score,
                    'rank': rank,
                    'week_start_date': str(week_start),
                    'week_end_date': str(week_end)
                })
            
            if entries:
                db.table('leaderboard_entries').insert(entries).execute()
            
            logger.info(f"Updated leaderboard for {category}")
            
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
 # Get user details including trust_score
                user_ids = [entry['user_id'] for entry in result.data]
                users_result = db.table('users').select('id, username, full_name, profile_photo, average_rating, total_sessions, trust_score').in_('id', user_ids).execute()
                
                users_dict = {user['id']: user for user in users_result.data}
                
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
                                'average_rating': user.get('average_rating', 0)
                            }
                        })
            
            return leaderboard
            
        except Exception as e:
            logger.error(f"Error getting leaderboard: {str(e)}")
            return []


leaderboard_service = LeaderboardService()
