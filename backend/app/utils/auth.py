from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from app.models.schemas import TokenData
import logging
import hashlib

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()



def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash
    Handles bcrypt 72-byte limit by truncating if necessary
    """
    # Truncate password to 72 bytes if needed (bcrypt limitation)
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        plain_password = password_bytes[:72].decode('utf-8', errors='ignore')
    
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt
    Handles bcrypt 72-byte limit by truncating if necessary
    """
    # Truncate password to 72 bytes if needed (bcrypt limitation)
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password = password_bytes[:72].decode('utf-8', errors='ignore')
    
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> TokenData:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return TokenData(user_id=user_id)
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Get current authenticated user ID from token"""
    try:
        token = credentials.credentials
        token_data = decode_access_token(token)
        if not token_data.user_id:
            logger.error("Token decoded but user_id is None")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        logger.debug(f"Authenticated user: {token_data.user_id}")
        return token_data.user_id
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_admin_user(current_user_id: str = Depends(get_current_user)) -> str:
    """Get current admin user"""
    from app.database import get_db
    
    db = get_db()
    result = db.table('users').select('role').eq('id', current_user_id).execute()
    
    if not result.data or result.data[0]['role'] != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action"
        )
    
    return current_user_id

# Optional utility functions for password management

def get_password_byte_length(password: str) -> int:
    """Get the byte length of a password (useful for validation)"""
    return len(password.encode('utf-8'))

def is_password_too_long(password: str, max_bytes: int = 72) -> bool:
    """Check if a password exceeds bcrypt's byte limit"""
    return get_password_byte_length(password) > max_bytes

def validate_password_strength(password: str) -> dict:
    """
    Validate password strength and return detailed feedback.
    Useful for API endpoints that need to provide detailed feedback.
    """
    issues = []
    strength = 0
    
    # Check length
    if len(password) < 8:
        issues.append("Password must be at least 8 characters long")
    else:
        strength += 25
        
    # Check byte length (bcrypt limitation)
    if is_password_too_long(password):
        issues.append(f"Password exceeds 72 byte limit (current: {get_password_byte_length(password)} bytes)")
    else:
        strength += 25
        
    # Check for uppercase
    if not any(c.isupper() for c in password):
        issues.append("Password must contain at least one uppercase letter")
    else:
        strength += 25
        
    # Check for lowercase
    if not any(c.islower() for c in password):
        issues.append("Password must contain at least one lowercase letter")
        
    # Check for numbers
    if not any(c.isdigit() for c in password):
        issues.append("Password must contain at least one number")
    else:
        strength += 25
        
    # Check for special characters
    if not any(c in '!@#$%^&*(),.?":{}|<>' for c in password):
        issues.append("Password should contain at least one special character")
    
    return {
        "valid": len(issues) == 0,
        "strength": strength,
        "issues": issues,
        "byte_length": get_password_byte_length(password)
    }