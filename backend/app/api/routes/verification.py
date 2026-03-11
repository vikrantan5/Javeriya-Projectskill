from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.utils.auth import get_current_user
from app.services.skill_verification_service import skill_verification_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/verification", tags=["Skill Verification"])

class QuizSubmission(BaseModel):
    user_answers: List[int]

class QuizCreate(BaseModel):
    skill_name: str
    questions: List[dict]
    passing_score: int
    difficulty_level: str = "intermediate"

@router.get("/quizzes")
async def get_available_quizzes(skill_name: Optional[str] = None):
    """Get all available verification quizzes, optionally filtered by skill"""
    try:
        quizzes = skill_verification_service.get_available_quizzes(skill_name)
        
        return {
            "total": len(quizzes),
            "quizzes": quizzes
        }
        
    except Exception as e:
        logger.error(f"Error getting quizzes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quiz/{quiz_id}")
async def get_quiz(quiz_id: str, current_user_id: str = Depends(get_current_user)):
    """Get a specific quiz for taking"""
    try:
        quiz = skill_verification_service.get_quiz(quiz_id)
        
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        return quiz
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quiz/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: str,
    submission: QuizSubmission,
    current_user_id: str = Depends(get_current_user)
):
    """Submit quiz answers and get results"""
    try:
        result = skill_verification_service.submit_quiz(
            quiz_id=quiz_id,
            user_id=current_user_id,
            user_answers=submission.user_answers
        )
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result.get('error', 'Failed to submit quiz'))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-attempts")
async def get_my_attempts(
    skill_name: Optional[str] = None,
    limit: int = 20,
    current_user_id: str = Depends(get_current_user)
):
    """Get quiz attempts for current user"""
    try:
        attempts = skill_verification_service.get_user_attempts(
            user_id=current_user_id,
            skill_name=skill_name,
            limit=limit
        )
        
        return {
            "total": len(attempts),
            "attempts": attempts
        }
        
    except Exception as e:
        logger.error(f"Error getting attempts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-verified-skills")
async def get_my_verified_skills(current_user_id: str = Depends(get_current_user)):
    """Get all verified skills for current user"""
    try:
        verified_skills = skill_verification_service.get_user_verified_skills(current_user_id)
        
        return {
            "total": len(verified_skills),
            "verified_skills": verified_skills
        }
        
    except Exception as e:
        logger.error(f"Error getting verified skills: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quiz/create")
async def create_quiz(
    quiz_data: QuizCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Create a new verification quiz (admin only - add auth check in production)"""
    try:
        result = skill_verification_service.create_quiz(
            skill_name=quiz_data.skill_name,
            questions=quiz_data.questions,
            passing_score=quiz_data.passing_score,
            difficulty_level=quiz_data.difficulty_level,
            created_by=current_user_id
        )
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result.get('error', 'Failed to create quiz'))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
