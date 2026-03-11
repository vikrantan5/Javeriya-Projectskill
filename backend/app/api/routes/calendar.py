from fastapi import APIRouter, HTTPException, Depends
from app.utils.auth import get_current_user
from app.services.calendar_service import calendar_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/calendar", tags=["Calendar"])

@router.get("/my-events")
async def get_my_calendar_events(
    upcoming_only: bool = True,
    limit: int = 20,
    current_user_id: str = Depends(get_current_user)
):
    """Get calendar events for the current user"""
    try:
        events = calendar_service.get_user_events(
            user_id=current_user_id,
            upcoming_only=upcoming_only,
            limit=limit
        )
        
        return {
            "total": len(events),
            "events": events
        }
        
    except Exception as e:
        logger.error(f"Error getting calendar events: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/session/{session_id}/create-event")
async def create_event_for_session(
    session_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Create calendar events for a learning session"""
    try:
        result = calendar_service.create_event_for_session(session_id)
        
        if not result.get('success'):
            raise HTTPException(
                status_code=400, 
                detail=result.get('error', 'Failed to create calendar event')
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating calendar event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/event/{event_id}")
async def delete_calendar_event(
    event_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Delete a calendar event"""
    try:
        success = calendar_service.delete_event(event_id, current_user_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Event not found or unauthorized"
            )
        
        return {"message": "Event deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting calendar event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
