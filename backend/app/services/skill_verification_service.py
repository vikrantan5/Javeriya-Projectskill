"""
Skill Verification Service - Quiz-based skill verification system
"""
from app.database import get_db
from app.services.token_service import token_service
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class SkillVerificationService:
    """Service for skill verification through quizzes"""
    
    @staticmethod
    def get_available_quizzes(skill_name: Optional[str] = None) -> List[Dict]:
        """
        Get all available quizzes, optionally filtered by skill
        """
        try:
            db = get_db()
            
            query = db.table('skill_verification_quizzes').select('id, skill_name, difficulty_level, passing_score, is_active')
            
            if skill_name:
                query = query.eq('skill_name', skill_name)
            
            query = query.eq('is_active', True)
            
            result = query.execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error getting quizzes: {str(e)}")
            return []
    
    @staticmethod
    def get_quiz(quiz_id: str) -> Optional[Dict]:
        """
        Get a specific quiz by ID
        Returns quiz without correct answers (for taking the quiz)
        """
        try:
            db = get_db()
            
            result = db.table('skill_verification_quizzes').select('*').eq('id', quiz_id).eq('is_active', True).execute()
            
            if not result.data:
                return None
            
            quiz = result.data[0]
            
            # Remove correct answers from questions (for security)
            questions = quiz['questions']
            safe_questions = []
            
            for q in questions:
                safe_q = {
                    'question': q['question'],
                    'options': q['options']
                }
                safe_questions.append(safe_q)
            
            return {
                'id': quiz['id'],
                'skill_name': quiz['skill_name'],
                'difficulty_level': quiz['difficulty_level'],
                'passing_score': quiz['passing_score'],
                'total_questions': len(questions),
                'questions': safe_questions
            }
            
        except Exception as e:
            logger.error(f"Error getting quiz: {str(e)}")
            return None
    
    @staticmethod
    def submit_quiz(quiz_id: str, user_id: str, user_answers: List[int]) -> Dict:
        """
        Submit quiz answers and calculate score
        
        Args:
            quiz_id: ID of the quiz
            user_id: ID of the user taking the quiz
            user_answers: List of selected option indices
            
        Returns:
            Dict with results
        """
        try:
            db = get_db()
            
            # Get quiz with correct answers
            quiz_result = db.table('skill_verification_quizzes').select('*').eq('id', quiz_id).execute()
            
            if not quiz_result.data:
                return {
                    'success': False,
                    'error': 'Quiz not found'
                }
            
            quiz = quiz_result.data[0]
            questions = quiz['questions']
            
            # Validate answer count
            if len(user_answers) != len(questions):
                return {
                    'success': False,
                    'error': f'Expected {len(questions)} answers, got {len(user_answers)}'
                }
            
            # Calculate score
            correct_count = 0
            detailed_results = []
            
            for idx, question in enumerate(questions):
                user_answer = user_answers[idx]
                correct_answer = question['correct_answer']
                is_correct = user_answer == correct_answer
                
                if is_correct:
                    correct_count += 1
                
                detailed_results.append({
                    'question_number': idx + 1,
                    'question': question['question'],
                    'user_answer': user_answer,
                    'correct_answer': correct_answer,
                    'is_correct': is_correct
                })
            
            total_questions = len(questions)
            score = correct_count
            passing_score = quiz['passing_score']
            passed = score >= passing_score
            
            # Save attempt to database
            attempt_data = {
                'user_id': user_id,
                'quiz_id': quiz_id,
                'skill_name': quiz['skill_name'],
                'user_answers': user_answers,
                'score': score,
                'total_questions': total_questions,
                'passed': passed
            }
            
            attempt_result = db.table('quiz_attempts').insert(attempt_data).execute()
            
            # If passed, update user's skill verification status
            if passed:
                # Check if user has this skill
                skill_result = db.table('user_skills').select('*').eq('user_id', user_id).eq('skill_name', quiz['skill_name']).execute()
                
                if skill_result.data:
                    # Update existing skill to verified
                    db.table('user_skills').update({
                        'is_verified': True,
                        'verification_score': score
                    }).eq('user_id', user_id).eq('skill_name', quiz['skill_name']).execute()
                else:
                    # Add new verified skill
                    db.table('user_skills').insert({
                        'user_id': user_id,
                        'skill_name': quiz['skill_name'],
                        'skill_type': 'offered',
                        'skill_level': quiz['difficulty_level'],
                        'is_verified': True,
                        'verification_score': score
                    }).execute()
                
                # Update user's verified skills count
                verified_count_result = db.table('user_skills').select('id').eq('user_id', user_id).eq('is_verified', True).execute()
                verified_count = len(verified_count_result.data) if verified_count_result.data else 0
                
                db.table('users').update({
                    'verified_skills_count': verified_count
                }).eq('id', user_id).execute()
                
                # Award tokens for passing
                token_service.earn_tokens(
                    user_id=user_id,
                    amount=token_service.EARN_SKILL_VERIFIED,
                    reason='skill_verified',
                    reference_id=attempt_result.data[0]['id'] if attempt_result.data else None
                )
                
                # Recalculate trust score
                from app.services.reputation_service import reputation_service
                reputation_service.calculate_trust_score(user_id)
            
            logger.info(f"Quiz submitted by user {user_id}: Score {score}/{total_questions}, Passed: {passed}")
            
            return {
                'success': True,
                'passed': passed,
                'score': score,
                'total_questions': total_questions,
                'passing_score': passing_score,
                'percentage': round((score / total_questions) * 100, 2),
                'skill_name': quiz['skill_name'],
                'skill_verified': passed,
                'tokens_earned': token_service.EARN_SKILL_VERIFIED if passed else 0,
                'detailed_results': detailed_results,
                'attempt_id': attempt_result.data[0]['id'] if attempt_result.data else None
            }
            
        except Exception as e:
            logger.error(f"Error submitting quiz: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def get_user_attempts(user_id: str, skill_name: Optional[str] = None, limit: int = 20) -> List[Dict]:
        """Get quiz attempts for a user"""
        try:
            db = get_db()
            
            query = db.table('quiz_attempts').select('*').eq('user_id', user_id)
            
            if skill_name:
                query = query.eq('skill_name', skill_name)
            
            result = query.order('created_at', desc=True).limit(limit).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error getting attempts: {str(e)}")
            return []
    
    @staticmethod
    def get_user_verified_skills(user_id: str) -> List[Dict]:
        """Get all verified skills for a user"""
        try:
            db = get_db()
            
            result = db.table('user_skills').select('skill_name, skill_level, verification_score, created_at').eq('user_id', user_id).eq('is_verified', True).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error getting verified skills: {str(e)}")
            return []
    
    @staticmethod
    def create_quiz(skill_name: str, questions: List[Dict], passing_score: int, difficulty_level: str = 'intermediate', created_by: Optional[str] = None) -> Dict:
        """
        Create a new quiz (admin function)
        
        Args:
            skill_name: Name of the skill
            questions: List of question objects with question, options, and correct_answer
            passing_score: Minimum score to pass
            difficulty_level: beginner, intermediate, or advanced
            created_by: User ID of creator (admin)
        """
        try:
            db = get_db()
            
            # Validate questions format
            for q in questions:
                if 'question' not in q or 'options' not in q or 'correct_answer' not in q:
                    return {
                        'success': False,
                        'error': 'Invalid question format'
                    }
            
            quiz_data = {
                'skill_name': skill_name,
                'questions': questions,
                'passing_score': passing_score,
                'difficulty_level': difficulty_level,
                'created_by': created_by,
                'is_active': True
            }
            
            result = db.table('skill_verification_quizzes').insert(quiz_data).execute()
            
            logger.info(f"Created quiz for {skill_name}")
            
            return {
                'success': True,
                'quiz_id': result.data[0]['id'] if result.data else None,
                'message': f'Quiz created for {skill_name}'
            }
            
        except Exception as e:
            logger.error(f"Error creating quiz: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


skill_verification_service = SkillVerificationService()
