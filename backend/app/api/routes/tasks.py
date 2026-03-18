from fastapi import APIRouter, HTTPException, status, Depends, Body
from app.models.schemas import (
    TaskCreate,
    TaskResponse,
    TaskUpdate,
    TaskSubmissionCreate,
    TaskSubmissionResponse,
    SkillExchangeTaskCreate,
    SkillExchangeTaskAccept,
    TaskAcceptRequest,
    TaskAssignRequest,
    TaskAcceptorResponse,
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
        # Debug logging
        logger.info(f"Received task creation request: {task_data.model_dump()}")
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
    If acceptor doesn't have reciprocal task, one is auto-created.
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

        # Check for existing reciprocal task
        reciprocal_query = db.table('skill_exchange_tasks').select('*').eq('creator_id', current_user_id).eq('status', 'open').eq('skill_offered', target_task['skill_requested']).eq('skill_requested', target_task['skill_offered'])
        if payload.reciprocal_task_id:
            reciprocal_query = reciprocal_query.eq('id', payload.reciprocal_task_id)

        reciprocal_result = reciprocal_query.limit(1).execute()
        
        # If no reciprocal task exists, create one automatically
        if not reciprocal_result.data:
            logger.info(f"Auto-creating reciprocal task for user {current_user_id}")
            new_reciprocal = {
                'creator_id': current_user_id,
                'skill_offered': target_task['skill_requested'],
                'skill_requested': target_task['skill_offered'],
                'description': f"Auto-created for exchange match with {target_task.get('skill_offered')} ↔ {target_task.get('skill_requested')}",
                'status': 'open'
            }
            reciprocal_create_result = db.table('skill_exchange_tasks').insert(new_reciprocal).execute()
            if not reciprocal_create_result.data:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to create reciprocal exchange task"
                )
            reciprocal_task = reciprocal_create_result.data[0]
        else:
            reciprocal_task = reciprocal_result.data[0]

        # Update both tasks to matched status
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

        # Create session request for coordination
        exchange_session_request = {
            'sender_id': current_user_id,
            'receiver_id': target_task['creator_id'],
            'skill_offered': reciprocal_task['skill_offered'],
            'skill_wanted': reciprocal_task['skill_requested'],
            'message': f"Skill exchange matched! Ready to exchange {reciprocal_task['skill_offered']} ↔ {target_task['skill_offered']}",
            'status': 'pending'
        }
        db.table('session_requests').insert(exchange_session_request).execute()

        # Notify the original creator
        db.table('notifications').insert({
            'user_id': target_task['creator_id'],
            'title': 'Skill Exchange Matched! 🎉',
            'message': f"Your skill exchange has been matched! Someone wants to learn {target_task['skill_offered']} and can teach you {target_task['skill_requested']}",
            'notification_type': 'skill_exchange',
            'reference_id': target_task['id'],
            'reference_type': 'skill_exchange_task'
        }).execute()

        # Notify the acceptor
        db.table('notifications').insert({
            'user_id': current_user_id,
            'title': 'Exchange Accepted!',
            'message': f"You've successfully matched for skill exchange: {reciprocal_task['skill_offered']} ↔ {target_task['skill_offered']}",
            'notification_type': 'skill_exchange',
            'reference_id': reciprocal_task['id'],
            'reference_type': 'skill_exchange_task'
        }).execute()

        return {
            "message": "Skill exchange matched successfully! Session request has been created.",
            "matched_task": target_task,
            "reciprocal_task": reciprocal_task,
            "auto_created": not reciprocal_result.data
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
async def accept_task(
    task_id: str, 
    accept_data: TaskAcceptRequest,
    current_user_id: str = Depends(get_current_user)
):
    """Accept a task - adds user to acceptors list"""
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
        
        # Check if user already accepted this task
        existing_acceptance = db.table('task_acceptors').select('*').eq('task_id', task_id).eq('user_id', current_user_id).execute()
        
        if existing_acceptance.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already accepted this task"
            )
        
        # Add user to task acceptors
        acceptor_data = {
            'task_id': task_id,
            'user_id': current_user_id,
            'status': 'pending',
            'message': accept_data.message
        }
        
        acceptance_result = db.table('task_acceptors').insert(acceptor_data).execute()
        
        # Create notification for creator
        notification = {
            'user_id': task['creator_id'],
            'title': 'New Task Application',
            'message': f'Someone has applied to work on your task "{task["title"]}"',
            'notification_type': 'task_accepted',
            'reference_id': task_id,
            'reference_type': 'task'
        }
        db.table('notifications').insert(notification).execute()
        
        return {
            "message": "Task accepted successfully. Waiting for creator to assign.",
            "acceptance": acceptance_result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    



@router.get("/{task_id}/acceptors")
async def get_task_acceptors(task_id: str, current_user_id: str = Depends(get_current_user)):
    """Get list of users who accepted a task - only for task creator"""
    try:
        db = get_db()
        
        # Verify user is the task creator
        task_result = db.table('tasks').select('*').eq('id', task_id).eq('creator_id', current_user_id).execute()
        
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or you're not the creator"
            )
        
        # Get acceptors
        acceptors_result = db.table('task_acceptors').select('*').eq('task_id', task_id).order('accepted_at', desc=False).execute()
        
        if not acceptors_result.data:
            return []
        
        # Get user details for acceptors
        user_ids = [acceptor['user_id'] for acceptor in acceptors_result.data]
        users_result = db.table('users').select('id, username, full_name, profile_photo, average_rating, total_tasks_completed').in_('id', user_ids).execute()
        
        users_dict = {user['id']: user for user in users_result.data}
        
        # Combine acceptor data with user details
        acceptors_with_details = []
        for acceptor in acceptors_result.data:
            user_data = users_dict.get(acceptor['user_id'])
            if user_data:
                acceptors_with_details.append({
                    **acceptor,
                    'user': user_data
                })
        
        return acceptors_with_details
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task acceptors: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{task_id}/assign")
async def assign_task(
    task_id: str, 
    assign_data: TaskAssignRequest,
    current_user_id: str = Depends(get_current_user)
):
    """Assign task to a specific user from acceptors list"""
    try:
        db = get_db()
        
        # Verify user is the task creator
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
                detail="Task is not open for assignment"
            )
        
        # Verify the user is in acceptors list
        acceptor_result = db.table('task_acceptors').select('*').eq('task_id', task_id).eq('user_id', str(assign_data.user_id)).execute()
        
        if not acceptor_result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User has not accepted this task"
            )
        
        # Update task status and assigned user
        db.table('tasks').update({
            'status': 'accepted',
            'assigned_user_id': str(assign_data.user_id),
            'acceptor_id': str(assign_data.user_id)  # Keep for backward compatibility
        }).eq('id', task_id).execute()
        
        # Update acceptor status to assigned
        db.table('task_acceptors').update({
            'status': 'assigned'
        }).eq('task_id', task_id).eq('user_id', str(assign_data.user_id)).execute()
        
        # Update other acceptors to rejected
        db.table('task_acceptors').update({
            'status': 'rejected'
        }).eq('task_id', task_id).neq('user_id', str(assign_data.user_id)).execute()
        
        # Create notification for assigned user
        db.table('notifications').insert({
            'user_id': str(assign_data.user_id),
            'title': 'Task Assigned to You!',
            'message': f'You have been assigned to work on the task "{task["title"]}"',
            'notification_type': 'task_assigned',
            'reference_id': task_id,
            'reference_type': 'task'
        }).execute()
        
        # Notify rejected users
        rejected_acceptors = db.table('task_acceptors').select('user_id').eq('task_id', task_id).eq('status', 'rejected').execute()
        
        for acceptor in rejected_acceptors.data:
            db.table('notifications').insert({
                'user_id': acceptor['user_id'],
                'title': 'Task Assignment Update',
                'message': f'The task "{task["title"]}" has been assigned to another user',
                'notification_type': 'task_update',
                'reference_id': task_id,
                'reference_type': 'task'
            }).execute()
        
        return {
            "message": "Task assigned successfully",
            "task_id": task_id,
            "assigned_user_id": str(assign_data.user_id)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning task: {str(e)}")
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