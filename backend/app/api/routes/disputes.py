from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import TaskDisputeCreate, TaskDisputeResponse, TaskDisputeUpdate
from app.utils.auth import get_current_user, get_current_admin_user
from app.database import get_db
from typing import List
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/disputes", tags=["Disputes"])

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_dispute(dispute_data: TaskDisputeCreate, current_user_id: str = Depends(get_current_user)):
    """Create a task dispute - available for both task owner and acceptor"""
    try:
        db = get_db()
        
        # Verify task exists
        task_result = db.table('tasks').select('*').eq('id', str(dispute_data.task_id)).execute()
        
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        task = task_result.data[0]
        
        # Verify user is involved in the task
        if current_user_id not in [task['creator_id'], task.get('acceptor_id'), task.get('assigned_user_id')]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be involved in this task to raise a dispute"
            )
        
        # Verify against_user_id is also involved
        if str(dispute_data.against_user_id) not in [task['creator_id'], task.get('acceptor_id'), task.get('assigned_user_id')]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dispute must be against someone involved in this task"
            )
        
        # Cannot raise dispute against yourself
        if current_user_id == str(dispute_data.against_user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot raise a dispute against yourself"
            )
        
        # Create dispute
        new_dispute = {
            'task_id': str(dispute_data.task_id),
            'raised_by': current_user_id,
            'against_user_id': str(dispute_data.against_user_id),
            'dispute_type': dispute_data.dispute_type,
            'dispute_reason': dispute_data.dispute_reason,
            'evidence_urls': dispute_data.evidence_urls or [],
            'status': 'open'
        }
        
        result = db.table('task_disputes').insert(new_dispute).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create dispute"
            )
        
        created_dispute = result.data[0]
        
        # Update payment to disputed status
        db.table('payments').update({
            'escrow_status': 'DISPUTED'
        }).eq('task_id', str(dispute_data.task_id)).execute()
        
        # Notify the other party
        db.table('notifications').insert({
            'user_id': str(dispute_data.against_user_id),
            'title': '⚠️ Dispute Raised',
            'message': f'A dispute has been raised against you for task "{task["title"]}". Type: {dispute_data.dispute_type}',
            'notification_type': 'dispute',
            'reference_id': created_dispute['id'],
            'reference_type': 'dispute'
        }).execute()
        
        # Notify all admins
        admins_result = db.table('users').select('id').eq('role', 'admin').execute()
        
        if admins_result.data:
            for admin in admins_result.data:
                db.table('notifications').insert({
                    'user_id': admin['id'],
                    'title': '🚨 New Dispute Raised',
                    'message': f'A {dispute_data.dispute_type} dispute has been raised for task "{task["title"]}"',
                    'notification_type': 'admin_dispute',
                    'reference_id': created_dispute['id'],
                    'reference_type': 'dispute'
                }).execute()
        
        return {
            "message": "Dispute raised successfully. An admin will review it shortly.",
            "dispute": created_dispute
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating dispute: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/my-disputes", response_model=List[dict])
async def get_my_disputes(current_user_id: str = Depends(get_current_user)):
    """Get disputes raised by or against current user"""
    try:
        db = get_db()
        
        # Get disputes raised by user
        raised_disputes = db.table('task_disputes').select('*').eq('raised_by', current_user_id).order('created_at', desc=True).execute()
        
        # Get disputes against user
        against_disputes = db.table('task_disputes').select('*').eq('against_user_id', current_user_id).order('created_at', desc=True).execute()
        
        all_disputes = (raised_disputes.data or []) + (against_disputes.data or [])
        
        # Get task details for each dispute
        task_ids = list(set([d['task_id'] for d in all_disputes]))
        if task_ids:
            tasks_result = db.table('tasks').select('id, title, status').in_('id', task_ids).execute()
            tasks_dict = {t['id']: t for t in (tasks_result.data or [])}
            
            # Attach task info to disputes
            for dispute in all_disputes:
                dispute['task'] = tasks_dict.get(dispute['task_id'])
        
        return all_disputes
    
    except Exception as e:
        logger.error(f"Error fetching my disputes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/task/{task_id}", response_model=List[dict])
async def get_task_disputes(task_id: str, current_user_id: str = Depends(get_current_user)):
    """Get all disputes for a specific task"""
    try:
        db = get_db()
        
        # Verify user is involved in the task
        task_result = db.table('tasks').select('*').eq('id', task_id).execute()
        
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        task = task_result.data[0]
        
        if current_user_id not in [task['creator_id'], task.get('acceptor_id'), task.get('assigned_user_id')]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be involved in this task to view disputes"
            )
        
        # Get disputes
        disputes_result = db.table('task_disputes').select('*').eq('task_id', task_id).order('created_at', desc=True).execute()
        
        return disputes_result.data if disputes_result.data else []
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching task disputes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/", response_model=List[dict])
async def get_all_disputes(
    status_filter: str = None,
    current_admin_id: str = Depends(get_current_admin_user)
):
    """Get all disputes (Admin only)"""
    try:
        db = get_db()
        
        query = db.table('task_disputes').select('*')
        
        if status_filter:
            query = query.eq('status', status_filter)
        
        disputes_result = query.order('created_at', desc=True).execute()
        
        if not disputes_result.data:
            return []
        
        # Get user details
        user_ids = list(set([d['raised_by'] for d in disputes_result.data] + [d['against_user_id'] for d in disputes_result.data]))
        users_result = db.table('users').select('id, username, email, full_name').in_('id', user_ids).execute()
        users_dict = {user['id']: user for user in (users_result.data or [])}
        
        # Get task details
        task_ids = list(set([d['task_id'] for d in disputes_result.data]))
        tasks_result = db.table('tasks').select('id, title, status, price').in_('id', task_ids).execute()
        tasks_dict = {task['id']: task for task in (tasks_result.data or [])}
        
        # Combine data
        disputes_with_details = []
        for dispute in disputes_result.data:
            disputes_with_details.append({
                **dispute,
                'raised_by_user': users_dict.get(dispute['raised_by']),
                'against_user': users_dict.get(dispute['against_user_id']),
                'task': tasks_dict.get(dispute['task_id'])
            })
        
        return disputes_with_details
    
    except Exception as e:
        logger.error(f"Error fetching disputes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.patch("/{dispute_id}", response_model=dict)
async def update_dispute(
    dispute_id: str,
    dispute_update: TaskDisputeUpdate,
    current_admin_id: str = Depends(get_current_admin_user)
):
    """Update dispute status and resolution (Admin only)"""
    try:
        db = get_db()
        
        # Get dispute
        dispute_result = db.table('task_disputes').select('*').eq('id', dispute_id).execute()
        
        if not dispute_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dispute not found"
            )
        
        dispute = dispute_result.data[0]
        
        # Update dispute
        update_data = {
            'status': dispute_update.status,
            'resolution': dispute_update.resolution,
            'admin_notes': dispute_update.admin_notes,
            'resolved_by': current_admin_id,
            'resolved_at': utc_now_iso()
        }
        
        db.table('task_disputes').update(update_data).eq('id', dispute_id).execute()
        
        # Notify both parties
        for user_id in [dispute['raised_by'], dispute['against_user_id']]:
            db.table('notifications').insert({
                'user_id': user_id,
                'title': 'Dispute Updated',
                'message': f'Your dispute has been {dispute_update.status}. {dispute_update.resolution or ""}',
                'notification_type': 'dispute_update',
                'reference_id': dispute_id,
                'reference_type': 'dispute'
            }).execute()
        
        # Log admin action
        db.table('admin_actions').insert({
            'admin_id': current_admin_id,
            'action_type': 'dispute_resolved',
            'target_type': 'dispute',
            'target_id': dispute_id,
            'action_details': {
                'status': dispute_update.status,
                'resolution': dispute_update.resolution
            },
            'reason': dispute_update.admin_notes
        }).execute()
        
        return {
            "message": "Dispute updated successfully",
            "dispute_id": dispute_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating dispute: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
