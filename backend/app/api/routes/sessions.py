from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import (
    SessionRequestCreate,
    SessionRequestResponse,
    SessionCreate,
    SessionResponse,
    SessionUpdate,
    MeetingLinkGenerateRequest,
)
from app.utils.auth import get_current_user
from app.database import get_db
from typing import List
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sessions", tags=["Sessions"])

from pydantic import BaseModel
from datetime import datetime

class SkillExchangeSessionCreate(BaseModel):
    exchange_task_id: str
    meeting_date: str
    meeting_topic: str
    meeting_duration_minutes: int = 60

@router.post("/skill-exchange-session", response_model=dict)
async def create_skill_exchange_session(
    session_data: SkillExchangeSessionCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Create a skill exchange session with Google Meet scheduling"""
    try:
        db = get_db()
        
        # Get the exchange task
        task_result = db.table('skill_exchange_tasks').select('*').eq('id', session_data.exchange_task_id).execute()
        if not task_result.data:
            raise HTTPException(status_code=404, detail="Skill exchange task not found")
        
        task = task_result.data[0]
        
        # Verify user is part of this exchange
        if task['creator_id'] != current_user_id and task.get('matched_user_id') != current_user_id:
            raise HTTPException(status_code=403, detail="You are not part of this skill exchange")
        
        # Determine participants
        participant1_id = task['creator_id']
        participant2_id = task.get('matched_user_id')
        
        if not participant2_id:
            raise HTTPException(status_code=400, detail="Exchange not matched yet")
        
        # Generate Google Meet link
        meeting_link = "https://meet.google.com/new"
        
        # Create session record
        new_session = {
            'exchange_task_id': session_data.exchange_task_id,
            'participant1_id': participant1_id,
            'participant2_id': participant2_id,
            'meeting_date': session_data.meeting_date,
            'meeting_duration_minutes': session_data.meeting_duration_minutes,
            'meeting_topic': session_data.meeting_topic,
            'meeting_link': meeting_link,
            'status': 'scheduled',
            'created_by': current_user_id
        }
        
        result = db.table('skill_exchange_sessions').insert(new_session).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create session")
        
        # Notify both participants
        other_user_id = participant2_id if current_user_id == participant1_id else participant1_id
        
        db.table('notifications').insert({
            'user_id': other_user_id,
            'title': 'Skill Exchange Session Scheduled! 📅',
            'message': f'Meeting scheduled for {session_data.meeting_topic} on {session_data.meeting_date}',
            'notification_type': 'session_scheduled',
            'reference_id': result.data[0]['id'],
            'reference_type': 'skill_exchange_session'
        }).execute()
        
        return {
            "message": "Session scheduled successfully",
            "session": result.data[0],
            "meeting_link": meeting_link
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating skill exchange session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/skill-exchange-sessions", response_model=List[dict])
async def get_skill_exchange_sessions(current_user_id: str = Depends(get_current_user)):
    """Get all skill exchange sessions for current user"""
    try:
        db = get_db()
        
        # Get sessions where user is participant
        result = db.table('skill_exchange_sessions').select('*').or_(
            f'participant1_id.eq.{current_user_id},participant2_id.eq.{current_user_id}'
        ).order('meeting_date', desc=False).execute()
        
        if not result.data:
            return []
        
        # Get user details and task details
        sessions_with_details = []
        for session in result.data:
            # Get task details
            task_result = db.table('skill_exchange_tasks').select('*').eq('id', session['exchange_task_id']).execute()
            task = task_result.data[0] if task_result.data else None
            
            # Get other participant details
            other_user_id = session['participant2_id'] if session['participant1_id'] == current_user_id else session['participant1_id']
            user_result = db.table('users').select('id, username, full_name, profile_photo').eq('id', other_user_id).execute()
            other_user = user_result.data[0] if user_result.data else None
            
            sessions_with_details.append({
                'session': session,
                'task': task,
                'other_participant': other_user
            })
        
        return sessions_with_details
        
    except Exception as e:
        logger.error(f"Error fetching skill exchange sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/meeting-providers")
async def get_meeting_providers(current_user_id: str = Depends(get_current_user)):
    return {
        "providers": [
            {"id": "google_meet", "label": "Google Meet"},
            {"id": "zoom", "label": "Zoom"},
            {"id": "webrtc", "label": "WebRTC Room"}
        ]
    }


@router.post("/generate-meeting-link")
async def generate_meeting_link(payload: MeetingLinkGenerateRequest, current_user_id: str = Depends(get_current_user)):
    """Generate meeting links with provider choice at booking time."""
    meeting_id = str(uuid.uuid4())[:10]
    topic = (payload.session_topic or "TalentConnect Session").replace(" ", "-")
    provider = payload.provider or payload.platform or "google_meet"

    if provider == "google_meet":
         link = "https://meet.google.com/new"
    elif provider == "zoom":
        link = f"https://zoom.us/j/{meeting_id}?pwd=talentconnect"
    elif provider == "webrtc":
        link = f"https://webrtc.talentconnect.local/room/{meeting_id}-{topic}"
    else:
        raise HTTPException(status_code=400, detail="Unsupported meeting provider")

    return {
        "provider": provider,
        "meeting_link": link
    }

@router.post("/request", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_session_request(request_data: SessionRequestCreate, current_user_id: str = Depends(get_current_user)):
    """Create a session request to another user"""
    try:
        db = get_db()
        
        # Check if receiver exists
        receiver_result = db.table('users').select('id').eq('id', str(request_data.receiver_id)).execute()
        
        if not receiver_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Receiver user not found"
            )
        
        # Create session request
        new_request = {
            'sender_id': current_user_id,
            'receiver_id': str(request_data.receiver_id),
            'skill_offered': request_data.skill_offered,
            'skill_wanted': request_data.skill_wanted,
            'message': request_data.message,
            'status': 'pending'
        }
        
        result = db.table('session_requests').insert(new_request).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create session request"
            )
        
        # Create notification for receiver
        notification = {
            'user_id': str(request_data.receiver_id),
            'title': 'New Session Request',
            'message': f'You have received a session request for {request_data.skill_wanted}',
            'notification_type': 'session_request',
            'reference_id': result.data[0]['id'],
            'reference_type': 'session_request'
        }
        db.table('notifications').insert(notification).execute()
        
        return {
            "message": "Session request sent successfully",
            "request": result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating session request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/requests/received", response_model=List[dict])
async def get_received_requests(current_user_id: str = Depends(get_current_user)):
    """Get session requests received by current user"""
    try:
        db = get_db()
        
        requests_result = db.table('session_requests').select('*').eq('receiver_id', current_user_id).execute()
        
        if not requests_result.data:
            return []
        
        # Get sender details
        sender_ids = [req['sender_id'] for req in requests_result.data]
        users_result = db.table('users').select('id, username, full_name, profile_photo, average_rating').in_('id', sender_ids).execute()
        
        users_dict = {user['id']: user for user in users_result.data}
        
        results = []
        for req in requests_result.data:
            sender = users_dict.get(req['sender_id'])
            if sender:
                results.append({
                    'request': req,
                    'sender': sender
                })
        
        return results
    
    except Exception as e:
        logger.error(f"Error fetching received requests: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/requests/sent", response_model=List[dict])
async def get_sent_requests(current_user_id: str = Depends(get_current_user)):
    """Get session requests sent by current user"""
    try:
        db = get_db()
        
        requests_result = db.table('session_requests').select('*').eq('sender_id', current_user_id).execute()
        
        if not requests_result.data:
            return []
        
        # Get receiver details
        receiver_ids = [req['receiver_id'] for req in requests_result.data]
        users_result = db.table('users').select('id, username, full_name, profile_photo, average_rating').in_('id', receiver_ids).execute()
        
        users_dict = {user['id']: user for user in users_result.data}
        
        results = []
        for req in requests_result.data:
            receiver = users_dict.get(req['receiver_id'])
            if receiver:
                results.append({
                    'request': req,
                    'receiver': receiver
                })
        
        return results
    
    except Exception as e:
        logger.error(f"Error fetching sent requests: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/requests/{request_id}/accept")
async def accept_session_request(request_id: str, session_data: SessionCreate, current_user_id: str = Depends(get_current_user)):
    """Accept a session request and create a session"""
    try:
        db = get_db()
        
        # Verify request exists and belongs to current user
        request_result = db.table('session_requests').select('*').eq('id', request_id).eq('receiver_id', current_user_id).execute()
        
        if not request_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session request not found"
            )
        
        request_data = request_result.data[0]
        
        if request_data['status'] != 'pending':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Request has already been processed"
            )
        
        # Update request status
        db.table('session_requests').update({'status': 'accepted'}).eq('id', request_id).execute()
        
        # Create learning session
        new_session = {
            'mentor_id': current_user_id,
            'learner_id': request_data['sender_id'],
            'skill_name': request_data['skill_wanted'],
            'meeting_link': session_data.meeting_link,
            'scheduled_at': session_data.scheduled_at.isoformat() if session_data.scheduled_at else None,
            'duration_minutes': session_data.duration_minutes,
            'status': 'scheduled'
        }
        
        session_result = db.table('learning_sessions').insert(new_session).execute()
        
        # Create notification for sender
        notification = {
            'user_id': request_data['sender_id'],
            'title': 'Session Request Accepted',
            'message': f'Your session request for {request_data["skill_wanted"]} has been accepted',
            'notification_type': 'session_update',
            'reference_id': session_result.data[0]['id'],
            'reference_type': 'learning_session'
        }
        db.table('notifications').insert(notification).execute()
        
        return {
            "message": "Session request accepted and session created",
            "session": session_result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting session request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/requests/{request_id}/reject")
async def reject_session_request(request_id: str, current_user_id: str = Depends(get_current_user)):
    """Reject a session request"""
    try:
        db = get_db()
        
        # Verify request
        request_result = db.table('session_requests').select('*').eq('id', request_id).eq('receiver_id', current_user_id).execute()
        
        if not request_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session request not found"
            )
        
        # Update status
        db.table('session_requests').update({'status': 'rejected'}).eq('id', request_id).execute()
        
        return {"message": "Session request rejected"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting session request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/my-sessions", response_model=List[dict])
async def get_my_sessions(current_user_id: str = Depends(get_current_user)):
    """Get all sessions for current user (as mentor or learner)"""
    try:
        db = get_db()
        
        # Get sessions where user is mentor or learner
        mentor_sessions = db.table('learning_sessions').select('*').eq('mentor_id', current_user_id).execute()
        learner_sessions = db.table('learning_sessions').select('*').eq('learner_id', current_user_id).execute()
        
        all_sessions = (mentor_sessions.data or []) + (learner_sessions.data or [])
        
        if not all_sessions:
            return []
        
        # Get user details
        user_ids = list(set([s['mentor_id'] for s in all_sessions] + [s['learner_id'] for s in all_sessions]))
        users_result = db.table('users').select('id, username, full_name, profile_photo').in_('id', user_ids).execute()
        
        users_dict = {user['id']: user for user in users_result.data}
        
        results = []
        for session in all_sessions:
            mentor = users_dict.get(session['mentor_id'])
            learner = users_dict.get(session['learner_id'])
            
            results.append({
                'session': session,
                'mentor': mentor,
                'learner': learner,
                'role': 'mentor' if session['mentor_id'] == current_user_id else 'learner'
            })
        
        return results
    
    except Exception as e:
        logger.error(f"Error fetching sessions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.patch("/{session_id}")
async def update_session(session_id: str, update_data: SessionUpdate, current_user_id: str = Depends(get_current_user)):
    """Update a session"""
    try:
        db = get_db()
        
        # Verify session exists and user is mentor
        session_result = db.table('learning_sessions').select('*').eq('id', session_id).eq('mentor_id', current_user_id).execute()
        
        if not session_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or you're not authorized"
            )
        
        # Prepare update data
        update_dict = {}
        if update_data.meeting_link is not None:
            update_dict['meeting_link'] = update_data.meeting_link
        if update_data.scheduled_at is not None:
            update_dict['scheduled_at'] = update_data.scheduled_at.isoformat()
        if update_data.duration_minutes is not None:
            update_dict['duration_minutes'] = update_data.duration_minutes
        if update_data.status is not None:
            update_dict['status'] = update_data.status
        if update_data.mentor_notes is not None:
            update_dict['mentor_notes'] = update_data.mentor_notes
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Update session
        result = db.table('learning_sessions').update(update_dict).eq('id', session_id).execute()
        
        return {
            "message": "Session updated successfully",
            "session": result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )