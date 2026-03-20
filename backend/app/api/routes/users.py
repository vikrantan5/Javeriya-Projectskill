from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from app.models.schemas import UserResponse, UserUpdate
from app.utils.auth import get_current_user
from app.database import get_db
from app.services.token_service import token_service
from app.services.user_stats_service import user_stats_service
from app.services.trust_score_service import trust_score_service
from uuid import UUID
import logging
import os
from datetime import datetime
from app.config import settings
from supabase import create_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])

# Initialize Supabase client
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

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
        tasks_completed = db.table('tasks').select('id').or_(
            f'assigned_user_id.eq.{current_user_id},acceptor_id.eq.{current_user_id}'
        ).eq('status', 'completed').execute()
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
    

@router.get("/wallet")
async def get_wallet_info(current_user_id: str = Depends(get_current_user)):
    """Get comprehensive wallet information including balance, earnings, spending, and transactions"""
    try:
        db = get_db()
        
        # Get token balance
        token_result = db.table('skill_tokens').select('*').eq('user_id', current_user_id).execute()
        
        if not token_result.data:
            # Create token account if doesn't exist
            token_account = token_service.create_token_account(current_user_id)
            balance = token_account['balance']
            total_earned = token_account['total_earned']
            total_spent = token_account['total_spent']
        else:
            token_data = token_result.data[0]
            balance = token_data.get('balance', 0)
            total_earned = token_data.get('total_earned', 0)
            total_spent = token_data.get('total_spent', 0)
        
        # Get recent transactions
        transactions = token_service.get_transaction_history(current_user_id, 10)
        
        return {
            "balance": balance,
            "total_earned": total_earned,
            "total_spent": total_spent,
            "transactions": transactions
        }
    
    except Exception as e:
        logger.error(f"Error getting wallet info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/me")
async def get_current_user_profile(current_user_id: str = Depends(get_current_user)):
    """Get current user profile with complete data including skills"""
    try:
        db = get_db()
        
        user_result = db.table('users').select('*').eq('id', current_user_id).execute()
        
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_data = user_result.data[0]
        
        # Get user's skills from user_skills table
        skills_result = db.table('user_skills').select('skill_name, skill_level, is_verified').eq('user_id', current_user_id).execute()
        user_data['skills'] = [skill['skill_name'] for skill in (skills_result.data or [])]
        user_data['skills_detailed'] = skills_result.data or []

          # Ensure interests and languages are included (they should be in users table)
        if 'interests' not in user_data or user_data['interests'] is None:
            user_data['interests'] = []
        if 'languages' not in user_data or user_data['languages'] is None:
            user_data['languages'] = []
        
        return user_data
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# @router.get("/{user_id}", response_model=UserResponse)

# async def get_user_by_id(user_id: UUID):
#     """Get user profile by ID"""
#     try:
#         db = get_db()
        
#         user_result = db.table('users').select('*').eq('id', user_id).execute()
        
#         if not user_result.data:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="User not found"
#             )
        
#         user_data = user_result.data[0]
        
#         # Get user's skills
#         skills_result = db.table('user_skills').select('skill_name, skill_level, is_verified').eq('user_id', str(user_id)).execute()
#         user_data['skills'] = [skill['skill_name'] for skill in (skills_result.data or [])]
        
#         # Get upcoming sessions count
#         upcoming_sessions = db.table('learning_sessions').select('id').eq('mentor_id', str(user_id)).eq('status', 'scheduled').execute()
#         user_data['upcoming_sessions_count'] = len(upcoming_sessions.data) if upcoming_sessions.data else 0
        
#         # Get connections/followers count
#         connections = db.table('connections').select('id').eq('user_id', str(user_id)).eq('status', 'accepted').execute()
#         user_data['connections_count'] = len(connections.data) if connections.data else 0
        
#         return user_data
    
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error fetching user: {str(e)}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=str(e)
#         )
    

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
        
        try:
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
        except Exception as conn_error:
            # Handle case where connections table doesn't exist
            if "Could not find the table 'public.connections'" in str(conn_error):
                logger.warning(f"Connections table not found: {conn_error}")
                return {"connections": [], "message": "Connections feature requires database setup. Please create the connections table."}
            raise
    
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
        if update_data.background_photo is not None:
            update_dict['background_photo'] = update_data.background_photo
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
    

@router.post("/upload-profile-photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user)
):
    """Upload profile photo to Supabase storage"""
    try:
        logger.info(f"Uploading profile photo for user: {current_user_id}")
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type: {file.content_type}. Only JPEG, PNG, WEBP, and GIF are allowed."
            )
        
        # Read file content
        file_content = await file.read()
        logger.info(f"File size: {len(file_content)} bytes")
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        file_name = f"profile_{current_user_id}_{int(datetime.now().timestamp())}.{file_extension}"
        file_path = file_name  # Just the filename, not nested in folder
        
        logger.info(f"Uploading to path: {file_path}")
        
        # Upload to Supabase storage
        try:
            storage_response = supabase.storage.from_('profile-photos').upload(
                file_path,
                file_content,
                {
                    "content-type": file.content_type,
                    "upsert": "true"
                }
            )
            logger.info(f"Upload response: {storage_response}")
        except Exception as storage_error:
            logger.error(f"Storage upload error: {str(storage_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload to storage: {str(storage_error)}"
            )
        
        # Get public URL
        public_url_response = supabase.storage.from_('profile-photos').get_public_url(file_path)
        
        # Extract URL from response (it might be a dict or string)
        if isinstance(public_url_response, dict):
            public_url = public_url_response.get('publicUrl') or public_url_response.get('publicURL')
        else:
            public_url = public_url_response
            
        logger.info(f"Public URL: {public_url}")
        
        # Update user profile with photo URL
        db = get_db()
        update_response = db.table('users').update({'profile_photo': public_url}).eq('id', current_user_id).execute()
        logger.info(f"Database update response: {update_response}")
        
        return {
            "message": "Profile photo uploaded successfully",
            "photo_url": public_url
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading profile photo: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.post("/upload-background-photo")
async def upload_background_photo(
    file: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user)
):
    """Upload background photo to Supabase storage"""
    try:
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only JPEG, PNG, and WEBP are allowed."
            )
        
        # Read file content
        file_content = await file.read()
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1]
        file_name = f"background_{current_user_id}_{datetime.now().timestamp()}.{file_extension}"
        file_path = f"background-photos/{file_name}"
        
        # Upload to Supabase storage
        storage_response = supabase.storage.from_('background-photos').upload(
            file_path,
            file_content,
            {"content-type": file.content_type}
        )
        
        # Get public URL
        public_url = supabase.storage.from_('background-photos').get_public_url(file_path)
        
        # Update user profile with background photo URL
        db = get_db()
        db.table('users').update({'background_photo': public_url}).eq('id', current_user_id).execute()
        
        return {
            "message": "Background photo uploaded successfully",
            "photo_url": public_url
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading background photo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/browse")
async def browse_users(
    limit: int = 20,
    offset: int = 0,
    search: str = None,
    current_user_id: str = Depends(get_current_user)
):
    """Browse all users on the platform"""
    try:
        db = get_db()
        
        # Build query
        query = db.table('users').select('id, username, full_name, profile_photo, bio, average_rating, total_sessions')
        
        # Exclude current user
        query = query.neq('id', current_user_id)
        
        # Add search if provided
        if search:
            query = query.or_(f'username.ilike.%{search}%,full_name.ilike.%{search}%')
        
        # Execute query with pagination
        result = query.range(offset, offset + limit - 1).execute()
        
        # Get skills for each user
        users_with_skills = []
        for user in result.data:
            skills_result = db.table('user_skills').select('skill_name').eq('user_id', user['id']).limit(3).execute()
            user['top_skills'] = [skill['skill_name'] for skill in (skills_result.data or [])]
            
            # Check connection status
            connection_result = db.table('connections').select('status').or_(
                f'and(user_id.eq.{current_user_id},connected_user_id.eq.{user["id"]}),and(user_id.eq.{user["id"]},connected_user_id.eq.{current_user_id})'
            ).execute()
            
            user['connection_status'] = connection_result.data[0]['status'] if connection_result.data else None
            users_with_skills.append(user)
        
        return {"users": users_with_skills}
    
    except Exception as e:
        logger.error(f"Error browsing users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/connections/send-request/{user_id}")
async def send_connection_request(
    user_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Send a connection request to another user"""
    try:
        db = get_db()
        
        # Check if connection already exists
        existing = db.table('connections').select('*').or_(
            f'and(user_id.eq.{current_user_id},connected_user_id.eq.{user_id}),and(user_id.eq.{user_id},connected_user_id.eq.{current_user_id})'
        ).execute()
        
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Connection request already exists"
            )
        
        # Create connection request
        connection_data = {
            'user_id': current_user_id,
            'connected_user_id': user_id,
            'status': 'pending'
        }
        
        result = db.table('connections').insert(connection_data).execute()
        
        # Create notification for receiver
        db.table('notifications').insert({
            'user_id': user_id,
            'title': 'New Connection Request',
            'message': 'Someone wants to connect with you!',
            'notification_type': 'connection_request',
            'reference_id': result.data[0]['id'],
            'reference_type': 'connection'
        }).execute()
        
        return {
            "message": "Connection request sent successfully",
            "connection": result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending connection request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/connections/respond/{connection_id}")
async def respond_to_connection_request(
    connection_id: str,
    accept: bool,
    current_user_id: str = Depends(get_current_user)
):
    """Accept or reject a connection request"""
    try:
        db = get_db()
        
        # Get connection request
        connection_result = db.table('connections').select('*').eq('id', connection_id).eq('connected_user_id', current_user_id).execute()
        
        if not connection_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Connection request not found"
            )
        
        connection = connection_result.data[0]
        
        # Update connection status
        new_status = 'accepted' if accept else 'rejected'
        db.table('connections').update({'status': new_status}).eq('id', connection_id).execute()
        
        # Notify sender
        message = 'Your connection request was accepted!' if accept else 'Your connection request was declined.'
        db.table('notifications').insert({
            'user_id': connection['user_id'],
            'title': 'Connection Request Update',
            'message': message,
            'notification_type': 'connection_response',
            'reference_id': connection_id,
            'reference_type': 'connection'
        }).execute()
        
        return {
            "message": f"Connection request {'accepted' if accept else 'rejected'}",
            "status": new_status
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error responding to connection request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/connection-requests")
async def get_connection_requests(current_user_id: str = Depends(get_current_user)):
    """Get pending connection requests for current user"""
    try:
        db = get_db()
        
        # Get pending requests where user is receiver
        requests_result = db.table('connections').select('*').eq('connected_user_id', current_user_id).eq('status', 'pending').execute()
        
        if not requests_result.data:
            return {"requests": []}
        
        # Get sender details
        sender_ids = [req['user_id'] for req in requests_result.data]
        users_result = db.table('users').select('id, username, full_name, profile_photo, bio').in_('id', sender_ids).execute()
        users_dict = {user['id']: user for user in users_result.data}
        
        # Combine data
        requests_with_users = []
        for req in requests_result.data:
            sender = users_dict.get(req['user_id'])
            if sender:
                requests_with_users.append({
                    'connection_id': req['id'],
                    'sender': sender,
                    'created_at': req['created_at']
                })
        
        return {"requests": requests_with_users}
    
    except Exception as e:
        logger.error(f"Error getting connection requests: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/my-activities")
async def get_my_activities(
    limit: int = 20,
    current_user_id: str = Depends(get_current_user)
):
    """Get user's recent activities"""
    try:
        db = get_db()
        activities = []
        
        # Get recent sessions
        sessions = db.table('learning_sessions').select('*, mentor:users!mentor_id(username, full_name), learner:users!learner_id(username, full_name)').or_(
            f'mentor_id.eq.{current_user_id},learner_id.eq.{current_user_id}'
        ).order('created_at', desc=True).limit(10).execute()
        
        for session in (sessions.data or []):
            other_user = session.get('learner') if session.get('mentor_id') == current_user_id else session.get('mentor')
            activities.append({
                'icon': 'BookOpen',
                'title': f"Learning Session: {session.get('skill_name')}",
                'user': other_user.get('full_name') or other_user.get('username') if other_user else 'Unknown',
                'time': session.get('created_at')
            })
        
        # Get recent tasks
        tasks = db.table('tasks').select('*, creator:users!creator_id(username, full_name)').or_(
            f'creator_id.eq.{current_user_id},acceptor_id.eq.{current_user_id}'
        ).order('created_at', desc=True).limit(10).execute()
        
        for task in (tasks.data or []):
            creator = task.get('creator')
            activities.append({
                'icon': 'Briefcase',
                'title': f"Task: {task.get('title')}",
                'user': creator.get('full_name') or creator.get('username') if creator else 'Unknown',
                'time': task.get('created_at')
            })
        
        # Sort by time
        activities.sort(key=lambda x: x.get('time') or '', reverse=True)
        
        return {"activities": activities[:limit]}
    
    except Exception as e:
        logger.error(f"Error getting activities: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/achievements")
async def get_achievements(current_user_id: str = Depends(get_current_user)):
    """Get user achievements"""
    try:
        db = get_db()
        achievements = []
        
        # Get user stats
        user_result = db.table('users').select('*').eq('id', current_user_id).execute()
        if not user_result.data:
            return {"achievements": []}
        
        user = user_result.data[0]
        
        # Get sessions count
        sessions_result = db.table('learning_sessions').select('id').eq('mentor_id', current_user_id).eq('status', 'completed').execute()
        sessions_count = len(sessions_result.data or [])
        
        # Get tasks count
        tasks_result = db.table('tasks').select('id').eq('acceptor_id', current_user_id).eq('status', 'completed').execute()
        tasks_count = len(tasks_result.data or [])
        
        # Get verified skills count
        verified_skills = db.table('user_skills').select('id').eq('user_id', current_user_id).eq('is_verified', True).execute()
        verified_count = len(verified_skills.data or [])
        
        # Generate achievements
        if sessions_count >= 1:
            achievements.append({
                'icon': 'Trophy',
                'title': 'First Session',
                'description': 'Completed your first learning session',
                'color': 'blue',
                'date': 'Recently'
            })
        
        if sessions_count >= 10:
            achievements.append({
                'icon': 'Medal',
                'title': 'Session Expert',
                'description': 'Completed 10+ learning sessions',
                'color': 'purple',
                'date': 'Recently'
            })
        
        if tasks_count >= 5:
            achievements.append({
                'icon': 'Target',
                'title': 'Task Master',
                'description': 'Completed 5+ tasks',
                'color': 'green',
                'date': 'Recently'
            })
        
        if verified_count >= 3:
            achievements.append({
                'icon': 'Crown',
                'title': 'Verified Expert',
                'description': 'Verified 3+ skills',
                'color': 'yellow',
                'date': 'Recently'
            })
        
        if user.get('average_rating', 0) >= 4.5:
            achievements.append({
                'icon': 'Rocket',
                'title': 'Top Rated',
                'description': 'Maintained 4.5+ average rating',
                'color': 'indigo',
                'date': 'Recently'
            })
        
        return {"achievements": achievements}
    
    except Exception as e:
        logger.error(f"Error getting achievements: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    


# IMPORTANT: Routes with path parameters (/{user_id}) must come AFTER all specific routes
# to prevent FastAPI from matching specific routes like /browse, /my-activities as user_id

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
        skills_result = db.table('user_skills').select('skill_name, skill_level, is_verified').eq('user_id', str(user_id)).execute()
        user_data['skills'] = [skill['skill_name'] for skill in (skills_result.data or [])]
        
        # Get upcoming sessions count
        upcoming_sessions = db.table('learning_sessions').select('id').eq('mentor_id', str(user_id)).eq('status', 'scheduled').execute()
        user_data['upcoming_sessions_count'] = len(upcoming_sessions.data) if upcoming_sessions.data else 0
        
        # Get connections/followers count
        try:
            connections = db.table('connections').select('id').eq('user_id', str(user_id)).eq('status', 'accepted').execute()
            user_data['connections_count'] = len(connections.data) if connections.data else 0
        except Exception:
            user_data['connections_count'] = 0
        
        return user_data
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{user_id}/full-profile")
async def get_user_full_profile(user_id: str):
    """Get complete user profile with statistics (PUBLIC - no auth required)"""
    try:
        # Get comprehensive user statistics using the service
        user_stats = user_stats_service.get_user_statistics(user_id)
        
        if not user_stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user_stats
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching full user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{user_id}/statistics")
async def get_user_statistics_endpoint(user_id: str):
    """Get detailed user statistics (PUBLIC)"""
    try:
        stats = user_stats_service.get_user_statistics(user_id)
        
        if not stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Return only statistics, not profile data
        return {
            "user_id": stats['user_id'],
            "tasks_completed": stats['tasks_completed'],
            "tasks_failed": stats['tasks_failed'],
            "total_tasks_attempted": stats['total_tasks_attempted'],
            "success_rate": stats['success_rate'],
            "avg_rating": stats['avg_rating'],
            "total_reviews": stats['total_reviews'],
            "on_time_percentage": stats['on_time_percentage'],
            "late_submissions": stats['late_submissions'],
            "connection_count": stats['connection_count'],
            "sessions_completed": stats['sessions_completed']
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{user_id}/trust-score")
async def get_user_trust_score(user_id: str):
    """Get user trust score with risk indicators (PUBLIC, TRANSPARENT)"""
    try:
        trust_score_data = trust_score_service.calculate_trust_score(user_id)
        
        if not trust_score_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return trust_score_data
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching trust score: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )