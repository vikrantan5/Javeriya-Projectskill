from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from app.models.schemas import SkillCreate, SkillResponse
from app.utils.auth import get_current_user
from app.database import get_db
from app.services.resume_parser import resume_parser
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/skills", tags=["Skills"])

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_skill(skill_data: SkillCreate, current_user_id: str = Depends(get_current_user)):
    """Add a new skill to user profile"""
    try:
        db = get_db()
        
        # Check if skill already exists for user
        existing_skill = db.table('user_skills').select('id').eq('user_id', current_user_id).eq('skill_name', skill_data.skill_name).eq('skill_type', skill_data.skill_type).execute()
        
        if existing_skill.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have this skill added"
            )
        
        # Create new skill
        new_skill = {
            'user_id': current_user_id,
            'skill_name': skill_data.skill_name,
            'skill_type': skill_data.skill_type,
            'skill_level': skill_data.skill_level,
            'description': skill_data.description if hasattr(skill_data, 'description') else None,
            'years_experience': skill_data.years_experience if hasattr(skill_data, 'years_experience') else None,
            'hourly_rate': skill_data.hourly_rate if hasattr(skill_data, 'hourly_rate') else None,
            'is_verified': False
        }
        
        result = db.table('user_skills').insert(new_skill).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add skill"
            )
        
        return {
            "message": "Skill added successfully",
            "skill": result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding skill: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/my-skills", response_model=List[SkillResponse])
async def get_my_skills(current_user_id: str = Depends(get_current_user)):
    """Get all skills for current user"""
    try:
        db = get_db()
        
        result = db.table('user_skills').select('*').eq('user_id', current_user_id).execute()
        
        return result.data if result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching skills: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    

@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    auto_add: bool = True,
    current_user_id: str = Depends(get_current_user)
):
    """
    Upload resume (PDF or DOCX) and extract skills automatically
    
    Args:
        file: Resume file (PDF or DOCX)
        auto_add: If True, automatically add extracted skills to user profile
        current_user_id: Current authenticated user
    """
    try:
        # Validate file type
        allowed_extensions = ['pdf', 'docx', 'doc']
        file_extension = file.filename.split('.')[-1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Parse resume and extract skills
        parse_result = resume_parser.parse_resume(file_content, file.filename)
        
        if not parse_result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse resume: {parse_result.get('error', 'Unknown error')}"
            )
        
        # Auto-add skills if requested
        added_skills = []
        skipped_skills = []
        
        if auto_add and parse_result['skills']:
            db = get_db()
            
            # Get existing skills for user
            existing_skills_result = db.table('user_skills').select('skill_name').eq('user_id', current_user_id).execute()
            existing_skill_names = {skill['skill_name'].lower() for skill in existing_skills_result.data} if existing_skills_result.data else set()
            
            # Add new skills
            for skill_name in parse_result['skills']:
                if skill_name.lower() not in existing_skill_names:
                    try:
                        new_skill = {
                            'user_id': current_user_id,
                            'skill_name': skill_name,
                            'skill_type': 'offered',  # Default to offered
                            'skill_level': 'intermediate',  # Default level
                            'is_verified': False
                        }
                        
                        result = db.table('user_skills').insert(new_skill).execute()
                        if result.data:
                            added_skills.append(skill_name)
                    except Exception as e:
                        logger.error(f"Error adding skill {skill_name}: {str(e)}")
                        skipped_skills.append(skill_name)
                else:
                    skipped_skills.append(skill_name)
        
        return {
            "message": "Resume parsed successfully",
            "parse_result": {
                "total_skills_found": parse_result['total_skills_found'],
                "skills": parse_result['skills'],
                "categorized_skills": parse_result['categorized_skills']
            },
            "auto_add_result": {
                "added_count": len(added_skills),
                "skipped_count": len(skipped_skills),
                "added_skills": added_skills,
                "skipped_skills": skipped_skills
            } if auto_add else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading resume: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/search", response_model=List[dict])
async def search_skills(skill_name: str, skill_type: str = "offered"):
    """Search for users by skill"""
    try:
        db = get_db()
        
        # Get users with the specified skill
        skills_result = db.table('user_skills').select('user_id, skill_name, skill_level, is_verified').eq('skill_name', skill_name).eq('skill_type', skill_type).execute()
        
        if not skills_result.data:
            return []
        
        # Get user details for each skill
        user_ids = [skill['user_id'] for skill in skills_result.data]
        users_result = db.table('users').select('id, username, full_name, profile_photo, average_rating, total_ratings, bio').in_('id', user_ids).execute()
        
        # Merge skill and user data
        users_dict = {user['id']: user for user in users_result.data}
        
        results = []
        for skill in skills_result.data:
            user = users_dict.get(skill['user_id'])
            if user:
                results.append({
                    'user': user,
                    'skill_level': skill['skill_level'],
                    'is_verified': skill['is_verified']
                })
        
        return results
    
    except Exception as e:
        logger.error(f"Error searching skills: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{skill_id}")
async def delete_skill(skill_id: str, current_user_id: str = Depends(get_current_user)):
    """Delete a skill from user profile"""
    try:
        db = get_db()
        
        # Verify skill belongs to user
        skill_result = db.table('user_skills').select('*').eq('id', skill_id).eq('user_id', current_user_id).execute()
        
        if not skill_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill not found or doesn't belong to you"
            )
        
        # Delete skill
        db.table('user_skills').delete().eq('id', skill_id).execute()
        
        return {"message": "Skill deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting skill: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{skill_id}")
