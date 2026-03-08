from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class SkillMatcher:
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
    
    def rank_mentors(self, mentors_data: List[Dict], skills_data: List[Dict], requested_skill: str, user_skills: List[str] = None) -> List[Dict]:
        """Rank mentors based on multiple factors"""
        try:
            if not mentors_data:
                return []
            
            # Create skill dict for lookup
            skills_dict = {s['user_id']: s for s in skills_data}
            
            # Calculate scores for each mentor
            ranked_mentors = []
            for mentor in mentors_data:
                mentor_id = mentor['id']
                skill_info = skills_dict.get(mentor_id, {})
                
                # Calculate composite score
                score = 0
                
                # Factor 1: Average rating (0-5, weight: 30%)
                rating_score = (mentor.get('average_rating', 0) / 5) * 30
                score += rating_score
                
                # Factor 2: Total sessions (normalized, weight: 20%)
                sessions_score = min(mentor.get('total_sessions', 0) / 20, 1) * 20
                score += sessions_score
                
                # Factor 3: Skill level (weight: 30%)
                skill_level = skill_info.get('skill_level', 'beginner')
                level_scores = {'beginner': 5, 'intermediate': 15, 'advanced': 25, 'expert': 30}
                score += level_scores.get(skill_level, 5)
                
                # Factor 4: Skill verification (weight: 10%)
                if skill_info.get('is_verified'):
                    score += 10
                
                # Factor 5: Total ratings count (normalized, weight: 10%)
                ratings_count_score = min(mentor.get('total_ratings', 0) / 10, 1) * 10
                score += ratings_count_score
                
                ranked_mentors.append({
                    'mentor': mentor,
                    'skill_level': skill_level,
                    'is_verified': skill_info.get('is_verified', False),
                    'match_score': round(score, 2)
                })
            
            # Sort by score
            ranked_mentors.sort(key=lambda x: x['match_score'], reverse=True)
            
            return ranked_mentors
        
        except Exception as e:
            logger.error(f"Error ranking mentors: {str(e)}")
            # Return mentors unsorted as fallback
            return [{
                'mentor': m,
                'skill_level': 'unknown',
                'is_verified': False,
                'match_score': 0
            } for m in mentors_data]
    
    def calculate_skill_similarity(self, skills1: List[str], skills2: List[str]) -> float:
        """Calculate similarity between two skill sets using cosine similarity"""
        try:
            if not skills1 or not skills2:
                return 0.0
            
            # Combine skills into text
            text1 = ' '.join(skills1)
            text2 = ' '.join(skills2)
            
            # Calculate TF-IDF and cosine similarity
            tfidf_matrix = self.vectorizer.fit_transform([text1, text2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            return float(similarity)
        
        except Exception as e:
            logger.error(f"Error calculating skill similarity: {str(e)}")
            return 0.0

skill_matcher = SkillMatcher()