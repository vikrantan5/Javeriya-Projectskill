from fastapi import APIRouter, HTTPException
from app.config import settings
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
