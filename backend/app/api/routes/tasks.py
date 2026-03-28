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
    TaskCancelRequest,
    TaskCancelResponse,
)
from app.utils.auth import get_current_user
from app.database import get_db
from app.services.plagiarism_service import plagiarism_detector
from app.services.activity_service import activity_service
from app.services.payment_service import payment_service
from typing import List
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tasks", tags=["Tasks"])

# Predefined cancel reasons
CANCEL_REASONS = [
    "work_not_as_described",
    "incomplete_work",
    "fake_submission",
    "delay_beyond_deadline",
    "poor_quality",
    "other"
]


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_task(task_data: TaskCreate, current_user_id: str = Depends(get_current_user)):
    """Create a new task (requires upfront payment to be visible)"""
    try:
        # Debug logging
        logger.info(f"Received task creation request: {task_data.model_dump()}")
        db = get_db()
        
            # Create task (use only safe core fields; add optional fields conditionally)
        # Task starts as invisible until payment is made
        new_task = {
            'creator_id': current_user_id,
            'title': task_data.title,
            'description': task_data.description,
            'price': float(task_data.price),
            'currency': 'INR',
            'deadline': task_data.deadline.isoformat(),
            'status': 'pending_payment',  # Changed from 'open'
            'payment_status': 'unpaid',
            'is_visible': False  # Hidden until payment
        }
        if task_data.subject:
            new_task['subject'] = task_data.subject
        if task_data.difficulty_level:
            new_task['difficulty_level'] = task_data.difficulty_level
        if task_data.attachment_urls or task_data.attachments:
            new_task['attachment_urls'] = task_data.attachment_urls or task_data.attachments or []
        #   Remove requirements and estimated_hours as they don't exist in the database schema
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
        
        created_task = result.data[0]
        
        # Log activity
        activity_service.log_task_created(
            user_id=current_user_id,
            task_id=created_task['id'],
            task_title=created_task['title']
        )
        
        
        return {
            "message": "Task created successfully",
             "task": created_task
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
    """Get all tasks with optional status filter - only visible tasks"""
    try:
        db = get_db()
        
        # Get tasks excluding current user's tasks and only visible ones
        query = db.table('tasks').select('*').neq('creator_id', current_user_id).eq('is_visible', True)
        
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

         # Log activity
        activity_service.log_task_accepted(
            user_id=current_user_id,
            task_id=task_id,
            task_title=task['title']
        )
        
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
            'acceptor_id': str(assign_data.user_id),  # Keep for backward compatibility
            'payment_status': 'unpaid'
        }).eq('id', task_id).execute()
        
        # Update acceptor status to assigned
        db.table('task_acceptors').update({
            'status': 'assigned'
        }).eq('task_id', task_id).eq('user_id', str(assign_data.user_id)).execute()
        
        # Update other acceptors to rejected
        db.table('task_acceptors').update({
            'status': 'rejected'
        }).eq('task_id', task_id).neq('user_id', str(assign_data.user_id)).execute()


          # Log activity for both users
        activity_service.log_task_assigned(
            acceptor_id=str(assign_data.user_id),
            creator_id=current_user_id,
            task_id=task_id,
            task_title=task['title']
        )
        
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
    

@router.get("/{task_id}/submissions")
async def get_task_submissions(task_id: str, current_user_id: str = Depends(get_current_user)):
    """Get all submissions for a task - only for task creator"""
    try:
        db = get_db()
        
        # Verify user is the task creator
        task_result = db.table('tasks').select('*').eq('id', task_id).execute()
        
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        task = task_result.data[0]
        
        # Allow creator and acceptor to view submissions
        if task['creator_id'] != current_user_id and task.get('acceptor_id') != current_user_id and task.get('assigned_user_id') != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view submissions for this task"
            )
        
        # Get submissions
        submissions_result = db.table('task_submissions').select('*').eq('task_id', task_id).order('submitted_at', desc=True).execute()
        
        if not submissions_result.data:
            return []
        
        # Get submitter details
        submitter_ids = list(set([sub['submitter_id'] for sub in submissions_result.data]))
        users_result = db.table('users').select('id, username, full_name, profile_photo').in_('id', submitter_ids).execute()
        users_dict = {user['id']: user for user in (users_result.data or [])}
        
        # Combine submission data with user details
        submissions_with_users = []
        for submission in submissions_result.data:
            submitter = users_dict.get(submission['submitter_id'])
            submissions_with_users.append({
                **submission,
                'submitter': submitter
            })
        
        return submissions_with_users
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task submissions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
@router.post("/{task_id}/submit")
async def submit_task(task_id: str, submission_data: TaskSubmissionCreate, current_user_id: str = Depends(get_current_user)):
    """Submit work for a task"""
    submission_text = submission_data.submission_text
    
    try:
        db = get_db()
        
        # Verify task is accepted by current user
        task_result = db.table('tasks').select('*').eq('id', task_id).execute()
        
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        task = task_result.data[0]
        
        # Check if current user is the acceptor
        if task.get('acceptor_id') != current_user_id and task.get('assigned_user_id') != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this task"
            )
        
        # Allow submission if task is 'accepted' or 'in_progress'
        if task['status'] not in ['accepted', 'in_progress']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Task cannot be submitted in current status: {task['status']}. Only 'accepted' or 'in_progress' tasks can be submitted."
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
        db.table('tasks').update({'status': 'submitted', 'payment_status': 'payment_pending'}).eq('id', task_id).execute()

            # Log activity for both users
        activity_service.log_task_submitted(
            acceptor_id=current_user_id,
            creator_id=task['creator_id'],
            task_id=task_id,
            task_title=task['title']
        )
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



