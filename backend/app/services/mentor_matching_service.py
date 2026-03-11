"""
Mentor Matching Service - AI-powered mentor matching using skill similarity
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from app.database import get_db
from app.services.reputation_service import reputation_service
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class MentorMatchingService:
    """Service for matching learners with mentors based on skills"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
    
    def find_mentors(self, learner_id: str, skill_name: str, limit: int = 10) -> List[Dict]:
        """
        Find best matching mentors for a learner based on skill similarity
        
        Args:
            learner_id: ID of the learner looking for a mentor
            skill_name: Skill the learner wants to learn
            limit: Maximum number of mentors to return
            
        Returns:
            List of matched mentors with similarity scores
        """
        try:
            db = get_db()
            
            # Get learner's skills to understand their background
            learner_skills_result = db.table('user_skills').select('skill_name').eq('user_id', learner_id).execute()
            learner_skills = [s['skill_name'] for s in learner_skills_result.data] if learner_skills_result.data else []
            
            # Get all users who have the desired skill as "offered"
            mentor_skills_result = db.table('user_skills').select('user_id, skill_name, skill_level, is_verified').eq('skill_name', skill_name).eq('skill_type', 'offered').execute()
            
            if not mentor_skills_result.data:
                return []
            
            # Get unique mentor IDs
            mentor_ids = list(set([s['user_id'] for s in mentor_skills_result.data]))
            
            # Remove learner from potential mentors
            mentor_ids = [m for m in mentor_ids if m != learner_id]
            
            if not mentor_ids:
                return []
            
            # Get mentor details and their skills
            mentors_result = db.table('users').select('id, username, full_name, profile_photo, average_rating, total_sessions, trust_score, bio').in_('id', mentor_ids).execute()
            
            # Get all skills for each mentor
            all_mentor_skills = {}
            for mentor_id in mentor_ids:
                skills_result = db.table('user_skills').select('skill_name').eq('user_id', mentor_id).execute()
                all_mentor_skills[mentor_id] = [s['skill_name'] for s in skills_result.data] if skills_result.data else []
            
            # Calculate similarity scores
            matched_mentors = []
            
            # Create text representations
            learner_text = ' '.join(learner_skills)
            mentor_texts = []
            mentor_data = []
            
            for mentor in mentors_result.data:
                mentor_id = mentor['id']
                mentor_skills = all_mentor_skills.get(mentor_id, [])
                
                if not mentor_skills:
                    continue
                
                mentor_text = ' '.join(mentor_skills)
                mentor_texts.append(mentor_text)
                mentor_data.append(mentor)
            
            if not mentor_texts:
                return []
            
            # Calculate cosine similarity
            if learner_text:
                all_texts = [learner_text] + mentor_texts
                tfidf_matrix = self.vectorizer.fit_transform(all_texts)
                similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]
            else:
                # If learner has no skills, use equal weights
                similarities = np.ones(len(mentor_texts)) * 0.5
            
            # Get skill level and verification info
            skill_info_dict = {}
            for skill_entry in mentor_skills_result.data:
                skill_info_dict[skill_entry['user_id']] = {
                    'skill_level': skill_entry['skill_level'],
                    'is_verified': skill_entry['is_verified']
                }
            
            # Build results with ranking
            for idx, mentor in enumerate(mentor_data):
                mentor_id = mentor['id']
                similarity_score = float(similarities[idx])
                
                # Get badge info
                trust_score = mentor.get('trust_score', 0)
                badge_info = reputation_service.get_mentor_badge(trust_score)
                
                # Calculate composite score
                # Factors: similarity (40%), trust score (30%), rating (20%), sessions (10%)
                composite_score = (
                    similarity_score * 0.40 +
                    (trust_score / 100) * 0.30 +
                    (mentor.get('average_rating', 0) / 5) * 0.20 +
                    min(mentor.get('total_sessions', 0) / 100, 1) * 0.10
                )
                
                skill_info = skill_info_dict.get(mentor_id, {})
                
                matched_mentors.append({
                    'mentor_id': mentor_id,
                    'username': mentor['username'],
                    'full_name': mentor.get('full_name'),
                    'profile_photo': mentor.get('profile_photo'),
                    'bio': mentor.get('bio'),
                    'skill_level': skill_info.get('skill_level', 'intermediate'),
                    'is_verified': skill_info.get('is_verified', False),
                    'average_rating': mentor.get('average_rating', 0),
                    'total_sessions': mentor.get('total_sessions', 0),
                    'trust_score': trust_score,
                    'badge': badge_info,
                    'similarity_score': round(similarity_score * 100, 2),
                    'composite_score': round(composite_score * 100, 2)
                })
            
            # Sort by composite score
            matched_mentors.sort(key=lambda x: x['composite_score'], reverse=True)
            
            # Save top matches to database
            for rank, mentor in enumerate(matched_mentors[:limit], 1):
                try:
                    db.table('mentor_matches').insert({
                        'learner_id': learner_id,
                        'mentor_id': mentor['mentor_id'],
                        'skill_name': skill_name,
                        'similarity_score': mentor['similarity_score'] / 100,
                        'status': 'suggested'
                    }).execute()
                except Exception as e:
                    # Match might already exist, that's okay
                    pass
            
            logger.info(f"Found {len(matched_mentors[:limit])} mentors for learner {learner_id} in skill {skill_name}")
            
            return matched_mentors[:limit]
            
        except Exception as e:
            logger.error(f"Error finding mentors: {str(e)}")
            return []
    
    def get_mentor_recommendations(self, learner_id: str, limit: int = 5) -> List[Dict]:
        """
        Get general mentor recommendations based on learner's wanted skills
        """
        try:
            db = get_db()
            
            # Get skills the learner wants to learn
            wanted_skills_result = db.table('user_skills').select('skill_name').eq('user_id', learner_id).eq('skill_type', 'wanted').execute()
            
            if not wanted_skills_result.data:
                # If no wanted skills, return top-rated mentors
                mentors_result = db.table('users').select('id, username, full_name, profile_photo, average_rating, total_sessions, trust_score').order('trust_score', desc=True).limit(limit).execute()
                
                results = []
                for mentor in mentors_result.data if mentors_result.data else []:
                    badge_info = reputation_service.get_mentor_badge(mentor.get('trust_score', 0))
                    results.append({
                        'mentor_id': mentor['id'],
                        'username': mentor['username'],
                        'full_name': mentor.get('full_name'),
                        'profile_photo': mentor.get('profile_photo'),
                        'average_rating': mentor.get('average_rating', 0),
                        'total_sessions': mentor.get('total_sessions', 0),
                        'trust_score': mentor.get('trust_score', 0),
                        'badge': badge_info
                    })
                
                return results
            
            # Get recommendations for each wanted skill
            all_recommendations = []
            for skill in wanted_skills_result.data:
                mentors = self.find_mentors(learner_id, skill['skill_name'], limit=3)
                all_recommendations.extend(mentors)
            
            # Remove duplicates and sort by composite score
            seen = set()
            unique_recommendations = []
            for mentor in all_recommendations:
                if mentor['mentor_id'] not in seen:
                    seen.add(mentor['mentor_id'])
                    unique_recommendations.append(mentor)
            
            unique_recommendations.sort(key=lambda x: x['composite_score'], reverse=True)
            
            return unique_recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Error getting mentor recommendations: {str(e)}")
            return []


mentor_matching_service = MentorMatchingService()
