"""
Calendar Service - Manage calendar events for sessions
"""
from app.database import get_db
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

class CalendarService:
    """Service for managing calendar events"""
    
    @staticmethod
    def create_event_for_session(session_id: str) -> dict:
        """
        Create a calendar event for a learning session
        
        Args:
            session_id: ID of the learning session
            
        Returns:
            Dict with event details
        """
        try:
            db = get_db()
            
            # Get session details
            session_result = db.table('learning_sessions').select('*').eq('id', session_id).execute()
            
            if not session_result.data:
                raise ValueError("Session not found")
            
            session = session_result.data[0]
            
            # Get mentor and learner details
            mentor_result = db.table('users').select('username, full_name').eq('id', session['mentor_id']).execute()
            learner_result = db.table('users').select('username, full_name').eq('id', session['learner_id']).execute()
            
            mentor_name = mentor_result.data[0].get('full_name') or mentor_result.data[0].get('username') if mentor_result.data else 'Mentor'
            learner_name = learner_result.data[0].get('full_name') or learner_result.data[0].get('username') if learner_result.data else 'Learner'
            
            # Create event for mentor
            mentor_event = {
                'user_id': session['mentor_id'],
                'session_id': session_id,
                'event_title': f"Mentoring Session: {session['skill_name']} with {learner_name}",
                'event_description': f"Teach {session['skill_name']} to {learner_name}",
                'event_time': session['scheduled_at'],
                'duration_minutes': session.get('duration_minutes', 60),
                'reminder_sent': False,
                'calendar_link': CalendarService._generate_calendar_link(session, mentor_name, learner_name)
            }
            
            mentor_event_result = db.table('calendar_events').insert(mentor_event).execute()
            
            # Create event for learner
            learner_event = {
                'user_id': session['learner_id'],
                'session_id': session_id,
                'event_title': f"Learning Session: {session['skill_name']} with {mentor_name}",
                'event_description': f"Learn {session['skill_name']} from {mentor_name}",
                'event_time': session['scheduled_at'],
                'duration_minutes': session.get('duration_minutes', 60),
                'reminder_sent': False,
                'calendar_link': CalendarService._generate_calendar_link(session, mentor_name, learner_name)
            }
            
            learner_event_result = db.table('calendar_events').insert(learner_event).execute()
            
            logger.info(f"Created calendar events for session {session_id}")
            
            return {
                'success': True,
                'mentor_event': mentor_event_result.data[0],
                'learner_event': learner_event_result.data[0]
            }
            
        except Exception as e:
            logger.error(f"Error creating calendar event: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def _generate_calendar_link(session: dict, mentor_name: str, learner_name: str) -> str:
        """
        Generate Google Calendar add event link
        """
        try:
            # Parse datetime
            event_time = datetime.fromisoformat(session['scheduled_at'].replace('Z', '+00:00'))
            duration = session.get('duration_minutes', 60)
            end_time = event_time + timedelta(minutes=duration)
            
            # Format for Google Calendar
            start_str = event_time.strftime('%Y%m%dT%H%M%S')
            end_str = end_time.strftime('%Y%m%dT%H%M%S')
            
            title = f"TalentConnect Session: {session['skill_name']}"
            description = f"Learning session between {mentor_name} and {learner_name}"
            
            if session.get('meeting_link'):
                description += f"\n\nMeeting Link: {session['meeting_link']}"
            
            # Generate Google Calendar link - fixed to avoid backslash in f-string
            base_url = "https://calendar.google.com/calendar/render"
             # Escape description properly
            encoded_desc = description.replace(' ', '+').replace('', '%0A')
            
            # Replace newlines with %0A separately
            description_encoded = description.replace(' ', '+').replace('\n', '%0A')
            
            params = [
                f"action=TEMPLATE",
                f"text={title.replace(' ', '+')}",
                f"dates={start_str}/{end_str}",
                               f"details={encoded_desc}",
                f"sf=true",
                f"output=xml"
            ]
            
            return f"{base_url}?{'&'.join(params)}"
            
        except Exception as e:
            logger.error(f"Error generating calendar link: {str(e)}")
            return ""
    
    @staticmethod
    def get_user_events(user_id: str, upcoming_only: bool = True, limit: int = 20) -> List[Dict]:
        """
        Get calendar events for a user
        """
        try:
            db = get_db()
            
            query = db.table('calendar_events').select('*').eq('user_id', user_id)
            
            if upcoming_only:
                now = datetime.now().isoformat()
                query = query.gte('event_time', now)
            
            result = query.order('event_time', desc=False).limit(limit).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error getting user events: {str(e)}")
            return []
    
    @staticmethod
    def send_reminders() -> int:
        """
        Send reminders for upcoming events (to be called by a cron job)
        Returns number of reminders sent
        """
        try:
            db = get_db()
            
            # Get events happening in next hour that haven't been reminded
            now = datetime.now()
            one_hour_later = now + timedelta(hours=1)
            
            result = db.table('calendar_events').select('*').eq('reminder_sent', False).gte('event_time', now.isoformat()).lte('event_time', one_hour_later.isoformat()).execute()
            
            if not result.data:
                return 0
            
            reminders_sent = 0
            for event in result.data:
                # Here you would send actual notification/email
                # For now, just mark as sent
                db.table('calendar_events').update({'reminder_sent': True}).eq('id', event['id']).execute()
                
                # Also create a notification
                db.table('notifications').insert({
                    'user_id': event['user_id'],
                    'type': 'session_reminder',
                    'title': 'Upcoming Session Reminder',
                    'message': f"Your session '{event['event_title']}' starts soon!",
                    'read': False
                }).execute()
                
                reminders_sent += 1
            
            logger.info(f"Sent {reminders_sent} calendar reminders")
            return reminders_sent
            
        except Exception as e:
            logger.error(f"Error sending reminders: {str(e)}")
            return 0
    
    @staticmethod
    def delete_event(event_id: str, user_id: str) -> bool:
        """Delete a calendar event"""
        try:
            db = get_db()
            
            # Verify event belongs to user
            event_result = db.table('calendar_events').select('*').eq('id', event_id).eq('user_id', user_id).execute()
            
            if not event_result.data:
                return False
            
            db.table('calendar_events').delete().eq('id', event_id).execute()
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting event: {str(e)}")
            return False


calendar_service = CalendarService()