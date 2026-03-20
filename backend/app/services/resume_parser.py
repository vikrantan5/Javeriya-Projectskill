"""
Resume Parser Service - Extract skills from PDF/DOCX resumes using keyword matching
"""
import PyPDF2
import docx
import re
import logging
from typing import List, Set
import io

logger = logging.getLogger(__name__)

class ResumeParser:
    """Service for parsing resumes and extracting skills"""
    
    # Comprehensive skill keywords database
    PROGRAMMING_LANGUAGES = {
        'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'php', 
        'swift', 'kotlin', 'go', 'rust', 'scala', 'r', 'matlab', 'perl', 'dart',
        'objective-c', 'shell', 'bash', 'powershell', 'sql', 'html', 'css'
    }
    
    FRAMEWORKS = {
        'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt', 'django', 'flask',
        'fastapi', 'express', 'spring', 'spring boot', 'laravel', 'rails', 'asp.net',
        'node.js', 'react native', 'flutter', 'ionic', 'electron', 'tensorflow',
        'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'bootstrap', 'tailwind'
    }
    
    DATABASES = {
        'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server',
        'cassandra', 'elasticsearch', 'dynamodb', 'firebase', 'supabase', 'mariadb',
        'couchdb', 'neo4j', 'influxdb'
    }
    
    TOOLS = {
        'git', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github', 'aws', 'azure',
        'gcp', 'terraform', 'ansible', 'vagrant', 'nginx', 'apache', 'linux', 'unix',
        'jira', 'confluence', 'slack', 'trello', 'figma', 'sketch', 'photoshop',
        'illustrator', 'postman', 'swagger', 'vs code', 'intellij', 'eclipse'
    }
    
    SOFT_SKILLS = {
        'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
        'time management', 'project management', 'agile', 'scrum', 'collaboration',
        'presentation', 'public speaking', 'mentoring', 'teaching', 'research'
    }
    
    OTHER_SKILLS = {
        'machine learning', 'deep learning', 'artificial intelligence', 'data science',
        'data analysis', 'data visualization', 'web development', 'mobile development',
        'backend development', 'frontend development', 'full stack', 'devops', 'ci/cd',
        'rest api', 'graphql', 'microservices', 'cloud computing', 'cybersecurity',
        'blockchain', 'iot', 'ar/vr', 'game development', 'ui/ux design', 'seo', 'digital marketing'
    }
    
    def __init__(self):
        """Initialize the resume parser with skill database"""
        self.all_skills = (
            self.PROGRAMMING_LANGUAGES | 
            self.FRAMEWORKS | 
            self.DATABASES | 
            self.TOOLS | 
            self.SOFT_SKILLS | 
            self.OTHER_SKILLS
        )
    
    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        """Extract text from PDF file"""
        try:
            pdf_file = io.BytesIO(file_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + " "
            
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise ValueError("Failed to extract text from PDF")
    
    def extract_text_from_docx(self, file_bytes: bytes) -> str:
        """Extract text from DOCX file"""
        try:
            doc_file = io.BytesIO(file_bytes)
            doc = docx.Document(doc_file)
            
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + " "
            
            return text
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {str(e)}")
            raise ValueError("Failed to extract text from DOCX")
    
    def extract_skills_from_text(self, text: str) -> List[str]:
        """
       Extract skills from text using keyword matching
        
        Args:
            text: Resume text content
            
        Returns:
            List of identified skills
        """
        try:
            # Convert text to lowercase for matching
            text_lower = text.lower()
            
            # Find skills using keyword matching
            found_skills: Set[str] = set()
            
            # Direct keyword matching
            for skill in self.all_skills:
                # Use word boundaries to avoid partial matches
                  pattern = r'b' + re.escape(skill.lower()) + r'b'
                  if re.search(pattern, text_lower):
                    found_skills.add(skill.title())
            
       
            
            # Sort and return skills
            return sorted(list(found_skills))
            
        except Exception as e:
            logger.error(f"Error extracting skills: {str(e)}")
            return []
    
    def parse_resume(self, file_bytes: bytes, filename: str) -> dict:
        """
        Parse resume file and extract skills
        
        Args:
            file_bytes: Binary content of the file
            filename: Name of the file
            
        Returns:
            Dict with extracted skills and metadata
        """
        try:
            # Determine file type and extract text
            file_extension = filename.lower().split('.')[-1]
            
            if file_extension == 'pdf':
                text = self.extract_text_from_pdf(file_bytes)
            elif file_extension in ['docx', 'doc']:
                text = self.extract_text_from_docx(file_bytes)
            else:
                raise ValueError(f"Unsupported file format: {file_extension}")
            
            # Extract skills from text
            skills = self.extract_skills_from_text(text)
            
            # Categorize skills
            categorized_skills = {
                'programming_languages': [s for s in skills if s.lower() in self.PROGRAMMING_LANGUAGES],
                'frameworks': [s for s in skills if s.lower() in self.FRAMEWORKS],
                'databases': [s for s in skills if s.lower() in self.DATABASES],
                'tools': [s for s in skills if s.lower() in self.TOOLS],
                'soft_skills': [s for s in skills if s.lower() in self.SOFT_SKILLS],
                'other_skills': [s for s in skills if s.lower() in self.OTHER_SKILLS]
            }
            
            return {
                'success': True,
                'total_skills_found': len(skills),
                'skills': skills,
                'categorized_skills': categorized_skills,
                'text_length': len(text),
                'filename': filename
            }
            
        except Exception as e:
            logger.error(f"Error parsing resume: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'filename': filename
            }


# Initialize parser instance
resume_parser = ResumeParser()
