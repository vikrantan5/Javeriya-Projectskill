from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from app.database import get_db
from typing import List, Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)

class SkillMatchingService:
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
    
    async def find_mentors(self, skill_name: str, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Find best mentors for a skill using cosine similarity"""
        try:
            db = get_db()
            
            # Get all users who offer this skill (excluding current user)
            response = db.table('users').select(
                'id, username, full_name, profile_photo, location, average_rating, total_sessions'
            ).eq('is_active', True).eq('is_banned', False).neq('id', user_id).execute()
            
            all_users = response.data
            
            if not all_users:
                return []
            
            # Get skills for these users
            user_ids = [user['id'] for user in all_users]
            skills_response = db.table('user_skills').select(
                'user_id, skill_name, skill_level, is_verified'
            ).in_('user_id', user_ids).eq('skill_type', 'offered').execute()
            
            # Group skills by user
            user_skills_map = {}
            for skill in skills_response.data:
                uid = skill['user_id']
                if uid not in user_skills_map:
                    user_skills_map[uid] = []
                user_skills_map[uid].append(skill)
            
            # Filter users who have the requested skill
            matching_mentors = []
            for user in all_users:
                user_id_str = user['id']
                if user_id_str in user_skills_map:
                    user_skill_names = [s['skill_name'].lower() for s in user_skills_map[user_id_str]]
                    if skill_name.lower() in user_skill_names:
                        # Find the specific skill details
                        skill_detail = next((s for s in user_skills_map[user_id_str] if s['skill_name'].lower() == skill_name.lower()), None)
                        
                        # Calculate score based on: rating, verification, sessions
                        base_score = user['average_rating'] if user['average_rating'] else 0
                        verification_boost = 1.5 if (skill_detail and skill_detail['is_verified']) else 1.0
                        session_boost = min(1.5, 1 + (user['total_sessions'] or 0) * 0.01)
                        
                        total_score = base_score * verification_boost * session_boost
                        
                        matching_mentors.append({
                            'user_id': user['id'],
                            'username': user['username'],
                            'full_name': user['full_name'],
                            'profile_photo': user['profile_photo'],
                            'location': user['location'],
                            'average_rating': user['average_rating'],
                            'total_sessions': user['total_sessions'],
                            'skill_level': skill_detail['skill_level'] if skill_detail else 'intermediate',
                            'is_verified': skill_detail['is_verified'] if skill_detail else False,
                            'match_score': round(total_score, 2),
                            'skills': [s['skill_name'] for s in user_skills_map[user_id_str]]
                        })
            
            # Sort by match score
            matching_mentors.sort(key=lambda x: x['match_score'], reverse=True)
            
            return matching_mentors[:limit]
        
        except Exception as e:
            logger.error(f"Error finding mentors: {str(e)}")
            return []
    
    async def calculate_skill_similarity(self, skills1: List[str], skills2: List[str]) -> float:
        """Calculate similarity between two skill sets using cosine similarity"""
        try:
            if not skills1 or not skills2:
                return 0.0
            
            # Create document strings
            doc1 = ' '.join(skills1)
            doc2 = ' '.join(skills2)
            
            # Vectorize and calculate similarity
            tfidf_matrix = self.vectorizer.fit_transform([doc1, doc2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            return float(similarity)
        except Exception as e:
            logger.error(f"Error calculating skill similarity: {str(e)}")
            return 0.0
    
    async def suggest_collaboration_partners(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Suggest users with complementary skills for collaboration"""
        try:
            db = get_db()
            
            # Get current user's skills
            user_skills_response = db.table('user_skills').select(
                'skill_name, skill_type'
            ).eq('user_id', user_id).execute()
            
            user_offered = [s['skill_name'] for s in user_skills_response.data if s['skill_type'] == 'offered']
            user_wanted = [s['skill_name'] for s in user_skills_response.data if s['skill_type'] == 'wanted']
            
            if not user_wanted:
                return []
            
            # Find users who offer what this user wants
            potential_partners = []
            
            for wanted_skill in user_wanted:
                mentors = await self.find_mentors(wanted_skill, user_id, limit=10)
                potential_partners.extend(mentors)
            
            # Remove duplicates and sort by score
            seen_ids = set()
            unique_partners = []
            for partner in potential_partners:
                if partner['user_id'] not in seen_ids:
                    seen_ids.add(partner['user_id'])
                    unique_partners.append(partner)
            
            unique_partners.sort(key=lambda x: x['match_score'], reverse=True)
            
            return unique_partners[:limit]
        
        except Exception as e:
            logger.error(f"Error suggesting collaboration partners: {str(e)}")
            return []

skill_matching_service = SkillMatchingService()
