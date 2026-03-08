from groq import Groq
from app.config import settings
import logging
from typing import List, Dict, Any
import json

logger = logging.getLogger(__name__)

class GroqAIService:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.GROQ_MODEL
    
    async def chat_completion(self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: int = 1024) -> str:
        """Get chat completion from Groq"""
        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return completion.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq chat completion error: {str(e)}")
            raise Exception(f"AI service error: {str(e)}")
    
    async def get_skill_recommendations(self, current_skills: List[str], limit: int = 5) -> List[Dict[str, str]]:
        """Get complementary skill recommendations based on current skills"""
        try:
            prompt = f"""You are a career and learning advisor. Given the following skills a student already has: {', '.join(current_skills)}
            
            Recommend {limit} complementary skills they should learn next to enhance their career prospects. 
            For each skill, provide:
            1. Skill name
            2. Brief reason (1-2 sentences) why it complements their existing skills
            3. Difficulty level (beginner/intermediate/advanced)
            4. Estimated learning time in weeks
            
            Return ONLY a JSON array with this exact structure:
            [{{
                "skill_name": "skill name",
                "reason": "why this skill",
                "difficulty": "beginner/intermediate/advanced",
                "learning_time_weeks": number
            }}]
            
            Do not include any markdown formatting or additional text."""
            
            messages = [
                {"role": "system", "content": "You are a helpful career advisor that provides skill recommendations in JSON format."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.chat_completion(messages, temperature=0.5)
            
            # Clean response and parse JSON
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()
            
            recommendations = json.loads(response)
            return recommendations[:limit]
        except Exception as e:
            logger.error(f"Skill recommendation error: {str(e)}")
            # Return fallback recommendations
            return [
                {"skill_name": "Problem Solving", "reason": "Essential for any domain", "difficulty": "intermediate", "learning_time_weeks": 8},
                {"skill_name": "Communication", "reason": "Critical for collaboration", "difficulty": "beginner", "learning_time_weeks": 4}
            ]
    
    async def generate_learning_roadmap(self, skill_name: str, current_level: str = "beginner") -> Dict[str, Any]:
        """Generate a learning roadmap for a skill"""
        try:
            prompt = f"""Create a detailed learning roadmap for someone who wants to learn {skill_name} starting from {current_level} level.
            
            Provide:
            1. 5-7 learning milestones in order
            2. Recommended resources (free if possible)
            3. Practice project ideas
            4. Estimated timeline
            
            Return as JSON:
            {{
                "skill": "{skill_name}",
                "starting_level": "{current_level}",
                "milestones": [
                    {{
                        "title": "milestone title",
                        "description": "what to learn",
                        "duration_weeks": number,
                        "resources": ["resource1", "resource2"]
                    }}
                ],
                "practice_projects": ["project1", "project2"],
                "total_duration_weeks": number
            }}
            
            Do not include markdown formatting."""
            
            messages = [
                {"role": "system", "content": "You are an expert learning advisor providing educational roadmaps in JSON format."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.chat_completion(messages, temperature=0.6, max_tokens=2048)
            
            # Clean and parse
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()
            
            roadmap = json.loads(response)
            return roadmap
        except Exception as e:
            logger.error(f"Learning roadmap generation error: {str(e)}")
            return {
                "skill": skill_name,
                "starting_level": current_level,
                "milestones": [{"title": "Start Learning", "description": "Begin with basics", "duration_weeks": 4, "resources": ["Online tutorials"]}],
                "practice_projects": ["Simple project"],
                "total_duration_weeks": 12
            }
    
    async def generate_learning_response(self, message: str, chat_history: List[Dict[str, str]], user_skills: List[Dict[str, str]]) -> str:
        """Generate contextual learning response"""
        try:
            skills_str = ", ".join([f"{s['skill_name']} ({s['skill_type']})" for s in user_skills]) if user_skills else "No skills listed yet"
            
            system_prompt = f"""You are TalentBot, an AI learning assistant for TalentConnect platform.
            
            User's current skills: {skills_str}
            
            You help students with:
            - Learning roadmaps and study plans
            - Skill recommendations
            - Resource suggestions
            - Academic guidance
            - Motivation and encouragement
            
            Be helpful, encouraging, and concise. Reference their skills when relevant."""
            
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add chat history
            for chat in chat_history[-5:]:  # Last 5 messages for context
                messages.append({"role": chat['role'], "content": chat['message']})
            
            messages.append({"role": "user", "content": message})
            
            response = await self.chat_completion(messages, temperature=0.7, max_tokens=512)
            return response
        except Exception as e:
            logger.error(f"Learning response error: {str(e)}")
            return "I'm here to help with your learning journey! How can I assist you today?"
    
    async def recommend_skills(self, user_skills: List[str], limit: int = 5) -> List[Dict[str, str]]:
        """Recommend skills based on current skills"""
        return await self.get_skill_recommendations(user_skills, limit)
        """Get chatbot response for learning assistance"""
        try:
            system_prompt = """You are TalentBot, an AI learning assistant for TalentConnect platform. 
            You help students with:
            - Learning roadmaps and study plans
            - Skill recommendations
            - Resource suggestions
            - Academic guidance
            - Platform navigation
            
            Be helpful, encouraging, and concise. If asked about platform features, explain them clearly.
            Always encourage peer-to-peer learning and collaboration."""
            
            messages = [{"role": "system", "content": system_prompt}]
            
            if context:
                messages.extend(context)
            
            messages.append({"role": "user", "content": user_message})
            
            response = await self.chat_completion(messages, temperature=0.7, max_tokens=512)
            return response
        except Exception as e:
            logger.error(f"Chatbot response error: {str(e)}")
            return "I apologize, but I'm having trouble processing your request right now. Please try again or contact support."
    
    async def generate_skill_quiz(self, skill_name: str, skill_level: str, num_questions: int = 5) -> Dict[str, Any]:
        """Generate quiz questions for skill verification"""
        try:
            prompt = f"""Generate {num_questions} multiple choice questions to verify {skill_level} level knowledge of {skill_name}.
            
            Each question should have:
            - A clear question
            - 4 options (A, B, C, D)
            - Correct answer (A, B, C, or D)
            - Brief explanation
            
            Return as JSON:
            {{
                "skill": "{skill_name}",
                "level": "{skill_level}",
                "questions": [
                    {{
                        "question": "question text",
                        "options": {{
                            "A": "option A",
                            "B": "option B",
                            "C": "option C",
                            "D": "option D"
                        }},
                        "correct_answer": "A/B/C/D",
                        "explanation": "why this is correct"
                    }}
                ]
            }}
            
            Do not include markdown formatting."""
            
            messages = [
                {"role": "system", "content": "You are an expert educator creating assessment questions in JSON format."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.chat_completion(messages, temperature=0.4, max_tokens=2048)
            
            # Clean and parse
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()
            
            quiz_data = json.loads(response)
            return quiz_data
        except Exception as e:
            logger.error(f"Quiz generation error: {str(e)}")
            # Return a simple fallback quiz
            return {
                "skill": skill_name,
                "level": skill_level,
                "questions": [
                    {
                        "question": f"What is a fundamental concept in {skill_name}?",
                        "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
                        "correct_answer": "A",
                        "explanation": "This is a basic concept."
                    }
                ]
            }

groq_service = GroqAIService()
