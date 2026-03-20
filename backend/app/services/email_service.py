from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.config import settings
import logging
import asyncio

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        self.from_email = settings.DEFAULT_FROM_EMAIL
    
    async def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send email using SendGrid"""
        try:
            message = Mail(
                from_email=self.from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )
            response = self.sg.send(message)
            logger.info(f"Email sent to {to_email}: Status {response.status_code}")
            return response.status_code == 202
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    async def send_welcome_email(self, to_email: str, username: str) -> bool:
        """Send welcome email to new user"""
        subject = f"Welcome to {settings.APP_NAME}!"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #4f46e5;">Welcome to TalentConnect, {username}!</h2>
                <p>Thank you for joining our peer-to-peer learning community.</p>
                <p>Here's what you can do on TalentConnect:</p>
                <ul>
                    <li>🎯 Exchange skills with fellow students</li>
                    <li>📚 Request mentorship sessions</li>
                    <li>💰 Offer or accept paid academic tasks</li>
                    <li>🤖 Get AI-powered learning recommendations</li>
                </ul>
                <p>Start by completing your profile and listing your skills!</p>
                <br>
                <p>Best regards,<br>The TalentConnect Team</p>
            </body>
        </html>
        """
        return await self.send_email(to_email, subject, html_content)
    
    async def send_session_request_email(self, to_email: str, sender_name: str, skill: str) -> bool:
        """Send email notification for session request"""
        subject = f"New Session Request from {sender_name}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #4f46e5;">You have a new session request!</h2>
                <p><strong>{sender_name}</strong> wants to learn <strong>{skill}</strong> from you.</p>
                <p>Log in to TalentConnect to view details and respond to this request.</p>
                <br>
                <p>Best regards,<br>The TalentConnect Team</p>
            </body>
        </html>
        """
        return await self.send_email(to_email, subject, html_content)
    
    async def send_task_notification_email(self, to_email: str, task_title: str, action: str) -> bool:
        """Send email notification for task updates"""
        subject = f"Task Update: {task_title}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #4f46e5;">Task Update</h2>
                <p>The task "<strong>{task_title}</strong>" has been {action}.</p>
                <p>Log in to TalentConnect to view details.</p>
                <br>
                <p>Best regards,<br>The TalentConnect Team</p>
            </body>
        </html>
        """
        return await self.send_email(to_email, subject, html_content)
    
    async def send_payment_confirmation_email(self, to_email: str, amount: float, task_title: str) -> bool:
        """Send payment confirmation email"""
        subject = "Payment Received - TalentConnect"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #22c55e;">Payment Received!</h2>
                <p>We've received your payment of <strong>₹{amount}</strong> for the task:</p>
                <p><strong>{task_title}</strong></p>
                <p>The payment is held in escrow and will be released upon task completion.</p>
                <br>
                <p>Best regards,<br>The TalentConnect Team</p>
            </body>
        </html>
        """
        return await self.send_email(to_email, subject, html_content)
    
    async def send_session_scheduled_email_async(
        self,
        to_email: str,
        to_name: str,
        meeting_topic: str,
        meeting_date: str,
        meeting_link: str,
        other_participant_name: str
    ) -> bool:
        """Send meeting scheduled notification email"""
        subject = f"📅 Skill Exchange Session Scheduled - {meeting_topic}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">📅 Session Scheduled!</h1>
                </div>
                
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 16px; color: #111827;">Hi <strong>{to_name}</strong>,</p>
                    
                    <p style="font-size: 16px; color: #374151;">
                        Great news! Your skill exchange session has been scheduled with <strong>{other_participant_name}</strong>.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                        <h2 style="color: #111827; margin-top: 0; font-size: 18px;">📌 Session Details</h2>
                        <p style="margin: 10px 0;"><strong>Topic:</strong> {meeting_topic}</p>
                        <p style="margin: 10px 0;"><strong>Date & Time:</strong> {meeting_date}</p>
                        <p style="margin: 10px 0;"><strong>With:</strong> {other_participant_name}</p>
                    </div>
                    
                    <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                        <h3 style="color: #065f46; margin-top: 0; font-size: 16px;">🎥 Join Your Meeting</h3>
                        <p style="color: #047857;">Click the link below to join the Google Meet session:</p>
                        <div style="text-align: center; margin: 15px 0;">
                            <a href="{meeting_link}" 
                               style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                                Join Google Meet
                            </a>
                        </div>
                        <p style="color: #059669; font-size: 14px; margin-top: 15px;">
                            💡 <strong>Tip:</strong> This link is also added to your Google Calendar. Check your calendar for automatic reminders!
                        </p>
                    </div>
                    
                    <div style="background: #fff7ed; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                        <p style="color: #92400e; margin: 0; font-size: 14px;">
                            <strong>⏰ Important:</strong> You'll receive calendar invitations via email with automatic reminders 1 day and 1 hour before the session.
                        </p>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                        If you need to reschedule or have any questions, please log in to TalentConnect.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    
                    <p style="font-size: 14px; color: #6b7280;">
                        Best regards,<br>
                        <strong>The TalentConnect Team</strong>
                    </p>
                </div>
            </body>
        </html>
        """
        return await self.send_email(to_email, subject, html_content)

# Create single instance
email_service = EmailService()

# Synchronous wrapper for compatibility
def send_session_scheduled_email(
    to_email: str,
    to_name: str,
    meeting_topic: str,
    meeting_date: str,
    meeting_link: str,
    other_participant_name: str
) -> bool:
    """Synchronous wrapper for sending session scheduled email"""
    try:
        # Try to get existing event loop
        loop = asyncio.get_running_loop()
    except RuntimeError:
        # No running loop, create new one
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            email_service.send_session_scheduled_email_async(
                to_email=to_email,
                to_name=to_name,
                meeting_topic=meeting_topic,
                meeting_date=meeting_date,
                meeting_link=meeting_link,
                other_participant_name=other_participant_name
            )
        )
        loop.close()
        return result
    else:
        # Running in async context
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(
                asyncio.run_coroutine_threadsafe,
                email_service.send_session_scheduled_email_async(
                    to_email=to_email,
                    to_name=to_name,
                    meeting_topic=meeting_topic,
                    meeting_date=meeting_date,
                    meeting_link=meeting_link,
                    other_participant_name=other_participant_name
                ),
                loop
            )
            return future.result()