"""
Google Calendar Service - Manage calendar events with Google Meet integration
"""
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from datetime import datetime, timedelta
import logging
import os
import uuid

logger = logging.getLogger(__name__)

# Google Calendar API Scopes
SCOPES = ['https://www.googleapis.com/auth/calendar']

class GoogleCalendarService:
    """Service for managing Google Calendar events with Meet integration"""
    
    def __init__(self):
        """Initialize Google Calendar service with credentials"""
        try:
            # Get private key from environment and properly format it
            private_key = os.getenv('GOOGLE_PRIVATE_KEY', '')
            
            # Replace escaped newlines with actual newlines
            # Handle both string literals and actual newlines
            if private_key:
                private_key = private_key.replace('\\n', '\n')
            
            # Build credentials from environment variables
            credentials_info = {
                "type": "service_account",
                "project_id": os.getenv('GOOGLE_PROJECT_ID'),
                "private_key_id": os.getenv('GOOGLE_PRIVATE_KEY_ID'),
                "private_key": private_key,
                "client_email": os.getenv('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
                "client_id": os.getenv('GOOGLE_CLIENT_ID'),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{os.getenv('GOOGLE_SERVICE_ACCOUNT_EMAIL')}"
            }
            
            self.credentials = service_account.Credentials.from_service_account_info(
                credentials_info,
                scopes=SCOPES
            )
            
            self.calendar_service = build('calendar', 'v3', credentials=self.credentials)
            self.calendar_id = os.getenv('GOOGLE_CALENDAR_ID')
            
            logger.info("Google Calendar service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Calendar service: {str(e)}")
            raise
    
    def create_meeting_event(
        self,
        summary: str,
        description: str,
        start_datetime: datetime,
        duration_minutes: int,
        attendee_emails: list,
        timezone: str = 'UTC'
    ) -> dict:
        """
        Create a calendar event with Google Meet link
        
        Args:
            summary: Event title
            description: Event description
            start_datetime: Event start datetime
            duration_minutes: Duration in minutes
            attendee_emails: List of attendee email addresses
            timezone: Timezone for the event
            
        Returns:
            Dict with event details including meeting link
        """
        try:
            # Calculate end time
            end_datetime = start_datetime + timedelta(minutes=duration_minutes)
            
            # Format datetime for Google Calendar API
            start_str = start_datetime.isoformat()
            end_str = end_datetime.isoformat()
            
            # Build event object
              # Note: We store attendee emails but don't send automatic Google invites
            # to avoid \"Domain-Wide Delegation\" requirement. 
            # Invites will be sent through the app's own email service.
            event = {
    'summary': summary,
    'description': description,
    'start': {
        'dateTime': start_str,
        'timeZone': timezone,
    },
    'end': {
        'dateTime': end_str,
        'timeZone': timezone,
    },
   'conferenceData': {
    'createRequest': {
        'requestId': str(uuid.uuid4())
    }
},
    'reminders': {
        'useDefault': False,
        'overrides': [
            {'method': 'popup', 'minutes': 60},
            {'method': 'popup', 'minutes': 10},
        ],
    },
    'guestsCanModify': False,
    'guestsCanInviteOthers': False,
    'guestsCanSeeOtherGuests': True,
}
            
            # Create the event
              # sendUpdates='none' - Don't send automatic Google Calendar invites
            # The app will send meeting notifications via its own email service
            created_event = self.calendar_service.events().insert(
                calendarId=self.calendar_id,
                body=event,
                conferenceDataVersion=1,  # Required for Google Meet
                    sendUpdates='none'  # Don't send Google Calendar invites (avoids Domain-Wide Delegation requirement)
            ).execute()
            
            # Extract meeting link
            meeting_link = None
            if 'conferenceData' in created_event and 'entryPoints' in created_event['conferenceData']:
                for entry_point in created_event['conferenceData']['entryPoints']:
                    if entry_point['entryPointType'] == 'video':
                        meeting_link = entry_point['uri']
                        break
            
            logger.info(f"Created calendar event: {created_event['id']} with Meet link: {meeting_link}")
            
            return {
                'success': True,
                'event_id': created_event['id'],
                'meeting_link': meeting_link,
                'event_link': created_event.get('htmlLink'),
                'hangout_link': created_event.get('hangoutLink'),
                'created_at': created_event.get('created'),
                'summary': created_event.get('summary'),
                   'attendees': attendee_emails,  # Return attendees so app can send notifications
            }
            
        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            return {
                'success': False,
                'error': str(error)
            }
        except Exception as e:
            logger.error(f"Error creating calendar event: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_event(
        self,
        event_id: str,
        summary: str = None,
        description: str = None,
        start_datetime: datetime = None,
        duration_minutes: int = None,
        timezone: str = 'UTC'
    ) -> dict:
        """
        Update an existing calendar event
        
        Args:
            event_id: Google Calendar event ID
            summary: New event title
            description: New event description
            start_datetime: New start datetime
            duration_minutes: New duration in minutes
            timezone: Timezone for the event
            
        Returns:
            Dict with update status
        """
        try:
            # Get existing event
            event = self.calendar_service.events().get(
                calendarId=self.calendar_id,
                eventId=event_id
            ).execute()
            
            # Update fields if provided
            if summary:
                event['summary'] = summary
            if description:
                event['description'] = description
            if start_datetime and duration_minutes:
                end_datetime = start_datetime + timedelta(minutes=duration_minutes)
                event['start'] = {
                    'dateTime': start_datetime.isoformat(),
                    'timeZone': timezone,
                }
                event['end'] = {
                    'dateTime': end_datetime.isoformat(),
                    'timeZone': timezone,
                }
            
            # Update the event
                # sendUpdates='none' - App handles notifications via its own email service
            updated_event = self.calendar_service.events().update(
                calendarId=self.calendar_id,
                eventId=event_id,
                body=event,
                   sendUpdates='none'
            ).execute()
            
            logger.info(f"Updated calendar event: {event_id}")
            
            return {
                'success': True,
                'event_id': updated_event['id'],
                'updated_at': updated_event.get('updated'),
            }
            
        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            return {
                'success': False,
                'error': str(error)
            }
        except Exception as e:
            logger.error(f"Error updating calendar event: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_event(self, event_id: str) -> dict:
        """
        Delete a calendar event
        
        Args:
            event_id: Google Calendar event ID
            
        Returns:
            Dict with deletion status
        """
        try:
            # Delete the event
            # sendUpdates='none' - App handles notifications via its own email service
            self.calendar_service.events().delete(
                calendarId=self.calendar_id,
                eventId=event_id,
                sendUpdates='none'
            ).execute()
            
            logger.info(f"Deleted calendar event: {event_id}")
            
            return {
                'success': True,
                'event_id': event_id,
            }
            
        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            return {
                'success': False,
                'error': str(error)
            }
        except Exception as e:
            logger.error(f"Error deleting calendar event: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_event(self, event_id: str) -> dict:
        """
        Get details of a calendar event
        
        Args:
            event_id: Google Calendar event ID
            
        Returns:
            Dict with event details
        """
        try:
            event = self.calendar_service.events().get(
                calendarId=self.calendar_id,
                eventId=event_id
            ).execute()
            
            # Extract meeting link
            meeting_link = None
            if 'conferenceData' in event and 'entryPoints' in event['conferenceData']:
                for entry_point in event['conferenceData']['entryPoints']:
                    if entry_point['entryPointType'] == 'video':
                        meeting_link = entry_point['uri']
                        break
            
            return {
                'success': True,
                'event_id': event['id'],
                'summary': event.get('summary'),
                'description': event.get('description'),
                'start': event.get('start'),
                'end': event.get('end'),
                'meeting_link': meeting_link,
                'event_link': event.get('htmlLink'),
                'attendees': event.get('attendees', []),
            }
            
        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            return {
                'success': False,
                'error': str(error)
            }
        except Exception as e:
            logger.error(f"Error getting calendar event: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


# Singleton instance
google_calendar_service = GoogleCalendarService()