@router.get("/{task_id}/approval-status")
async def get_task_approval_status(
    task_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Check if task is ready for approval and get approval status"""
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
        
        # Check if user is creator or acceptor
        is_creator = task['creator_id'] == current_user_id
        is_acceptor = task.get('acceptor_id') == current_user_id or task.get('assigned_user_id') == current_user_id
        
        if not (is_creator or is_acceptor):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this task's approval status"
            )
        
        # Get submission
        submission_result = db.table('task_submissions').select('*').eq('task_id', task_id).execute()
        has_submission = bool(submission_result.data)
        
        # Determine approval status
        can_approve = (
            is_creator and 
            task['status'] == 'submitted' and 
            has_submission
        )
        
        status_message = ""
        if task['status'] == 'completed':
            status_message = "Task is already approved and completed"
        elif task['status'] == 'submitted':
            if is_creator:
                status_message = "Task is ready for your approval" if can_approve else "Waiting for submission"
            else:
                status_message = "Waiting for creator to review and approve"
        elif task['status'] == 'accepted':
            status_message = "Task is in progress, not yet submitted"
        elif task['status'] == 'open':
            status_message = "Task is open, not yet accepted"
        
        return {
            "task_id": task_id,
            "status": task['status'],
            "payment_status": task.get('payment_status', 'unknown'),
            "can_approve": can_approve,
            "is_creator": is_creator,
            "is_acceptor": is_acceptor,
            "has_submission": has_submission,
            "message": status_message,
            "submission_count": len(submission_result.data) if submission_result.data else 0
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking approval status: {str(e)}")
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
    """Approve task submission, release payment, and update wallet transactions"""
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

        # Check task status
        if task['status'] == 'completed':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Task is already completed and approved. Payment status: {task.get('payment_status', 'unknown')}"
            )
        
        if task['status'] != 'submitted':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Task cannot be approved. Current status: {task['status']}. Task must be in 'submitted' status to approve."
            )
        
        if not task.get('acceptor_id'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task has no acceptor assigned"
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
        db.table('tasks').update({'status': 'completed', 'payment_status': 'paid'}).eq('id', task_id).execute()
        
        # Update acceptor's total_tasks_completed
        acceptor_result = db.table('users').select('total_tasks_completed').eq('id', task['acceptor_id']).limit(1).execute()
        total_completed = (acceptor_result.data[0].get('total_tasks_completed') or 0) + 1 if acceptor_result.data else 1
        db.table('users').update({'total_tasks_completed': total_completed}).eq('id', task['acceptor_id']).execute()

        # Handle payment and wallet transactions
        payment_result = db.table('payments').select('*').eq('task_id', task_id).eq('status', 'completed').eq('is_escrowed', True).order('created_at', desc=True).limit(1).execute()
        if payment_result.data:
            payment = payment_result.data[0]
            
            # Release payment
            db.table('payments').update({
                'status': 'released',
                'released_at': utc_now_iso()
            }).eq('id', payment['id']).execute()
            
            # ATOMIC WALLET TRANSFER: Creator → Acceptor
            try:
                from app.services.wallet_service import wallet_service
                
                transfer_result = wallet_service.atomic_transfer(
                    from_user_id=current_user_id,
                    to_user_id=task['acceptor_id'],
                    amount=float(task['price']),
                    reason=f'Task payment: {task["title"]}',
                    reference_id=task_id,
                    reference_type='task'
                )
                
                logger.info(f"Wallet transfer successful: ₹{task['price']} from {current_user_id} to {task['acceptor_id']}")
                   # Log activity for both users
                activity_service.log_task_completed(
                    acceptor_id=task['acceptor_id'],
                    creator_id=current_user_id,
                    task_id=task_id,
                    task_title=task['title'],
                    amount=float(task['price'])
                )
                
                
            except Exception as wallet_error:
                logger.error(f"Wallet transfer failed: {str(wallet_error)}")
                # Don't fail the approval, just log the error
                # In production, you'd want to handle this more carefully
        else:
            logger.warning(f"No completed payment found for task {task_id}, skipping wallet transfer")
        
        # Create notification for acceptor
        notification = {
            'user_id': task['acceptor_id'],
            'title': 'Task Approved & Payment Released!',
            'message': f'Your submission for "{task["title"]}" has been approved! ₹{task["price"]} has been credited.',
            'notification_type': 'task_update',
            'reference_id': task_id,
            'reference_type': 'task'
        }
        db.table('notifications').insert(notification).execute()
        
        return {
            "message": "Task approved, payment released, and wallet updated",
            "task_id": task_id,
            "amount_paid": task['price'],
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
@router.post("/{task_id}/cancel", response_model=TaskCancelResponse)
async def cancel_task(
    task_id: str,
    cancel_data: TaskCancelRequest,
    current_user_id: str = Depends(get_current_user)
):
    """
    Cancel a task with MANDATORY reason.
    If no reason provided → Auto-block user account
    If valid reason → Refund payment to task owner
    """
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
        
        # Only task creator can cancel
        if task['creator_id'] != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only task creator can cancel the task"
            )
        
        # Cannot cancel completed tasks
        if task['status'] == 'completed':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel completed task"
            )
        
        # Validate cancel reason
        cancel_reason = cancel_data.cancel_reason.strip()
        
        # CRITICAL: If no reason or empty reason → AUTO-BLOCK USER
        if not cancel_reason or cancel_reason == "":
            logger.warning(f"[AUTO-BLOCK] User {current_user_id} tried to cancel task without reason. Blocking account.")
            
            # Block the user immediately
            db.table('users').update({
                'is_banned': True,
                'is_active': False,
                'ban_reason': 'Attempted to cancel task without providing a valid reason (violation of task cancellation policy)',
                'banned_at': utc_now_iso()
            }).eq('id', current_user_id).execute()
            
            # Notify the user
            db.table('notifications').insert({
                'user_id': current_user_id,
                'title': '🚫 Account Blocked',
                'message': 'Your account has been blocked for attempting to cancel a task without providing a valid reason. This is a violation of our platform policies. Please contact admin for review.',
                'notification_type': 'system'
            }).execute()
            
            # Notify all admins
            admins_result = db.table('users').select('id').eq('role', 'admin').execute()
            if admins_result.data:
                for admin in admins_result.data:
                    db.table('notifications').insert({
                        'user_id': admin['id'],
                        'title': '⚠️ Auto-Block: No Cancel Reason',
                        'message': f'User account {current_user_id} has been auto-blocked for cancelling task without reason.',
                        'notification_type': 'admin_alert'
                    }).execute()
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been blocked for attempting to cancel without providing a reason. Please contact admin."
            )
        
        # Validate against predefined reasons
        if cancel_reason not in CANCEL_REASONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid cancel reason. Must be one of: {', '.join(CANCEL_REASONS)}"
            )
        
        # If "other" reason, require details
        if cancel_reason == "other" and not cancel_data.cancel_details:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide details for 'other' cancellation reason"
            )
        
        # Update task to cancelled
        db.table('tasks').update({
            'status': 'cancelled',
            'cancel_reason': cancel_reason,
            'cancel_details': cancel_data.cancel_details,
            'cancelled_at': utc_now_iso(),
            'cancelled_by': current_user_id
        }).eq('id', task_id).execute()
        
        # Process refund if payment exists
        refund_initiated = False
        refund_amount = None
        
        payment_result = db.table('payments').select('*').eq('task_id', task_id).eq('status', 'completed').eq('is_escrowed', True).order('created_at', desc=True).limit(1).execute()
        
        if payment_result.data:
            payment = payment_result.data[0]
            refund_amount = float(payment['amount'])
            
            # Refund from escrow
            refund_success = await payment_service.refund_from_escrow(
                payment_id=payment['id'],
                razorpay_payment_id=payment.get('razorpay_payment_id'),
                amount=refund_amount,
                reason=f"Task cancelled: {cancel_reason}"
            )
            
            if refund_success:
                refund_initiated = True
                logger.info(f"[ESCROW REFUND] Task {task_id} cancelled. Refund of ₹{refund_amount} initiated.")
        
        # Notify task acceptor (if exists)
        if task.get('acceptor_id'):
            db.table('notifications').insert({
                'user_id': task['acceptor_id'],
                'title': 'Task Cancelled by Owner',
                'message': f'The task "{task["title"]}" has been cancelled. Reason: {cancel_reason}',
                'notification_type': 'task_update',
                'reference_id': task_id,
                'reference_type': 'task'
            }).execute()
        
        # Notify creator
        db.table('notifications').insert({
            'user_id': current_user_id,
            'title': 'Task Cancelled Successfully',
            'message': f'Your task "{task["title"]}" has been cancelled. {"Refund initiated." if refund_initiated else ""}',
            'notification_type': 'task_update',
            'reference_id': task_id,
            'reference_type': 'task'
        }).execute()
        
        return TaskCancelResponse(
            message="Task cancelled successfully" + (" and refund initiated" if refund_initiated else ""),
            refund_initiated=refund_initiated,
            refund_amount=refund_amount,
            task_id=task_id
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{task_id}")
async def delete_task(task_id: str, current_user_id: str = Depends(get_current_user)):
    """Delete a task (only if status is open and not paid)"""
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
        
        if task['status'] != 'open' and task['status'] != 'pending_payment':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete task that has been accepted. Use cancel instead."
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