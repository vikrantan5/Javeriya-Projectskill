"""
Roadmap Generator Service - AI-powered learning roadmap generation using Groq
"""
from groq import Groq
from app.config import settings
from app.database import get_db
import json
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

class RoadmapGeneratorService:
    """Service for generating personalized learning roadmaps"""
    
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.GROQ_MODEL
    
    def generate_roadmap(self, user_id: str, career_goal: str, current_skills: List[str] = None) -> Dict:
        """
        Generate a personalized learning roadmap using AI
        
        Args:
            user_id: ID of the user requesting the roadmap
            career_goal: The career goal or target role (e.g., "Backend Developer")
            current_skills: List of user's current skills
            
        Returns:
            Dict with roadmap data
        """
        try:
            db = get_db()
            
            # Get user's current skills if not provided
            if current_skills is None:
                skills_result = db.table('user_skills').select('skill_name').eq('user_id', user_id).execute()
                current_skills = [s['skill_name'] for s in skills_result.data] if skills_result.data else []
            
            # Create prompt for AI
            skills_text = ', '.join(current_skills) if current_skills else 'No skills listed yet'
            
            prompt = f"""You are an expert career advisor and learning path designer. Create a detailed, step-by-step learning roadmap for someone who wants to become a {career_goal}.

Current Skills: {skills_text}

Please provide a structured learning roadmap with the following format:
1. Each step should be a clear milestone
2. Include specific skills, technologies, or concepts to learn
3. Provide estimated time for each step
4. Include practical projects or exercises
5. Order steps from beginner to advanced

Return the response ONLY as a valid JSON object with this structure:
{{
    "career_goal": "{career_goal}",
    "estimated_total_time": "X months",
    "difficulty_level": "beginner/intermediate/advanced",
    "steps": [
        {{
            "step_number": 1,
            "title": "Step title",
            "description": "What to learn and why",
            "skills_to_learn": ["skill1", "skill2"],
            "estimated_time": "2 weeks",
            "resources": ["resource1", "resource2"],
            "projects": ["project idea"],
            "status": "not_started"
        }}
    ],
    "prerequisites": ["prerequisite1", "prerequisite2"],
    "career_opportunities": ["job title 1", "job title 2"]
}}

Make it practical, realistic, and tailored to their current skill level. Include 6-10 steps."""

            # Call Groq API
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert career advisor who creates structured learning roadmaps. Always respond with valid JSON only, no additional text."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=self.model,
                temperature=0.7,
                max_tokens=2000
            )
            
            # Parse response
            response_text = chat_completion.choices[0].message.content.strip()
            
            # Try to extract JSON if wrapped in markdown code blocks
            if response_text.startswith('```'):
                # Remove markdown code blocks
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            roadmap_data = json.loads(response_text)
            
            # Save roadmap to database
            roadmap_record = {
                'user_id': user_id,
                'career_goal': career_goal,
                'roadmap_data': roadmap_data,
                'current_step': 1,
                'completion_percentage': 0.0,
                'is_active': True
            }
            
            result = db.table('learning_roadmaps').insert(roadmap_record).execute()
            
            if result.data:
                roadmap_data['roadmap_id'] = result.data[0]['id']
            
            logger.info(f"Generated roadmap for user {user_id} - Goal: {career_goal}")
            
            return {
                'success': True,
                'roadmap': roadmap_data,
                'message': f'Roadmap created for {career_goal}'
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            logger.error(f"Response was: {response_text}")
            
            # Fallback: create a basic roadmap
            fallback_roadmap = self._create_fallback_roadmap(career_goal, current_skills)
            return {
                'success': True,
                'roadmap': fallback_roadmap,
                'message': f'Roadmap created for {career_goal} (basic version)',
                'note': 'Using fallback roadmap due to AI response parsing error'
            }
            
        except Exception as e:
            logger.error(f"Error generating roadmap: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to generate roadmap'
            }
    
    def _create_fallback_roadmap(self, career_goal: str, current_skills: List[str]) -> Dict:
        """Create a basic fallback roadmap if AI fails"""
        return {
            'career_goal': career_goal,
            'estimated_total_time': '6-12 months',
            'difficulty_level': 'intermediate',
            'steps': [
                {
                    'step_number': 1,
                    'title': 'Learn the Fundamentals',
                    'description': f'Build a strong foundation in core concepts for {career_goal}',
                    'skills_to_learn': ['Basic concepts', 'Core principles'],
                    'estimated_time': '4-6 weeks',
                    'resources': ['Online courses', 'Documentation'],
                    'projects': ['Small practice projects'],
                    'status': 'not_started'
                },
                {
                    'step_number': 2,
                    'title': 'Build Practical Projects',
                    'description': 'Apply your knowledge through hands-on projects',
                    'skills_to_learn': ['Practical application', 'Problem solving'],
                    'estimated_time': '8-10 weeks',
                    'resources': ['Project tutorials', 'GitHub repositories'],
                    'projects': ['Portfolio projects'],
                    'status': 'not_started'
                },
                {
                    'step_number': 3,
                    'title': 'Advanced Topics',
                    'description': 'Deepen your expertise in advanced areas',
                    'skills_to_learn': ['Advanced concepts', 'Best practices'],
                    'estimated_time': '8-12 weeks',
                    'resources': ['Advanced courses', 'Books'],
                    'projects': ['Complex applications'],
                    'status': 'not_started'
                }
            ],
            'prerequisites': current_skills if current_skills else ['None - suitable for beginners'],
            'career_opportunities': [career_goal, f'Junior {career_goal}', f'Senior {career_goal}']
        }
    
    def get_user_roadmaps(self, user_id: str, active_only: bool = True) -> List[Dict]:
        """Get all roadmaps for a user"""
        try:
            db = get_db()
            
            query = db.table('learning_roadmaps').select('*').eq('user_id', user_id)
            
            if active_only:
                query = query.eq('is_active', True)
            
            result = query.order('created_at', desc=True).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error getting roadmaps: {str(e)}")
            return []
    
    def update_progress(self, roadmap_id: str, user_id: str, current_step: int, completion_percentage: float) -> bool:
        """Update roadmap progress"""
        try:
            db = get_db()
            
            # Verify roadmap belongs to user
            roadmap_result = db.table('learning_roadmaps').select('*').eq('id', roadmap_id).eq('user_id', user_id).execute()
            
            if not roadmap_result.data:
                return False
            
            # Update progress
            db.table('learning_roadmaps').update({
                'current_step': current_step,
                'completion_percentage': completion_percentage
            }).eq('id', roadmap_id).execute()
            
            logger.info(f"Updated roadmap {roadmap_id} progress: Step {current_step}, {completion_percentage}%")
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating progress: {str(e)}")
            return False
    
    def complete_roadmap(self, roadmap_id: str, user_id: str) -> bool:
        """Mark a roadmap as completed"""
        try:
            db = get_db()
            
            db.table('learning_roadmaps').update({
                'completion_percentage': 100.0,
                'is_active': False
            }).eq('id', roadmap_id).eq('user_id', user_id).execute()
            
            # Award tokens for completing roadmap
            from app.services.token_service import token_service
            token_service.earn_tokens(
                user_id=user_id,
                amount=200,  # Bonus for completing a roadmap
                reason='roadmap_completed',
                reference_id=roadmap_id
            )
            
            logger.info(f"Roadmap {roadmap_id} completed by user {user_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error completing roadmap: {str(e)}")
            return False


roadmap_generator_service = RoadmapGeneratorService()
