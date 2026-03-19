"""
AI Assignment Decision Service
Uses Groq AI and rule-based scoring to recommend whether to assign a task to a user
"""
from app.database import get_db
from app.services.user_stats_service import user_stats_service
from app.ai.groq_service import groq_service
from app.config import settings
import logging
from typing import Dict, Optional
import json

logger = logging.getLogger(__name__)

class AIAssignmentService:
    """Service for AI-powered assignment decisions"""
    
    def calculate_skill_match_score(self, user_skills: list, task_requirements: Dict) -> float:
        """Calculate how well user's skills match task requirements"""
        try:
            task_subject = task_requirements.get('subject', '').lower()
            task_title = task_requirements.get('title', '').lower()
            task_desc = task_requirements.get('description', '').lower()
            
            # Combine task text for matching
            task_text = f"{task_subject} {task_title} {task_desc}"
            
            # Count skill matches
            matched_skills = 0
            for skill in user_skills:
                skill_name = skill.get('skill_name', '').lower()
                if skill_name in task_text:
                    matched_skills += 1
                    # Bonus for verified skills
                    if skill.get('is_verified'):
                        matched_skills += 0.5
            
            # Calculate percentage (max 100%)
            if len(user_skills) == 0:
                return 0
            
            score = min((matched_skills / len(user_skills)) * 100, 100)
            return round(score, 1)
            
        except Exception as e:
            logger.error(f"Error calculating skill match: {str(e)}")
            return 0
    
    def calculate_reliability_score(self, stats: Dict) -> float:
        """Calculate reliability score based on user statistics"""
        try:
            score = 0
            
            # Success rate (40 points)
            success_rate = stats.get('success_rate', 0)
            score += (success_rate / 100) * 40
            
            # On-time delivery (30 points)
            on_time_percentage = stats.get('on_time_percentage', 0)
            score += (on_time_percentage / 100) * 30
            
            # Rating (20 points)
            avg_rating = stats.get('avg_rating', 0)
            score += (avg_rating / 5) * 20
            
            # Experience bonus (10 points)
            tasks_completed = stats.get('tasks_completed', 0)
            if tasks_completed >= 20:
                score += 10
            elif tasks_completed >= 10:
                score += 7
            elif tasks_completed >= 5:
                score += 5
            elif tasks_completed >= 1:
                score += 3
            
            return round(score, 1)
            
        except Exception as e:
            logger.error(f"Error calculating reliability score: {str(e)}")
            return 0
    
    async def get_assignment_recommendation(
        self,
        task_id: str,
        user_id: str,
        task_creator_id: str
    ) -> Dict:
        """
        Get AI-powered recommendation for assigning a task to a user
        
        Returns:
            {
                "decision": "recommended" | "not_recommended" | "neutral",
                "confidence": 0-100,
                "overall_score": 0-100,
                "breakdown": {
                    "skill_match_score": 0-100,
                    "reliability_score": 0-100,
                    "rating_score": 0-100
                },
                "reason": "Human-readable explanation",
                "ai_analysis": "Optional AI-generated analysis",
                "flags": ["warning1", "warning2"],
                "strengths": ["strength1", "strength2"]
            }
        """
        try:
            db = get_db()
            
            # Get task details
            task_result = db.table('tasks').select('*').eq('id', task_id).execute()
            if not task_result.data:
                raise ValueError("Task not found")
            
            task = task_result.data[0]
            
            # Verify requester is the task creator
            if task['creator_id'] != task_creator_id:
                raise ValueError("Only task creator can request AI recommendation")
            
            # Get user statistics
            user_stats = user_stats_service.get_user_statistics(user_id)
            if not user_stats:
                raise ValueError("User not found")
            
            # Calculate scores
            skill_match_score = self.calculate_skill_match_score(
                user_stats['skills'],
                {
                    'subject': task.get('subject', ''),
                    'title': task.get('title', ''),
                    'description': task.get('description', '')
                }
            )
            
            reliability_score = self.calculate_reliability_score(user_stats)
            
            rating_score = (user_stats['avg_rating'] / 5) * 100 if user_stats['avg_rating'] > 0 else 0
            
            # Calculate overall score (weighted average)
            overall_score = (
                skill_match_score * 0.4 +  # 40% weight on skill match
                reliability_score * 0.35 +  # 35% weight on reliability
                rating_score * 0.25  # 25% weight on rating
            )
            
            # Determine decision
            decision = "neutral"
            if overall_score >= 70:
                decision = "recommended"
            elif overall_score < 50:
                decision = "not_recommended"
            
            # Identify flags and strengths
            flags = []
            strengths = []
            
            # Flags
            if user_stats['late_submissions'] > 3:
                flags.append(f"Multiple late submissions ({user_stats['late_submissions']})")
            
            if user_stats['success_rate'] < 70 and user_stats['tasks_completed'] > 2:
                flags.append(f"Low success rate ({user_stats['success_rate']}%)")
            
            if user_stats['avg_rating'] < 3.5 and user_stats['total_reviews'] > 3:
                flags.append(f"Below average rating ({user_stats['avg_rating']}/5)")
            
            if user_stats['tasks_completed'] == 0:
                flags.append("No completed tasks (new user)")
            
            # Strengths
            if user_stats['on_time_percentage'] >= 90:
                strengths.append(f"Excellent on-time delivery ({user_stats['on_time_percentage']}%)")
            
            if user_stats['avg_rating'] >= 4.5:
                strengths.append(f"Outstanding rating ({user_stats['avg_rating']}/5)")
            
            if user_stats['success_rate'] >= 90:
                strengths.append(f"High success rate ({user_stats['success_rate']}%)")
            
            if skill_match_score >= 70:
                strengths.append(f"Strong skill match ({skill_match_score}%)")
            
            if user_stats['tasks_completed'] >= 10:
                strengths.append(f"Experienced ({user_stats['tasks_completed']} tasks completed)")
            
            # Generate reason
            reason = self._generate_reason(
                decision,
                overall_score,
                user_stats,
                skill_match_score,
                flags,
                strengths
            )
            
            # Get AI analysis (optional enhancement with Groq)
            ai_analysis = await self._get_groq_analysis(
                task,
                user_stats,
                overall_score,
                flags,
                strengths
            )
            
            return {
                "decision": decision,
                "confidence": round(overall_score, 1),
                "overall_score": round(overall_score, 1),
                "breakdown": {
                    "skill_match_score": round(skill_match_score, 1),
                    "reliability_score": round(reliability_score, 1),
                    "rating_score": round(rating_score, 1)
                },
                "reason": reason,
                "ai_analysis": ai_analysis,
                "flags": flags,
                "strengths": strengths,
                "user_stats_summary": {
                    "tasks_completed": user_stats['tasks_completed'],
                    "success_rate": user_stats['success_rate'],
                    "avg_rating": user_stats['avg_rating'],
                    "on_time_percentage": user_stats['on_time_percentage']
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting assignment recommendation: {str(e)}")
            raise
    
    def _generate_reason(
        self,
        decision: str,
        score: float,
        stats: Dict,
        skill_match: float,
        flags: list,
        strengths: list
    ) -> str:
        """Generate human-readable reason for decision"""
        
        if decision == "recommended":
            reason = f"✅ RECOMMENDED (Score: {score:.0f}/100)\n"
            
            if strengths:
                reason += "**Strengths:**\n"
                for strength in strengths:
                    reason += f"• {strength}\n"
            
            if flags:
                reason += "\n**Minor Concerns:**\n"
                for flag in flags:
                    reason += f"• {flag}\n"
            
            reason += f"\n**Summary:** This user shows strong capabilities with {stats['tasks_completed']} completed tasks and a {stats['success_rate']}% success rate."
            
        elif decision == "not_recommended":
            reason = f"⚠️ NOT RECOMMENDED (Score: {score:.0f}/100)\n\n"
            
            if flags:
                reason += "**Concerns:**\n"
                for flag in flags:
                    reason += f"• {flag}\n"
            
            if strengths:
                reason += "\n**Positive Aspects:**\n"
                for strength in strengths:
                    reason += f"• {strength}\n"
            
            reason += f"\n**Summary:** Consider other candidates with stronger track records or better skill alignment."
            
        else:  # neutral
            reason = f"⚖️ NEUTRAL (Score: {score:.0f}/100)\n\n"
            reason += "**Assessment:** This user has mixed indicators. "
            
            if stats['tasks_completed'] == 0:
                reason += "As a new user, there's limited history to evaluate. Consider this if you're willing to work with someone building their reputation."
            else:
                reason += f"With {stats['tasks_completed']} completed tasks and {stats['avg_rating']:.1f}/5 rating, they show moderate capability. Review their profile and make a decision based on your comfort level."
        
        return reason
    
    async def _get_groq_analysis(
        self,
        task: Dict,
        user_stats: Dict,
        score: float,
        flags: list,
        strengths: list
    ) -> Optional[str]:
        """Get additional AI analysis from Groq (optional enhancement)"""
        try:
            # Prepare context for AI
            context = f"""
Analyze this assignment decision:

**Task:** {task.get('title')}
**Task Description:** {task.get('description', '')[:200]}
**Task Difficulty:** {task.get('difficulty_level', 'Not specified')}

**Candidate Statistics:**
- Completed Tasks: {user_stats['tasks_completed']}
- Success Rate: {user_stats['success_rate']}%
- Average Rating: {user_stats['avg_rating']}/5
- On-time Delivery: {user_stats['on_time_percentage']}%
- Late Submissions: {user_stats['late_submissions']}

**Overall Recommendation Score:** {score}/100

**Strengths:** {', '.join(strengths) if strengths else 'None identified'}
**Concerns:** {', '.join(flags) if flags else 'None identified'}

Provide a brief 2-3 sentence professional assessment focusing on whether this candidate is suitable for the task.
"""
            
            # Call Groq API
            response = await groq_chat(context, session_id=None)
            
            return response.get('response', '')
            
        except Exception as e:
            logger.error(f"Error getting Groq analysis: {str(e)}")
            return None

    async def rank_multiple_candidates(
        self,
        task_id: str,
        applicant_ids: list,
        task_creator_id: str
    ) -> Dict:
        """
        Rank multiple candidates for a task
        
        Returns:
            {
                "rankings": [
                    {
                        "user_id": "...",
                        "rank": 1,
                        "score": 85,
                        "decision": "recommended",
                        "is_best_match": True,
                        "highlights": ["strength1", "strength2"]
                    },
                    ...
                ],
                "best_match_id": "user_id",
                "recommendation": "Detailed comparison and recommendation"
            }
        """
        try:
            # Get recommendations for all applicants
            candidates = []
            
            for applicant_id in applicant_ids:
                try:
                    recommendation = await self.get_assignment_recommendation(
                        task_id,
                        applicant_id,
                        task_creator_id
                    )
                    
                    candidates.append({
                        "user_id": applicant_id,
                        "score": recommendation['overall_score'],
                        "decision": recommendation['decision'],
                        "confidence": recommendation['confidence'],
                        "strengths": recommendation['strengths'],
                        "flags": recommendation['flags'],
                        "breakdown": recommendation['breakdown']
                    })
                except Exception as e:
                    logger.error(f"Error getting recommendation for {applicant_id}: {str(e)}")
                    continue
            
            # Sort by score (descending)
            candidates.sort(key=lambda x: x['score'], reverse=True)
            
            # Assign ranks and identify best match
            rankings = []
            best_match_id = None
            
            for rank, candidate in enumerate(candidates, 1):
                is_best_match = rank == 1 and candidate['score'] >= 70
                
                if is_best_match:
                    best_match_id = candidate['user_id']
                
                rankings.append({
                    "user_id": candidate['user_id'],
                    "rank": rank,
                    "score": candidate['score'],
                    "decision": candidate['decision'],
                    "confidence": candidate['confidence'],
                    "is_best_match": is_best_match,
                    "highlights": candidate['strengths'][:3],  # Top 3 strengths
                    "concerns": candidate['flags'][:2],  # Top 2 concerns
                    "breakdown": candidate['breakdown']
                })
            
            # Generate comparison summary
            comparison = self._generate_comparison_summary(rankings)
            
            return {
                "rankings": rankings,
                "best_match_id": best_match_id,
                "total_candidates": len(rankings),
                "recommendation": comparison
            }
            
        except Exception as e:
            logger.error(f"Error ranking candidates: {str(e)}")
            raise
    
    def _generate_comparison_summary(self, rankings: list) -> str:
        """Generate human-readable comparison of candidates"""
        if not rankings:
            return "No candidates to compare"
        
        summary = "**Candidate Ranking Summary:**\n\n"
        
        # Best match
        if rankings[0]['is_best_match']:
            summary += f"🏆 **Best Match**: Candidate #{1} (Score: {rankings[0]['score']:.0f}/100)\n"
            summary += f"   Standout qualities: {', '.join(rankings[0]['highlights'][:2])}\n\n"
        
        # Top 3
        summary += "**Top Candidates:**\n"
        for i, candidate in enumerate(rankings[:3], 1):
            emoji = "🥇" if i == 1 else "🥈" if i == 2 else "🥉"
            summary += f"{emoji} **Rank {i}**: Score {candidate['score']:.0f}/100 - {candidate['decision'].replace('_', ' ').title()}\n"
            if candidate['highlights']:
                summary += f"   Strengths: {', '.join(candidate['highlights'][:2])}\n"
            if candidate['concerns']:
                summary += f"   Concerns: {', '.join(candidate['concerns'])}\n"
            summary += "\n"
        
        # Overall recommendation
        if len(rankings) > 3:
            summary += f"**Note**: {len(rankings) - 3} additional candidate(s) evaluated with lower scores.\n"
        
        return summary

ai_assignment_service = AIAssignmentService()