from fastapi import APIRouter, HTTPException, status, Depends, Body
from app.models.schemas import (
    TaskCreate,
    TaskResponse,
    TaskUpdate,
    TaskSubmissionCreate,
    TaskSubmissionResponse,
    SkillExchangeTaskCreate,
    SkillExchangeTaskAccept,
)
from app.utils.auth import get_current_user
from app.database import get_db
from app.services.plagiarism_service import plagiarism_detector
from typing import List
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_task(task_data: TaskCreate, current_user_id: str = Depends(get_current_user)):
    """Create a new task"""
    try:
        db = get_db()
        
            # Create task (use only safe core fields; add optional fields conditionally)
        new_task = {
            'creator_id': current_user_id,
            'title': task_data.title,
            'description': task_data.description,
            'price': float(task_data.price),
            'currency': 'INR',
            'deadline': task_data.deadline.isoformat(),
            'status': 'open'
        }
        if task_data.subject:
            new_task['subject'] = task_data.subject
        if task_data.difficulty_level:
            new_task['difficulty_level'] = task_data.difficulty_level
        if task_data.attachment_urls or task_data.attachments:
            new_task['attachment_urls'] = task_data.attachment_urls or task_data.attachments or []
        if task_data.requirements:
            new_task['requirements'] = task_data.requirements
        if task_data.estimated_hours is not None:
            new_task['estimated_hours'] = task_data.estimated_hours
        
        result = db.table('tasks').insert(new_task).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create task"
            )
        
        return {
            "message": "Task created successfully",
            "task": result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/", response_model=List[dict])
async def get_all_tasks(status: str = "open", current_user_id: str = Depends(get_current_user)):
    """Get all tasks with optional status filter"""
    try:
        db = get_db()
        
        # Get tasks excluding current user's tasks
        query = db.table('tasks').select('*').neq('creator_id', current_user_id)
        
        if status:
            query = query.eq('status', status)
        
        tasks_result = query.order('created_at', desc=True).execute()
        
        if not tasks_result.data:
            return []
        
        # Get creator details
        creator_ids = list(set([task['creator_id'] for task in tasks_result.data]))
        users_result = db.table('users').select('id, username, full_name, profile_photo, average_rating').in_('id', creator_ids).execute()
        
        users_dict = {user['id']: user for user in users_result.data}
        
        results = []
        for task in tasks_result.data:
            creator = users_dict.get(task['creator_id'])
            if creator:
                results.append({
                    'task': task,
                    'creator': creator
                })
        
        return results
    
    except Exception as e:
        logger.error(f"Error fetching tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/my-tasks")
async def get_my_tasks(current_user_id: str = Depends(get_current_user)):
    """Get tasks created by current user"""
    try:
        db = get_db()
        
        tasks_result = db.table('tasks').select('*').eq('creator_id', current_user_id).order('created_at', desc=True).execute()
        
        return tasks_result.data if tasks_result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching my tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/accepted-tasks")
async def get_accepted_tasks(current_user_id: str = Depends(get_current_user)):
    """Get tasks accepted by current user"""
    try:
        db = get_db()
        
        tasks_result = db.table('tasks').select('*').eq('acceptor_id', current_user_id).order('created_at', desc=True).execute()
        
        if not tasks_result.data:
            return []
        
        # Get creator details
        creator_ids = list(set([task['creator_id'] for task in tasks_result.data]))
        users_result = db.table('users').select('id, username, full_name, profile_photo').in_('id', creator_ids).execute()
        
        users_dict = {user['id']: user for user in users_result.data}
        
        results = []
        for task in tasks_result.data:
            creator = users_dict.get(task['creator_id'])
            if creator:
                results.append({
                    'task': task,
                    'creator': creator
                })
        
        return results
    
    except Exception as e:
        logger.error(f"Error fetching accepted tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    
@router.post("/exchange", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_skill_exchange_task(
    task_data: SkillExchangeTaskCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Create a skill exchange task (I teach X, I want Y)."""
    try:
        db = get_db()

        if task_data.skill_offered.strip().lower() == task_data.skill_requested.strip().lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Offered and requested skills must be different"
            )

        new_exchange_task = {
            'creator_id': current_user_id,
            'skill_offered': task_data.skill_offered.strip(),
            'skill_requested': task_data.skill_requested.strip(),
            'description': task_data.description,
            'status': 'open'
        }

        result = db.table('skill_exchange_tasks').insert(new_exchange_task).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create skill exchange task"
            )

        return {
            "message": "Skill exchange task created successfully",
            "task": result.data[0]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating skill exchange task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/exchange", response_model=List[dict])
async def get_skill_exchange_tasks(
    status_filter: str = "open",
    current_user_id: str = Depends(get_current_user)
):
    """Get skill exchange tasks for marketplace."""
    try:
        db = get_db()

        query = db.table('skill_exchange_tasks').select('*').neq('creator_id', current_user_id)
        if status_filter:
            query = query.eq('status', status_filter)

        tasks_result = query.order('created_at', desc=True).execute()
        if not tasks_result.data:
            return []

        creator_ids = list({task['creator_id'] for task in tasks_result.data})
        users_result = db.table('users').select('id, username, full_name, profile_photo, average_rating').in_('id', creator_ids).execute()
        users_dict = {user['id']: user for user in (users_result.data or [])}

        return [
            {
                'task': task,
                'creator': users_dict.get(task['creator_id'])
            }
            for task in tasks_result.data
        ]

    except Exception as e:
        logger.error(f"Error fetching skill exchange tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/exchange/my", response_model=List[dict])
async def get_my_skill_exchange_tasks(current_user_id: str = Depends(get_current_user)):
    """Get my own skill exchange tasks."""
    try:
        db = get_db()
        result = db.table('skill_exchange_tasks').select('*').eq('creator_id', current_user_id).order('created_at', desc=True).execute()
        return result.data or []
    except Exception as e:
        logger.error(f"Error fetching my skill exchange tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/exchange/{exchange_task_id}/accept", response_model=dict)
async def accept_skill_exchange_task(
    exchange_task_id: str,
    payload: SkillExchangeTaskAccept,
    current_user_id: str = Depends(get_current_user)
):
    """
    Accept a skill exchange task with exact reciprocal matching:
    A offers X wants Y, B offers Y wants X.
    """
    try:
        db = get_db()

        target_result = db.table('skill_exchange_tasks').select('*').eq('id', exchange_task_id).execute()
        if not target_result.data:
            raise HTTPException(status_code=404, detail="Skill exchange task not found")

        target_task = target_result.data[0]
        if target_task['creator_id'] == current_user_id:
            raise HTTPException(status_code=400, detail="You cannot accept your own exchange task")
        if target_task['status'] != 'open':
            raise HTTPException(status_code=400, detail="Exchange task is not open")

        reciprocal_query = db.table('skill_exchange_tasks').select('*').eq('creator_id', current_user_id).eq('status', 'open').eq('skill_offered', target_task['skill_requested']).eq('skill_requested', target_task['skill_offered'])
        if payload.reciprocal_task_id:
            reciprocal_query = reciprocal_query.eq('id', payload.reciprocal_task_id)

        reciprocal_result = reciprocal_query.limit(1).execute()
        if not reciprocal_result.data:
            raise HTTPException(
                status_code=400,
                detail="Exact reciprocal skill task not found. Create one first (offer requested skill and request offered skill)."
            )

        reciprocal_task = reciprocal_result.data[0]

        db.table('skill_exchange_tasks').update({
            'status': 'matched',
            'matched_user_id': current_user_id,
            'reciprocal_task_id': reciprocal_task['id'],
            'updated_at': utc_now_iso()
        }).eq('id', target_task['id']).execute()

        db.table('skill_exchange_tasks').update({
            'status': 'matched',
            'matched_user_id': target_task['creator_id'],
            'reciprocal_task_id': target_task['id'],
            'updated_at': utc_now_iso()
        }).eq('id', reciprocal_task['id']).execute()

        exchange_session_request = {
            'sender_id': current_user_id,
            'receiver_id': target_task['creator_id'],
            'skill_offered': reciprocal_task['skill_offered'],
            'skill_wanted': reciprocal_task['skill_requested'],
            'message': f"Skill exchange matched: {reciprocal_task['skill_offered']} ↔ {target_task['skill_offered']}",
            'status': 'pending'
        }
        db.table('session_requests').insert(exchange_session_request).execute()

        db.table('notifications').insert({
            'user_id': target_task['creator_id'],
            'title': 'Skill Exchange Matched',
           'message': "Your exchange task has been matched with an exact skill swap.",
            'notification_type': 'skill_exchange',
            'reference_id': target_task['id'],
            'reference_type': 'skill_exchange_task'
        }).execute()


        updated_target = db.table('skill_exchange_tasks').select('*').eq('id', target_task['id']).limit(1).execute()
        updated_reciprocal = db.table('skill_exchange_tasks').select('*').eq('id', reciprocal_task['id']).limit(1).execute()


        return {
            "message": "Skill exchange matched successfully",
            "matched_task": target_task,
            "reciprocal_task": reciprocal_task
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting skill exchange task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{task_id}")
async def get_task(task_id: str):
    """Get task by ID"""
    try:
        db = get_db()
        
        task_result = db.table('tasks').select('*').eq('id', task_id).execute()
        
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        task = task_result.data[0]
        
        # Get creator details
        creator_result = db.table('users').select('id, username, full_name, profile_photo, average_rating').eq('id', task['creator_id']).execute()
        
        return {
            'task': task,
            'creator': creator_result.data[0] if creator_result.data else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{task_id}/accept")
async def accept_task(task_id: str, current_user_id: str = Depends(get_current_user)):
    """Accept a task"""
    try:
        db = get_db()
        
        # Get task
        task_result = db.table('tasks').select('*').eq('id', task_id).execute()
        
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        task = task_result.data[0]
        
        # Check if task is open
        if task['status'] != 'open':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task is not available"
            )
        
        # Check if user is not the creator
        if task['creator_id'] == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot accept your own task"
            )
        
        # Update task
        update_result = db.table('tasks').update({
            'acceptor_id': current_user_id,
            'status': 'accepted'
        }).eq('id', task_id).execute()
        
        # Create notification for creator
        notification = {
            'user_id': task['creator_id'],
            'title': 'Task Accepted',
            'message': f'Your task "{task["title"]}" has been accepted',
            'notification_type': 'task_update',
            'reference_id': task_id,
            'reference_type': 'task'
        }
        db.table('notifications').insert(notification).execute()
        
        return {
            "message": "Task accepted successfully",
            "task": update_result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{task_id}/submit")
async def submit_task(task_id: str, submission_data: TaskSubmissionCreate, current_user_id: str = Depends(get_current_user)):
    submission_text = submission_data.submission_text

    """Submit work for a task"""
    try:
        db = get_db()
        
        # Verify task is accepted by current user
        task_result = db.table('tasks').select('*').eq('id', task_id).eq('acceptor_id', current_user_id).execute()
        
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or not accepted by you"
            )
        
        task = task_result.data[0]
        
        if task['status'] not in ['accepted']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task cannot be submitted in current status"
            )
        
        # Create submission
        new_submission = {
            'task_id': task_id,
            'submitter_id': current_user_id,
            'submission_text': submission_text,
            'submission_files': submission_data.submission_files or []
        }
        
        submission_result = db.table('task_submissions').insert(new_submission).execute()
        if not submission_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create task submission"
            )

        plagiarism_result = plagiarism_detector.check_submission(
            submission_result.data[0]['id'],
            submission_text or ""
        )
        
        
        # Update task status
        db.table('tasks').update({'status': 'submitted'}).eq('id', task_id).execute()
        if plagiarism_result.get('flagged'):
            admins_result = db.table('users').select('id').eq('role', 'admin').execute()
            for admin in (admins_result.data or []):
                db.table('notifications').insert({
                    'user_id': admin['id'],
                    'title': 'Plagiarism Alert',
                    'message': f'Submission for task "{task["title"]}" flagged ({plagiarism_result.get("similarity_score", 0)}% similarity).',
                    'notification_type': 'plagiarism_alert',
                    'reference_id': submission_result.data[0]['id'],
                    'reference_type': 'task_submission'
                }).execute()
        
        # Create notification for creator
        notification = {
            'user_id': task['creator_id'],
            'title': 'Task Submitted',
            'message': f'Work has been submitted for your task "{task["title"]}"',
            'notification_type': 'task_update',
            'reference_id': task_id,
            'reference_type': 'task'
        }
        db.table('notifications').insert(notification).execute()
        
        return {
            "message": "Task submitted successfully",
            "submission": submission_result.data[0],
            "plagiarism_report": plagiarism_result
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{task_id}/approve")
async def approve_task_submission(
    task_id: str,
    payload: dict = Body(default={}),
    current_user_id: str = Depends(get_current_user)
):
    review_notes = payload.get('review_notes')
    """Approve task submission and release payment"""
    try:
        db = get_db()
        
        # Verify task is created by current user
        task_result = db.table('tasks').select('*').eq('id', task_id).eq('creator_id', current_user_id).execute()
        
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or you're not the creator"
            )
        
        task = task_result.data[0]
        
        if task['status'] != 'submitted':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task has not been submitted yet"
            )
        
        # Get submission
        submission_result = db.table('task_submissions').select('*').eq('task_id', task_id).execute()
        
        if not submission_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )
        
        # Update submission
        db.table('task_submissions').update({
            'is_approved': True,
            'review_notes': review_notes,
            'reviewed_at': utc_now_iso()
        }).eq('task_id', task_id).execute()
        
        # Update task status
        db.table('tasks').update({'status': 'completed'}).eq('id', task_id).execute()
        
        # Update acceptor's total_tasks_completed
        acceptor_result = db.table('users').select('total_tasks_completed').eq('id', task['acceptor_id']).limit(1).execute()
        total_completed = (acceptor_result.data[0].get('total_tasks_completed') or 0) + 1 if acceptor_result.data else 1
        db.table('users').update({'total_tasks_completed': total_completed}).eq('id', task['acceptor_id']).execute()

        payment_result = db.table('payments').select('*').eq('task_id', task_id).eq('status', 'completed').eq('is_escrowed', True).order('created_at', desc=True).limit(1).execute()
        if payment_result.data:
            db.table('payments').update({
                'status': 'released',
                'released_at': utc_now_iso()
            }).eq('id', payment_result.data[0]['id']).execute()
        
        # Create notification for acceptor
        notification = {
            'user_id': task['acceptor_id'],
            'title': 'Task Approved',
            'message': f'Your submission for "{task["title"]}" has been approved!',
            'notification_type': 'task_update',
            'reference_id': task_id,
            'reference_type': 'task'
        }
        db.table('notifications').insert(notification).execute()
        
        return {
            "message": "Task approved and payment released",
            "task_id": task_id,
            "review_notes": review_notes
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{task_id}")
async def delete_task(task_id: str, current_user_id: str = Depends(get_current_user)):
    """Delete a task (only if status is open)"""
    try:
        db = get_db()
        
        # Verify task
        task_result = db.table('tasks').select('*').eq('id', task_id).eq('creator_id', current_user_id).execute()
        
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or you're not the creator"
            )
        
        task = task_result.data[0]
        
        if task['status'] != 'open':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete task that has been accepted"
            )
        
        # Delete task
        db.table('tasks').delete().eq('id', task_id).execute()
        
        return {"message": "Task deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )