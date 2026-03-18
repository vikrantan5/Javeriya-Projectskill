from fastapi import APIRouter, HTTPException, status, Depends
from app.utils.auth import get_current_user
from app.database import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(current_user_id: str = Depends(get_current_user)):
    """
    Get user-specific dashboard statistics
    Returns only data relevant to the current user
    """
    try:
        db = get_db()
        
        # Get user data
        user_result = db.table('users').select('*').eq('id', current_user_id).execute()
        
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_result.data[0]
        
        # 1. Total Sessions (as mentor OR learner, completed status)
        mentor_sessions = db.table('learning_sessions').select('id').eq('mentor_id', current_user_id).eq('status', 'completed').execute()
        learner_sessions = db.table('learning_sessions').select('id').eq('learner_id', current_user_id).eq('status', 'completed').execute()
        
        # Also count skill exchange sessions
        skill_exchange_sessions = db.table('skill_exchange_sessions').select('id').or_(
            f'participant1_id.eq.{current_user_id},participant2_id.eq.{current_user_id}'
        ).eq('status', 'completed').execute()
        
        total_sessions = (
            len(mentor_sessions.data or []) + 
            len(learner_sessions.data or []) +
            len(skill_exchange_sessions.data or [])
        )
        
        # 2. Tasks Completed (where user is assigned_user_id or acceptor_id AND status = completed)
        completed_tasks = db.table('tasks').select('id').or_(
            f'assigned_user_id.eq.{current_user_id},acceptor_id.eq.{current_user_id}'
        ).eq('status', 'completed').execute()
        
        tasks_completed = len(completed_tasks.data or [])
        
        # 3. Average Rating (from user table, calculated from ratings received)
        average_rating = user.get('average_rating', 0.0)
        
        # If no rating in user table, calculate from ratings table
        if not average_rating:
            ratings_received = db.table('ratings').select('rating').eq('receiver_id', current_user_id).execute()
            if ratings_received.data and len(ratings_received.data) > 0:
                total_rating = sum([r.get('rating', 0) for r in ratings_received.data])
                average_rating = round(total_rating / len(ratings_received.data), 1)
            else:
                average_rating = 0.0
        
        # 4. Skills Listed (from user_skills table)
        user_skills = db.table('user_skills').select('id').eq('user_id', current_user_id).execute()
        skills_listed = len(user_skills.data or [])
        
        # 5. Skill Tokens (from skill_tokens table or wallet)
        tokens_result = db.table('skill_tokens').select('balance').eq('user_id', current_user_id).execute()
        
        if tokens_result.data:
            tokens = tokens_result.data[0].get('balance', 0)
        else:
            # Try wallet table as fallback
            wallet_result = db.table('wallet').select('balance').eq('user_id', current_user_id).execute()
            tokens = wallet_result.data[0].get('balance', 0) if wallet_result.data else 0
        
        # Additional useful stats
        # Total earnings (completed tasks where user is acceptor)
        earnings_tasks = db.table('tasks').select('price').eq('acceptor_id', current_user_id).eq('status', 'completed').execute()
        total_earnings = sum([task.get('price', 0) for task in (earnings_tasks.data or [])])
        
        # Active tasks (in progress)
        active_tasks = db.table('tasks').select('id').or_(
            f'assigned_user_id.eq.{current_user_id},acceptor_id.eq.{current_user_id}'
        ).in_('status', ['accepted', 'in_progress', 'submitted']).execute()
        active_tasks_count = len(active_tasks.data or [])
        
        # Pending session requests
        pending_requests = db.table('session_requests').select('id').eq('receiver_id', current_user_id).eq('status', 'pending').execute()
        pending_requests_count = len(pending_requests.data or [])
        
        return {
            "total_sessions": total_sessions,
            "tasks_completed": tasks_completed,
            "average_rating": average_rating,
            "skills_listed": skills_listed,
            "tokens": tokens,
            "total_earnings": total_earnings,
            "active_tasks": active_tasks_count,
            "pending_requests": pending_requests_count
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/recent-activity")
async def get_recent_activity(limit: int = 10, current_user_id: str = Depends(get_current_user)):
    """
    Get recent activities for the current user
    """
    try:
        db = get_db()
        activities = []
        
        # Recent sessions
        sessions = db.table('learning_sessions').select('*').or_(
            f'mentor_id.eq.{current_user_id},learner_id.eq.{current_user_id}'
        ).order('created_at', desc=True).limit(5).execute()
        
        for session in (sessions.data or []):
            activities.append({
                'type': 'session',
                'title': f"Learning Session: {session.get('skill_name')}",
                'status': session.get('status'),
                'date': session.get('created_at'),
                'id': session.get('id')
            })
        
        # Recent tasks
        tasks = db.table('tasks').select('*').or_(
            f'creator_id.eq.{current_user_id},acceptor_id.eq.{current_user_id},assigned_user_id.eq.{current_user_id}'
        ).order('created_at', desc=True).limit(5).execute()
        
        for task in (tasks.data or []):
            activities.append({
                'type': 'task',
                'title': task.get('title'),
                'status': task.get('status'),
                'date': task.get('created_at'),
                'id': task.get('id')
            })
        
        # Sort by date and limit
        activities.sort(key=lambda x: x.get('date') or '', reverse=True)
        
        return {
            "activities": activities[:limit]
        }
    
    except Exception as e:
        logger.error(f"Error fetching recent activity: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
