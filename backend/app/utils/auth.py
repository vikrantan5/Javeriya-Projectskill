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

def pre_hash_password(password: str) -> str:
    """
    Pre-hash the password if it's too long for bcrypt (72 byte limit).
    Uses SHA-256 to create a fixed-length hash of long passwords.
    This maintains security while working within bcrypt's limitations.
    
    Args:
        password: The plain text password
        
    Returns:
        Either the original password (if within limit) or SHA-256 hash
    """
    # Check password length in bytes (not characters - important for Unicode!)
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        logger.warning(f"Password too long ({len(password_bytes)} bytes), pre-hashing with SHA-256")
        # SHA-256 produces a 64-character hex string (32 bytes) - well within bcrypt's limit
        return hashlib.sha256(password_bytes).hexdigest()
    return password

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    Handles both normally hashed and pre-hashed passwords.
    
    Args:
        plain_password: The plain text password to verify
        hashed_password: The stored hash to verify against
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        # First try normal verification
        if pwd_context.verify(plain_password, hashed_password):
            return True
            
        # If normal verification fails, try with pre-hashed version
        # This handles the case where the password was pre-hashed during registration
        pre_hashed = pre_hash_password(plain_password)
        if pre_hashed != plain_password:  # Only if pre-hashing actually changed it
            return pwd_context.verify(pre_hashed, hashed_password)
            
        return False
    except Exception as e:
        logger.error(f"Password verification error: {str(e)}")
        return False

def get_password_hash(password: str) -> str:
    """
    Hash a password, automatically handling passwords that are too long for bcrypt.
    
    Args:
        password: The plain text password to hash
        
    Returns:
        bcrypt hash of the password (or pre-hashed password)
    """
    try:
        # Pre-hash if password is too long
        processed_password = pre_hash_password(password)
        
        # Log password length for monitoring (but not the actual password!)
        password_bytes = password.encode('utf-8')
        logger.debug(f"Hashing password of length: {len(password)} chars, {len(password_bytes)} bytes")
        
        # Hash with bcrypt
        return pwd_context.hash(processed_password)
    except Exception as e:
        logger.error(f"Password hashing error: {str(e)}")
        # Re-raise with a user-friendly message
        if "password cannot be longer than 72 bytes" in str(e).lower():
            raise ValueError("Password is too long. Maximum 72 bytes allowed.")
        raise ValueError(f"Password hashing failed: {str(e)}")

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
    token = credentials.credentials
    token_data = decode_access_token(token)
    return token_data.user_id

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