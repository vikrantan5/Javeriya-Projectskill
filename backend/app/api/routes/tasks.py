from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import TaskCreate, TaskResponse, TaskUpdate, TaskSubmissionCreate, TaskSubmissionResponse
from app.utils.auth import get_current_user
from app.database import get_db
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_task(task_data: TaskCreate, current_user_id: str = Depends(get_current_user)):
    """Create a new task"""
    try:
        db = get_db()
        
        # Create task
        new_task = {
            'creator_id': current_user_id,
            'title': task_data.title,
            'description': task_data.description,
            'subject': task_data.subject,
            'difficulty_level': task_data.difficulty_level,
            'price': float(task_data.price),
            'currency': 'INR',
            'deadline': task_data.deadline.isoformat(),
            'attachment_urls': task_data.attachment_urls or task_data.attachments or [],
            'requirements': task_data.requirements,
            'estimated_hours': task_data.estimated_hours,
            'status': 'open'
        }
        
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
            'submission_text': submission_data.submission_text,
            'submission_files': submission_data.submission_files or []
        }
        
        submission_result = db.table('task_submissions').insert(new_submission).execute()
        
        # Update task status
        db.table('tasks').update({'status': 'submitted'}).eq('id', task_id).execute()
        
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
            "submission": submission_result.data[0]
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
async def approve_task_submission(task_id: str, review_notes: str = None, current_user_id: str = Depends(get_current_user)):
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
            'reviewed_at': 'now()'
        }).eq('task_id', task_id).execute()
        
        # Update task status
        db.table('tasks').update({'status': 'completed'}).eq('id', task_id).execute()
        
        # Update acceptor's total_tasks_completed
        db.table('users').update({
            'total_tasks_completed': task['acceptor_id']
        }).eq('id', task['acceptor_id']).execute()
        
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
            "task_id": task_id
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