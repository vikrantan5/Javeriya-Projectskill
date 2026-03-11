from fastapi import APIRouter, HTTPException, Depends
from app.utils.auth import get_current_user
from app.database import get_db
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/activities", tags=["Activities"])

@router.get("/recent")
async def get_recent_activities(
    limit: int = 20,
    current_user_id: str = Depends(get_current_user)
):
    """Get recent activities for the current user"""
    try:
        db = get_db()
        activities = []
        
        # Get recent tasks created
        tasks_created = db.table('tasks').select('id, title, created_at').eq('creator_id', current_user_id).order('created_at', desc=True).limit(5).execute()
        for task in (tasks_created.data or []):
            activities.append({
                'type': 'task_created',
                'title': f'Created task: {task["title"][:50]}',
                'time': task['created_at'],
                'icon': 'Briefcase',
                'color': 'green'
            })
        
        # Get recent tasks accepted
        tasks_accepted = db.table('tasks').select('id, title, updated_at').eq('acceptor_id', current_user_id).order('updated_at', desc=True).limit(5).execute()
        for task in (tasks_accepted.data or []):
            activities.append({
                'type': 'task_accepted',
                'title': f'Accepted task: {task["title"][:50]}',
                'time': task.get('updated_at') or task.get('created_at'),
                'icon': 'CheckCircle',
                'color': 'blue'
            })
        
        # Get recent sessions
        sessions = db.table('learning_sessions').select('id, skill_name, created_at, status').or_(f'mentor_id.eq.{current_user_id},learner_id.eq.{current_user_id}').order('created_at', desc=True).limit(5).execute()
        for session in (sessions.data or []):
            activities.append({
                'type': 'session',
                'title': f'Session: {session["skill_name"]}',
                'time': session['created_at'],
                'icon': 'Calendar',
                'color': 'purple'
            })
        
        # Get recent skill exchanges
        exchanges = db.table('skill_exchange_tasks').select('id, skill_offered, skill_requested, created_at, status').eq('creator_id', current_user_id).order('created_at', desc=True).limit(5).execute()
        for exchange in (exchanges.data or []):
            activities.append({
                'type': 'skill_exchange',
                'title': f'Exchange: {exchange["skill_offered"]} ↔ {exchange["skill_requested"]}',
                'time': exchange['created_at'],
                'icon': 'ArrowLeftRight',
                'color': 'indigo'
            })
        
        # Sort by time and limit
        activities.sort(key=lambda x: x['time'], reverse=True)
        activities = activities[:limit]
        
        return activities
        
    except Exception as e:
        logger.error(f"Error fetching activities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
