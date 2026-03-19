from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import ChatMessage, ChatResponse, SkillMatchRequest, SkillRecommendationRequest
from app.utils.auth import get_current_user
from app.database import get_db
from app.ai.groq_service import groq_service
from app.ai.skill_matching import skill_matcher
from app.ai.fraud_detection import fraud_detector
import logging
import uuid
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import List, Union

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI"])

class QuizSubmissionPayload(BaseModel):
    answers: List[int]

@router.post("/chatbot", response_model=ChatResponse)
async def chat_with_bot(chat_data: ChatMessage, current_user_id: str = Depends(get_current_user)):
    """Chat with AI learning assistant"""
    try:
        db = get_db()
        
        # Generate or use existing session ID
        session_id = chat_data.session_id or str(uuid.uuid4())
        
        # Get chat history for context
        history_result = db.table('chat_history').select('role, message').eq('user_id', current_user_id).eq('session_id', session_id).order('created_at', desc=False).limit(10).execute()
        
        chat_history = history_result.data if history_result.data else []
        
        # Get user's skills for context
        skills_result = db.table('user_skills').select('skill_name, skill_type').eq('user_id', current_user_id).execute()
        user_skills = skills_result.data if skills_result.data else []
        
        # Generate AI response
        ai_response = await groq_service.generate_learning_response(
            message=chat_data.message,
            chat_history=chat_history,
            user_skills=user_skills
        )
        
        # Save user message
        db.table('chat_history').insert({
            'user_id': current_user_id,
            'session_id': session_id,
            'role': 'user',
            'message': chat_data.message
        }).execute()
        
        # Save AI response
        db.table('chat_history').insert({
            'user_id': current_user_id,
            'session_id': session_id,
            'role': 'assistant',
            'message': ai_response
        }).execute()
        
        return {
            "response": ai_response,
            "session_id": session_id
        }
    
    except Exception as e:
        logger.error(f"Error in chatbot: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/match-mentors")
async def match_mentors(request: SkillMatchRequest, current_user_id: str = Depends(get_current_user)):
    """Find best mentors for a skill using AI matching"""
    try:
        db = get_db()
        
        # Get all users with the requested skill
        skills_result = db.table('user_skills').select('user_id, skill_level, is_verified').eq('skill_name', request.skill_name).eq('skill_type', 'offered').execute()
        
        if not skills_result.data:
            return {"matches": [], "message": "No mentors found for this skill"}
        
        # Get user details
        user_ids = [s['user_id'] for s in skills_result.data]
        users_result = db.table('users').select('id, username, full_name, profile_photo, average_rating, total_ratings, total_sessions, bio').in_('id', user_ids).execute()
        
        # Get current user's skills for better matching
        current_user_skills = db.table('user_skills').select('skill_name').eq('user_id', current_user_id).execute()
        
        # Use AI to rank mentors
        matches = skill_matcher.rank_mentors(
            mentors_data=users_result.data,
            skills_data=skills_result.data,
            requested_skill=request.skill_name,
            user_skills=[s['skill_name'] for s in current_user_skills.data] if current_user_skills.data else []
        )
        
        # Return top N matches
        return {
            "matches": matches[:request.limit],
            "total_found": len(matches)
        }
    
    except Exception as e:
        logger.error(f"Error matching mentors: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/recommend-skills")
async def recommend_skills(request: SkillRecommendationRequest, current_user_id: str = Depends(get_current_user)):
    """Get AI-powered skill recommendations"""
    try:
        # Use AI to recommend complementary skills
        recommendations = await groq_service.recommend_skills(
            user_skills=request.user_skills,
            limit=request.limit
        )
        
        return {
            "recommendations": recommendations,
            "message": "Skills recommended based on your current skills"
        }
    
    except Exception as e:
        logger.error(f"Error recommending skills: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/generate-quiz/{skill_name}")
async def generate_skill_quiz(
    skill_name: str,
    skill_level: str,
    current_user_id: str = Depends(get_current_user)
):
    """Generate AI-powered skill verification quiz"""
    try:
        db = get_db()

        # Generate quiz using AI
        quiz_data = await groq_service.generate_skill_quiz(
            skill_name=skill_name,
            skill_level=skill_level
        )

        raw_questions = quiz_data.get("questions", [])
        normalized_questions = []
        public_questions = []

        answer_map = {"A": 0, "B": 1, "C": 2, "D": 3}

        for question in raw_questions:
            options = question.get("options", [])

            if isinstance(options, dict):
                option_list = [
                    options.get("A", ""),
                    options.get("B", ""),
                    options.get("C", ""),
                    options.get("D", "")
                ]
            else:
                option_list = options

            correct_answer = question.get("correct_answer", 0)

            if isinstance(correct_answer, str):
                correct_answer = answer_map.get(correct_answer.upper(), 0)

            normalized_question = {
                "question": question.get("question", ""),
                "options": option_list,
                "correct_answer": int(correct_answer),
                "explanation": question.get("explanation", "")
            }

            normalized_questions.append(normalized_question)

            public_questions.append({
                "question": normalized_question["question"],
                "options": normalized_question["options"]
            })

        # Create test record
        test_record = {
            "user_id": current_user_id,
            "skill_name": skill_name,
            "questions": normalized_questions,
            "total_questions": len(normalized_questions)
        }

        test_result = db.table("skill_verification_tests").insert(test_record).execute()

        return {
            "test_id": test_result.data[0]["id"],
            "questions": public_questions,
            "total_questions": len(public_questions)
        }

    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/submit-quiz/{test_id}")
