from app.database import get_db
import logging

logger = logging.getLogger(__name__)

def setup_storage_buckets():
    """
    Create and configure Supabase storage buckets for task attachments
    """
    try:
        db = get_db()
        
        # Create task-attachments bucket
        bucket_config = {
            'id': 'task-attachments',
            'name': 'task-attachments',
            'public': True,
            'file_size_limit': 10485760,  # 10MB
            'allowed_mime_types': [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/zip',
                'application/x-zip-compressed'
            ]
        }
        
        # Try to create the bucket (will fail if it already exists, which is fine)
        try:
            result = db.storage.create_bucket('task-attachments', {
                'public': True,
                'fileSizeLimit': 10485760,
                'allowedMimeTypes': [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/zip',
                    'application/x-zip-compressed'
                ]
            })
            logger.info(f"Storage bucket 'task-attachments' created successfully")
        except Exception as e:
            if 'already exists' in str(e).lower() or 'Duplicate' in str(e):
                logger.info("Storage bucket 'task-attachments' already exists")
            else:
                logger.warning(f"Error creating bucket: {str(e)}")
        
        logger.info("Storage setup completed")
        return True
        
    except Exception as e:
        logger.error(f"Error setting up storage buckets: {str(e)}")
        return False

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    setup_storage_buckets()
