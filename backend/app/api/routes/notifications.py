from fastapi import APIRouter, HTTPException, status, Depends
from app.utils.auth import get_current_user
from app.database import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/")
async def get_notifications(current_user_id: str = Depends(get_current_user)):
    """Get all notifications for current user"""
    try:
        db = get_db()
        
        notifications_result = db.table('notifications').select('*').eq('user_id', current_user_id).order('created_at', desc=True).limit(50).execute()
        
        return notifications_result.data if notifications_result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/unread")
async def get_unread_notifications(current_user_id: str = Depends(get_current_user)):
    """Get unread notifications for current user"""
    try:
        db = get_db()
        
        notifications_result = db.table('notifications').select('*').eq('user_id', current_user_id).eq('is_read', False).order('created_at', desc=True).execute()
        
        return notifications_result.data if notifications_result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching unread notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/count")
async def get_unread_count(current_user_id: str = Depends(get_current_user)):
    """Get count of unread notifications"""
    try:
        db = get_db()
        
        notifications_result = db.table('notifications').select('id').eq('user_id', current_user_id).eq('is_read', False).execute()
        
        count = len(notifications_result.data) if notifications_result.data else 0
        
        return {"unread_count": count}
    
    except Exception as e:
        logger.error(f"Error fetching notification count: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user_id: str = Depends(get_current_user)):
    """Mark notification as read"""
    try:
        db = get_db()
        
        # Verify notification belongs to user
        notification_result = db.table('notifications').select('id').eq('id', notification_id).eq('user_id', current_user_id).execute()
        
        if not notification_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        # Mark as read
        db.table('notifications').update({
            'is_read': True,
            'read_at': 'now()'
        }).eq('id', notification_id).execute()
        
        return {"message": "Notification marked as read"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/mark-all-read")
async def mark_all_notifications_read(current_user_id: str = Depends(get_current_user)):
    """Mark all notifications as read for current user"""
    try:
        db = get_db()
        
        db.table('notifications').update({
            'is_read': True,
            'read_at': 'now()'
        }).eq('user_id', current_user_id).eq('is_read', False).execute()
        
        return {"message": "All notifications marked as read"}
    
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, current_user_id: str = Depends(get_current_user)):
    """Delete a notification"""
    try:
        db = get_db()
        
        # Verify notification belongs to user
        notification_result = db.table('notifications').select('id').eq('id', notification_id).eq('user_id', current_user_id).execute()
        
        if not notification_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        # Delete notification
        db.table('notifications').delete().eq('id', notification_id).execute()
        
        return {"message": "Notification deleted"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )