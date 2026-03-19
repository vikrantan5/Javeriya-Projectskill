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
        
        # Try to get from user_activities table first (if it exists)
        try:
            user_activities = db.table('user_activities').select('*').eq('user_id', current_user_id).order('created_at', desc=True).limit(limit).execute()
            
            if user_activities.data:
                for activity in user_activities.data:
                    icon_map = {
                        'task_created': 'Briefcase',
                        'task_accepted': 'CheckCircle',
                        'task_assigned': 'UserCheck',
                        'task_submitted': 'Upload',
                        'task_completed': 'CheckCircle2',
                        'payment_made': 'ArrowUpCircle',
                        'payment_received': 'ArrowDownCircle',
                        'session_booked': 'Calendar',
                        'session_completed': 'CheckSquare'
                    }
                    
                    color_map = {
                        'task_created': 'green',
                        'task_accepted': 'blue',
                        'task_assigned': 'indigo',
                        'task_submitted': 'yellow',
                        'task_completed': 'green',
                        'payment_made': 'red',
                        'payment_received': 'green',
                        'session_booked': 'purple',
                        'session_completed': 'green'
                    }
                    
                    activities.append({
                        'id': activity['id'],
                        'type': activity['activity_type'],
                        'title': activity['title'],
                        'description': activity.get('description'),
                        'time': activity['created_at'],
                        'icon': icon_map.get(activity['activity_type'], 'Activity'),
                        'color': color_map.get(activity['activity_type'], 'gray'),
                        'reference_id': activity.get('reference_id'),
                        'reference_type': activity.get('reference_type')
                    })
                
                return activities
        except Exception as activity_error:
            logger.warning(f"user_activities table not available, falling back to manual aggregation: {str(activity_error)}")
        
        # Fallback: Manually aggregate activities from different tables
        
        # Get recent tasks created
        tasks_created = db.table('tasks').select('id, title, created_at, status').eq('creator_id', current_user_id).order('created_at', desc=True).limit(5).execute()
        for task in (tasks_created.data or []):
            activities.append({
                'type': 'task_created',
                'title': f'Created task: {task["title"][:50]}',
                'time': task['created_at'],
                'icon': 'Briefcase',
                'color': 'green',
                'reference_id': task['id'],
                'status': task.get('status')
            })
        
        # Get recent tasks accepted/assigned
        tasks_accepted = db.table('tasks').select('id, title, updated_at, created_at, status').eq('acceptor_id', current_user_id).order('updated_at', desc=True).limit(5).execute()
        for task in (tasks_accepted.data or []):
            status_text = {
                'accepted': 'Working on',
                'submitted': 'Submitted work for',
                'completed': 'Completed'
            }.get(task.get('status', 'accepted'), 'Accepted')
            
            activities.append({
                'type': 'task_accepted',
                'title': f'{status_text} task: {task["title"][:50]}',
                'time': task.get('updated_at') or task.get('created_at'),
                'icon': 'CheckCircle',
                'color': 'blue',
                'reference_id': task['id'],
                'status': task.get('status')
            })
        
        # Get recent wallet transactions
        wallet_txns = db.table('wallet_transactions').select('*').eq('user_id', current_user_id).order('created_at', desc=True).limit(5).execute()
        for txn in (wallet_txns.data or []):
            txn_type = txn.get('transaction_type', 'credit')
            activities.append({
                'type': f'payment_{txn_type}',
                'title': f"{'Received' if txn_type == 'credit' else 'Spent'} ₹{txn.get('amount', 0)}",
                'description': txn.get('reason', 'Transaction'),
                'time': txn['created_at'],
                'icon': 'Wallet',
                'color': 'green' if txn_type == 'credit' else 'red',
                'reference_id': txn.get('reference_id')
            })
        
        # Get recent sessions
        sessions = db.table('learning_sessions').select('id, skill_name, created_at, status').or_(f'mentor_id.eq.{current_user_id},learner_id.eq.{current_user_id}').order('created_at', desc=True).limit(5).execute()
        for session in (sessions.data or []):
            activities.append({
                'type': 'session',
                'title': f'Session: {session["skill_name"]}',
                'time': session['created_at'],
                'icon': 'Calendar',
                'color': 'purple',
                'status': session.get('status')
            })
        
        # Get recent skill exchanges
        exchanges = db.table('skill_exchange_tasks').select('id, skill_offered, skill_requested, created_at, status').eq('creator_id', current_user_id).order('created_at', desc=True).limit(5).execute()
        for exchange in (exchanges.data or []):
            activities.append({
                'type': 'skill_exchange',
                'title': f'Exchange: {exchange["skill_offered"]} ↔ {exchange["skill_requested"]}',
                'time': exchange['created_at'],
                'icon': 'ArrowLeftRight',
                'color': 'indigo',
                'status': exchange.get('status')
            })
        
        # Sort by time and limit
        activities.sort(key=lambda x: x.get('time', ''), reverse=True)
        activities = activities[:limit]
        
        return activities
        
    except Exception as e:
        logger.error(f"Error fetching activities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))