from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.config import settings
import logging

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

email_service = EmailService()