async def update_skill(skill_id: str, skill_data: SkillCreate, current_user_id: str = Depends(get_current_user)):
    """Update a skill"""
    try:
        db = get_db()
        
        # Verify skill belongs to user
        skill_result = db.table('user_skills').select('*').eq('id', skill_id).eq('user_id', current_user_id).execute()
        
        if not skill_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill not found or doesn't belong to you"
            )
        
        # Update skill
        update_data = {
            'skill_name': skill_data.skill_name,
            'skill_type': skill_data.skill_type,
            'skill_level': skill_data.skill_level,
            'description': skill_data.description if hasattr(skill_data, 'description') else None,
            'years_experience': skill_data.years_experience if hasattr(skill_data, 'years_experience') else None,
            'hourly_rate': skill_data.hourly_rate if hasattr(skill_data, 'hourly_rate') else None,
        }
        
        result = db.table('user_skills').update(update_data).eq('id', skill_id).execute()
        
        return {
            "message": "Skill updated successfully",
            "skill": result.data[0] if result.data else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating skill: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/user/{user_id}", response_model=List[SkillResponse])
async def get_user_skills(user_id: str):
    """Get all skills for a specific user"""
    try:
        db = get_db()
        
        result = db.table('user_skills').select('*').eq('user_id', user_id).execute()
        
        return result.data if result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching user skills: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    

@router.get("/recommendations", response_model=List[dict])
async def get_skill_recommendations(current_user_id: str = Depends(get_current_user)):
    """Get skill recommendations based on user's existing skills"""
    try:
        db = get_db()
        
        # Get user's current skills
        user_skills_result = db.table('user_skills').select('skill_name').eq('user_id', current_user_id).execute()
        
        if not user_skills_result.data:
            # If no skills, return popular beginner skills
            return [
                {"skill_name": "HTML", "category": "Web Development", "description": "Foundation of web development"},
                {"skill_name": "CSS", "category": "Web Development", "description": "Style and layout for websites"},
                {"skill_name": "Python", "category": "Programming", "description": "Versatile programming language"},
                {"skill_name": "JavaScript", "category": "Web Development", "description": "Interactive web programming"},
                {"skill_name": "Git", "category": "Development Tools", "description": "Version control system"}
            ]
        
        user_skills = [s['skill_name'].lower() for s in user_skills_result.data]
        
        # Skill recommendation mappings
        recommendations_map = {
            'html': ['CSS', 'JavaScript', 'React', 'Tailwind CSS'],
            'css': ['JavaScript', 'Sass', 'Tailwind CSS', 'Bootstrap'],
            'javascript': ['React', 'Node.js', 'TypeScript', 'Vue.js'],
            'python': ['Django', 'Flask', 'Machine Learning', 'Data Science'],
            'java': ['Spring Boot', 'Android Development', 'Kotlin'],
            'c': ['C++', 'Data Structures', 'Algorithms'],
            'c++': ['Data Structures', 'Algorithms', 'Game Development'],
            'react': ['Next.js', 'Redux', 'TypeScript', 'GraphQL'],
            'node.js': ['Express.js', 'MongoDB', 'PostgreSQL', 'GraphQL'],
            'sql': ['PostgreSQL', 'MySQL', 'Database Design'],
            'git': ['GitHub Actions', 'CI/CD', 'DevOps'],
        }
        
        # Collect all recommendations
        recommended_skills = set()
        for skill in user_skills:
            if skill in recommendations_map:
                recommended_skills.update(recommendations_map[skill])
        
        # Remove skills user already has
        recommended_skills = [s for s in recommended_skills if s.lower() not in user_skills]
        
        # Create recommendation objects
        recommendations = []
        for skill in list(recommended_skills)[:10]:  # Limit to 10
            recommendations.append({
                "skill_name": skill,
                "category": "Recommended",
                "description": f"Based on your existing skills"
            })
        
        return recommendations
    
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )