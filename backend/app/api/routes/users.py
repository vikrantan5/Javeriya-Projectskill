from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import UserResponse, UserUpdate
from app.utils.auth import get_current_user
from app.database import get_db
from app.services.token_service import token_service
from uuid import UUID
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/token-balance")
async def get_token_balance(current_user_id: str = Depends(get_current_user)):
    """Get user's token balance and stats"""
    try:
        db = get_db()
        
        # Get token account
        token_result = db.table('skill_tokens').select('*').eq('user_id', current_user_id).execute()
        
        if not token_result.data:
            # Create account if doesn't exist
            token_account = token_service.create_token_account(current_user_id)
            return token_account
        
        return token_result.data[0]
    
    except Exception as e:
        logger.error(f"Error getting token balance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    
@router.get("/me/stats")
async def get_user_stats(current_user_id: str = Depends(get_current_user)):
    """Get user statistics (sessions, tasks, ratings, mentees)"""
    try:
        db = get_db()
        
        # Get user data
        user_result = db.table('users').select('*').eq('id', current_user_id).execute()
        
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_result.data[0]
        
        # Get total sessions (as mentor and learner)
        mentor_sessions = db.table('learning_sessions').select('id').eq('mentor_id', current_user_id).eq('status', 'completed').execute()
        learner_sessions = db.table('learning_sessions').select('id').eq('learner_id', current_user_id).eq('status', 'completed').execute()
        total_sessions = len(mentor_sessions.data or []) + len(learner_sessions.data or [])
        
        # Get total tasks completed
        tasks_completed = db.table('task_board').select('id').eq('acceptor_id', current_user_id).eq('status', 'completed').execute()
        total_tasks_completed = len(tasks_completed.data or [])
        
        # Get average rating (from user table)
        average_rating = user.get('average_rating', 0.0)
        
        # Get mentees count (connections where user is mentor)
        connections = db.table('connections').select('id').eq('user_id', current_user_id).eq('status', 'accepted').execute()
        total_mentees = len(connections.data or [])
        
        return {
            "total_sessions": total_sessions,
            "total_tasks_completed": total_tasks_completed,
            "average_rating": average_rating,
            "total_mentees": total_mentees
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/token-transactions")
async def get_token_transactions(limit: int = 20, current_user_id: str = Depends(get_current_user)):
    """Get user's token transaction history"""
    try:
        transactions = token_service.get_transaction_history(current_user_id, limit)
        return {"transactions": transactions}
    
    except Exception as e:
        logger.error(f"Error getting transactions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user_id: str = Depends(get_current_user)):
    "Get current user profile with complete dat"
    try:
        db = get_db()
        
        user_result = db.table('users').select('*').eq('id', current_user_id).execute()
        
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user_result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{user_id}", response_model=UserResponse)

async def get_user_by_id(user_id: UUID):
    """Get user profile by ID"""
    try:
        db = get_db()
        
        user_result = db.table('users').select('*').eq('id', user_id).execute()
        
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_data = user_result.data[0]
        
        # Get user's skills
        skills_result = db.table('user_skills').select('skill_name, proficiency_level, is_verified').eq('user_id', current_user_id).execute()
        user_data['skills'] = [skill['skill_name'] for skill in (skills_result.data or [])]
        
        # Get upcoming sessions count
        upcoming_sessions = db.table('learning_sessions').select('id').eq('mentor_id', current_user_id).eq('status', 'scheduled').execute()
        user_data['upcoming_sessions_count'] = len(upcoming_sessions.data) if upcoming_sessions.data else 0
        
        # Get connections/followers count
        connections = db.table('connections').select('id').eq('user_id', current_user_id).eq('status', 'accepted').execute()
        user_data['connections_count'] = len(connections.data) if connections.data else 0
        
        return user_data
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    

@router.get("/upcoming-sessions")
async def get_upcoming_sessions(current_user_id: str = Depends(get_current_user)):
    """Get upcoming sessions for current user"""
    try:
        db = get_db()
        
        # Get sessions where user is mentor or learner and status is scheduled
        mentor_sessions = db.table('learning_sessions').select('*').eq('mentor_id', current_user_id).eq('status', 'scheduled').execute()
        learner_sessions = db.table('learning_sessions').select('*').eq('learner_id', current_user_id).eq('status', 'scheduled').execute()
        
        all_sessions = (mentor_sessions.data or []) + (learner_sessions.data or [])
        
        if not all_sessions:
            return {"sessions": []}
        
        # Get user details for mentors/learners
        user_ids = list(set([s['mentor_id'] for s in all_sessions] + [s['learner_id'] for s in all_sessions]))
        users_result = db.table('users').select('id, username, full_name, profile_photo').in_('id', user_ids).execute()
        users_dict = {user['id']: user for user in users_result.data}
        
        results = []
        for session in all_sessions:
            other_user = users_dict.get(session['learner_id'] if session['mentor_id'] == current_user_id else session['mentor_id'])
            results.append({
                'id': session['id'],
                'title': f"{session['skill_name']} Session",
                'skill_name': session['skill_name'],
                'scheduled_at': session.get('scheduled_at'),
                'duration_minutes': session.get('duration_minutes', 60),
                'meeting_link': session.get('meeting_link'),
                'other_user': other_user,
                'role': 'mentor' if session['mentor_id'] == current_user_id else 'learner'
            })
        
        # Sort by scheduled_at
        results.sort(key=lambda x: x['scheduled_at'] or '', reverse=False)
        
        return {"sessions": results}
    
    except Exception as e:
        logger.error(f"Error getting upcoming sessions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/connections")
async def get_connections(current_user_id: str = Depends(get_current_user)):
    """Get user's connections"""
    try:
        db = get_db()
        
        # Get accepted connections where user is either initiator or receiver
        connections_as_initiator = db.table('connections').select('*').eq('user_id', current_user_id).eq('status', 'accepted').execute()
        connections_as_receiver = db.table('connections').select('*').eq('connected_user_id', current_user_id).eq('status', 'accepted').execute()
        
        all_connections = (connections_as_initiator.data or []) + (connections_as_receiver.data or [])
        
        if not all_connections:
            return {"connections": []}
        
        # Get connected user IDs
        connected_user_ids = []
        for conn in all_connections:
            other_user_id = conn['connected_user_id'] if conn['user_id'] == current_user_id else conn['user_id']
            connected_user_ids.append(other_user_id)
        
        # Get user details
        users_result = db.table('users').select('id, username, full_name, profile_photo, bio').in_('id', connected_user_ids).execute()
        
        # Get primary skill for each user
        results = []
        for user in users_result.data:
            skills_result = db.table('user_skills').select('skill_name').eq('user_id', user['id']).limit(1).execute()
            primary_skill = skills_result.data[0]['skill_name'] if skills_result.data else 'Developer'
            
            results.append({
                'id': user['id'],
                'username': user['username'],
                'full_name': user.get('full_name'),
                'profile_photo': user.get('profile_photo'),
                'primary_skill': primary_skill,
                'bio': user.get('bio', '')[:100] + '...' if user.get('bio', '') else ''
            })
        
        return {"connections": results}
    
    except Exception as e:
        logger.error(f"Error getting connections: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/profile-completion")
async def get_profile_completion(current_user_id: str = Depends(get_current_user)):
    """Calculate profile completion percentage"""
    try:
        db = get_db()
        
        user_result = db.table('users').select('*').eq('id', current_user_id).execute()
        
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_result.data[0]
        completion = 0
        missing_fields = []
        
        # Basic Info (20%)
        if user.get('full_name') and user.get('email') and user.get('username'):
            completion += 20
        else:
            missing_fields.append('Basic Info')
        
        # Profile Picture (20%)
        if user.get('profile_photo'):
            completion += 20
        else:
            missing_fields.append('Profile Picture')
        
        # Skills Added (20%)
        skills_result = db.table('user_skills').select('id').eq('user_id', current_user_id).execute()
        if skills_result.data and len(skills_result.data) > 0:
            completion += 20
        else:
            missing_fields.append('Skills Added')
        
        # Verification (20%)
        if user.get('is_verified'):
            completion += 20
        else:
            missing_fields.append('Verification')
        
        # Connections (20%)
        connections = db.table('connections').select('id').eq('user_id', current_user_id).eq('status', 'accepted').execute()
        if connections.data and len(connections.data) > 0:
            completion += 20
        else:
            missing_fields.append('Connections')
        
        return {
            "completion_percentage": completion,
            "missing_fields": missing_fields
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating profile completion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.patch("/me")
async def update_user_profile(update_data: UserUpdate, current_user_id: str = Depends(get_current_user)):
    """Update current user profile"""
    try:
        db = get_db()
        
        # Prepare update data
        update_dict = {}
        if update_data.full_name is not None:
            update_dict['full_name'] = update_data.full_name
        if update_data.bio is not None:
            update_dict['bio'] = update_data.bio
        if update_data.profile_photo is not None:
            update_dict['profile_photo'] = update_data.profile_photo
        if update_data.location is not None:
            update_dict['location'] = update_data.location
        if update_data.phone is not None:
            update_dict['phone'] = update_data.phone
        if update_data.website is not None:
            update_dict['website'] = update_data.website
        if update_data.github is not None:
            update_dict['github'] = update_data.github
        if update_data.twitter is not None:
            update_dict['twitter'] = update_data.twitter
        if update_data.linkedin is not None:
            update_dict['linkedin'] = update_data.linkedin
        if update_data.company is not None:
            update_dict['company'] = update_data.company
        if update_data.job_title is not None:
            update_dict['job_title'] = update_data.job_title
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Update user
        result = db.table('users').update(update_dict).eq('id', current_user_id).execute()
        
        return {
            "message": "Profile updated successfully",
            "user": result.data[0] if result.data else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )