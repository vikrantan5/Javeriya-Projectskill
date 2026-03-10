"""
Plagiarism Detection Service - Detect copied content in task submissions
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import logging
from typing import List, Dict
from app.database import get_db

logger = logging.getLogger(__name__)

class PlagiarismDetector:
    """Service for detecting plagiarism in task submissions"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
        self.similarity_threshold = 0.85  # 85% similarity = flagged
    
    def check_submission(self, submission_id: str, submission_text: str) -> Dict:
        """
        Check a submission for plagiarism against other submissions
        
        Args:
            submission_id: ID of the submission to check
            submission_text: Text content of the submission
            
        Returns:
            Dict with plagiarism detection results
        """
        try:
            db = get_db()
            
            # Get all other submissions for comparison
            all_submissions_result = db.table('task_submissions').select('id, submission_text, task_id').execute()
            
            if not all_submissions_result.data or len(all_submissions_result.data) < 2:
                return {
                    'flagged': False,
                    'similarity_score': 0.0,
                    'matched_sources': [],
                    'message': 'Not enough data for comparison'
                }
            
            # Prepare texts for comparison
            texts = [submission_text]
            submission_ids = [submission_id]
            
            for sub in all_submissions_result.data:
                if sub['id'] != submission_id and sub.get('submission_text'):
                    texts.append(sub['submission_text'])
                    submission_ids.append(sub['id'])
            
            if len(texts) < 2:
                return {
                    'flagged': False,
                    'similarity_score': 0.0,
                    'matched_sources': [],
                    'message': 'No other submissions to compare'
                }
            
            # Calculate TF-IDF and cosine similarity
            tfidf_matrix = self.vectorizer.fit_transform(texts)
            
            # Compare with all other submissions
            similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]
            
            # Find high similarity matches
            matched_sources = []
            max_similarity = 0.0
            
            for idx, similarity in enumerate(similarities):
                if similarity > self.similarity_threshold:
                    matched_sources.append({
                        'submission_id': submission_ids[idx + 1],
                        'similarity': round(float(similarity) * 100, 2)
                    })
                
                if similarity > max_similarity:
                    max_similarity = similarity
            
            flagged = max_similarity > self.similarity_threshold
            
            # Save plagiarism report
            report = {
                'submission_id': submission_id,
                'similarity_score': round(float(max_similarity) * 100, 2),
                'flagged': flagged,
                'matched_sources': [m['submission_id'] for m in matched_sources],
                'detection_method': 'tfidf_cosine_similarity',
                'reviewed': False
            }
            
            db.table('plagiarism_reports').insert(report).execute()
            
            logger.info(f"Plagiarism check for submission {submission_id}: {'FLAGGED' if flagged else 'CLEAN'}")
            
            return {
                'flagged': flagged,
                'similarity_score': round(float(max_similarity) * 100, 2),
                'matched_sources': matched_sources,
                'message': 'High similarity detected' if flagged else 'No plagiarism detected',
                'detection_method': 'TF-IDF + Cosine Similarity'
            }
            
        except Exception as e:
            logger.error(f"Error checking plagiarism: {str(e)}")
            return {
                'flagged': False,
                'similarity_score': 0.0,
                'matched_sources': [],
                'error': str(e)
            }
    
    def get_flagged_submissions(self, limit: int = 50) -> List[Dict]:
        """Get all flagged submissions"""
        try:
            db = get_db()
            
            result = db.table('plagiarism_reports').select('*').eq('flagged', True).eq('reviewed', False).order('created_at', desc=True).limit(limit).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error getting flagged submissions: {str(e)}")
            return []
    
    def review_report(self, report_id: str, admin_notes: str) -> bool:
        """Mark a plagiarism report as reviewed"""
        try:
            db = get_db()
            
            db.table('plagiarism_reports').update({
                'reviewed': True,
                'admin_notes': admin_notes
            }).eq('id', report_id).execute()
            
            return True
            
        except Exception as e:
            logger.error(f"Error reviewing report: {str(e)}")
            return False


plagiarism_detector = PlagiarismDetector()