async def submit_skill_quiz(
    test_id: str,
     quiz_submission: Union[QuizSubmissionPayload, List[int]],
    current_user_id: str = Depends(get_current_user)
):
    answers = quiz_submission.answers if isinstance(quiz_submission, QuizSubmissionPayload) else quiz_submission
    """Submit skill verification quiz"""
    try:
        db = get_db()
        
        # Get test
        test_result = db.table('skill_verification_tests').select('*').eq('id', test_id).eq('user_id', current_user_id).execute()
        
        if not test_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test not found"
            )
        
        test = test_result.data[0]
        questions = test['questions']
        
        # Calculate score
        correct_answers = 0
        for i, answer in enumerate(answers):
            if i < len(questions) and answer == questions[i].get('correct_answer'):
                correct_answers += 1
        
        score = correct_answers
        total = len(questions)
        percentage = (score / total) * 100 if total > 0 else 0
        passed = percentage >= 70  # 70% passing threshold
        
        # Update test
        db.table('skill_verification_tests').update({
            'user_answers': answers,
            'score': score,
            'passed': passed,
            'completed_at': 'now()'
        }).eq('id', test_id).execute()
        
        # If passed, update user skill
        if passed:
            db.table('user_skills').update({
                'is_verified': True,
                'verification_score': score
            }).eq('user_id', current_user_id).eq('skill_name', test['skill_name']).execute()
        
        return {
            "passed": passed,
            "score": score,
            "total": total,
            "percentage": round(percentage, 2),
            "message": "Congratulations! Skill verified." if passed else "Keep learning and try again!"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting quiz: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/chat-history/{session_id}")
async def get_chat_history(session_id: str, current_user_id: str = Depends(get_current_user)):
    """Get chat history for a session"""
    try:
        db = get_db()
        
        history_result = db.table('chat_history').select('*').eq('user_id', current_user_id).eq('session_id', session_id).order('created_at', desc=False).execute()
        
        return history_result.data if history_result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    


# ============================================
# AI Assignment Decision Endpoints (Phase 3)
# ============================================

class AssignmentDecisionRequest(BaseModel):
    task_id: str
    user_id: str

class RankCandidatesRequest(BaseModel):
    task_id: str
    candidate_user_ids: List[str]

@router.post("/assignment-decision")
async def get_assignment_decision(
    request: AssignmentDecisionRequest,
    current_user_id: str = Depends(get_current_user)
):
    """
    Get AI-powered recommendation for assigning a task to a candidate
    
    Returns comprehensive analysis including:
    - Overall recommendation (recommended/not_recommended/neutral)
    - Confidence score (0-100)
    - Skill match, reliability, and rating breakdown
    - Strengths and concerns
    - AI-generated analysis
    """
    try:
        from app.services.ai_assignment_service import ai_assignment_service
        
        recommendation = await ai_assignment_service.get_assignment_recommendation(
            task_id=request.task_id,
             user_id=request.user_id,
            task_creator_id=current_user_id
        )
        
        return recommendation
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error getting assignment decision: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/rank-candidates")
async def rank_task_candidates(
    request: RankCandidatesRequest,
    current_user_id: str = Depends(get_current_user)
):
    """
    Rank multiple candidates for a task with best match identification
    
    Returns:
    - Ranked list of candidates with scores and emojis (🥇🥈🥉)
    - Best match identification (score >= 70 and rank #1)
    - Side-by-side comparison
    - AI-generated summary
    """
    try:
        from app.services.ai_assignment_service import ai_assignment_service
        
        if len(request.candidate_user_ids) == 0:
            raise ValueError("At least one candidate is required")
        
        ranking = await ai_assignment_service.rank_multiple_candidates(
            task_id=request.task_id,
            applicant_ids=request.candidate_user_ids,
            task_creator_id=current_user_id
        )
        
        return ranking
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error ranking candidates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )