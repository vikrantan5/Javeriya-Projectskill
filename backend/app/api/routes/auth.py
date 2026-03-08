from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import UserCreate, UserLogin, UserResponse, Token
from app.utils.auth import get_password_hash, verify_password, create_access_token
# Don't import get_current_user here to avoid circular imports
from app.database import get_db
from app.services.email_service import email_service
from datetime import timedelta
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Create the router
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        db = get_db()
        
        # Check if email already exists
        existing_user = db.table('users').select('id').eq('email', user_data.email).execute()
        if existing_user.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if username already exists
        existing_username = db.table('users').select('id').eq('username', user_data.username).execute()
        if existing_username.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Hash password
        hashed_password = get_password_hash(user_data.password)
        
        # Create user
        new_user = {
            'email': user_data.email,
            'username': user_data.username,
            'password_hash': hashed_password,
            'full_name': user_data.full_name,
            'location': user_data.location,
            'phone': user_data.phone,
            'role': 'student',
            'is_active': True,
            'is_banned': False,
            'is_verified': False
        }
        
        result = db.table('users').insert(new_user).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        created_user = result.data[0]
        
        # Send welcome email (async, don't wait)
        try:
            await email_service.send_welcome_email(user_data.email, user_data.username)
        except Exception as e:
            logger.error(f"Failed to send welcome email: {str(e)}")
        
        # Create access token
        access_token = create_access_token(
            data={"sub": created_user['id']},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return {
            "message": "User registered successfully",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": created_user['id'],
                "email": created_user['email'],
                "username": created_user['username'],
                "full_name": created_user['full_name'],
                "role": created_user['role']
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user"""
    try:
        db = get_db()
        
        # Get user by email
        user_result = db.table('users').select('*').eq('email', credentials.email).execute()
        
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        user = user_result.data[0]
        
        # Check if user is banned
        if user['is_banned']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account has been banned. Please contact support."
            )
        
        # Verify password
        if not verify_password(credentials.password, user['password_hash']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Update last login
        db.table('users').update({'last_login': 'now()'}).eq('id', user['id']).execute()
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user['id']},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

# Import get_current_user here to avoid circular import
@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user_id: str = Depends(lambda: Depends(get_current_user_local))):
    """Get current user information"""
    try:
        # Import here to avoid circular dependency
        from app.utils.auth import get_current_user as get_current_user_local
        
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
        logger.error(f"Error getting user info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )