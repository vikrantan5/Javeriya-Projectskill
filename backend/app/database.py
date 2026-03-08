from supabase import create_client, Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY  # Using service role for backend operations
)

logger.info("Supabase client initialized successfully")

def get_db() -> Client:
    """Get database client instance"""
    return supabase
