from fastapi import APIRouter, HTTPException, Depends
from app.config import settings
from app.utils.auth import get_current_user
from app.database import get_db
import logging


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/storage", tags=["Storage"])

@router.get("/config")
async def get_storage_config():
    """
    Get Supabase storage configuration for frontend
    Returns the public URL and anon key for client-side uploads
    """
    try:
        return {
            "url": settings.SUPABASE_URL,
            "key": settings.SUPABASE_ANON_KEY,
            "bucket": "task-attachments"
        }
    except Exception as e:
        logger.error(f"Error fetching storage config: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch storage configuration"
        )


@router.get("/file/{task_id}/{filename}")
async def get_file_url(
    task_id: str,
    filename: str,
    current_user_id: str = Depends(get_current_user)
):
    """
    Get signed URL for file access
    Only task creator, acceptor, or assigned user can access
    """
    try:
        db = get_db()
        
        # Verify user has access to this task
        task_result = db.table('tasks').select('creator_id, acceptor_id, assigned_user_id').eq('id', task_id).execute()
        
        if not task_result.data:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task = task_result.data[0]
        
        # Check if user is authorized
        authorized_users = [task['creator_id'], task.get('acceptor_id'), task.get('assigned_user_id')]
        
        if current_user_id not in authorized_users:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to access this file"
            )
        
        # Generate signed URL (60 minute expiry)
        from supabase import create_client
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        
        file_path = f"{task_id}/{filename}"
        signed_url = supabase.storage.from_('task-attachments').create_signed_url(file_path, 3600)
        
        return {
            "signed_url": signed_url['signedURL'] if signed_url else None,
            "expires_in": 3600
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating signed URL: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate file access URL"
        )

@router.post("/verify-access/{task_id}")
async def verify_file_access(
    task_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """
    Verify if user has access to task files
    """
    try:
        db = get_db()
        
        task_result = db.table('tasks').select('creator_id, acceptor_id, assigned_user_id').eq('id', task_id).execute()
        
        if not task_result.data:
            return {"has_access": False, "reason": "Task not found"}
        
        task = task_result.data[0]
        authorized_users = [task['creator_id'], task.get('acceptor_id'), task.get('assigned_user_id')]
        
        if current_user_id in authorized_users:
            return {
                "has_access": True,
                "role": "creator" if current_user_id == task['creator_id'] else "worker"
            }
        else:
            return {"has_access": False, "reason": "Not authorized for this task"}
        
    except Exception as e:
        logger.error(f"Error verifying access: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to verify access"
        )