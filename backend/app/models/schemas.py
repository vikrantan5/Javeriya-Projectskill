from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# =====================================================
# USER SCHEMAS
# =====================================================

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None

     
    @validator('password')
    def validate_password_length(cls, v):
        """Validate password doesn't exceed bcrypt's 72-byte limit"""
        password_bytes = len(v.encode('utf-8'))
        if password_bytes > 72:
            raise ValueError(f'Password is too long. Maximum 72 bytes allowed (current: {password_bytes} bytes)')
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str


    @validator('password')
    def validate_password_length(cls, v):
        """Validate password doesn't exceed bcrypt's 72-byte limit"""
        password_bytes = len(v.encode('utf-8'))
        if password_bytes > 72:
            raise ValueError(f'Password is too long. Maximum 72 bytes allowed (current: {password_bytes} bytes)')
        return v

class UserResponse(BaseModel):
    id: UUID
    email: str
    username: str
    full_name: Optional[str]
    bio: Optional[str]
    profile_photo: Optional[str]
    location: Optional[str]
    phone: Optional[str]
    is_active: bool
    is_verified: bool
    role: str
    average_rating: float
    total_ratings: int
    total_sessions: int
    total_tasks_completed: int
    created_at: datetime

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_photo: Optional[str] = None
    background_photo: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    github: Optional[str] = None
    twitter: Optional[str] = None
    linkedin: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[str] = None

# =====================================================
# SKILL SCHEMAS
# =====================================================

class SkillCreate(BaseModel):
    skill_name: str
    skill_type: str  # 'offered' or 'wanted'
    skill_level: Optional[str] = None  # 'beginner', 'intermediate', 'advanced', 'expert'
    description: Optional[str] = None
    years_experience: Optional[int] = None
    hourly_rate: Optional[float] = None

class SkillResponse(BaseModel):
    id: UUID
    user_id: UUID
    skill_name: str
    skill_type: str
    skill_level: Optional[str] = None
    description: Optional[str] = None
    years_experience: Optional[int] = None
    hourly_rate: Optional[float] = None
    is_verified: bool
    verification_score: Optional[int] = None
    student_count: Optional[int] = None
    average_rating: Optional[float] = None
    created_at: datetime
# =====================================================
# SESSION SCHEMAS
# =====================================================

class SessionRequestCreate(BaseModel):
    receiver_id: UUID
    skill_offered: str
    skill_wanted: str
    message: Optional[str] = None

class SessionRequestResponse(BaseModel):
    id: UUID
    sender_id: UUID
    receiver_id: UUID
    skill_offered: str
    skill_wanted: str
    message: Optional[str]
    status: str
    created_at: datetime

class SessionCreate(BaseModel):
    learner_id: UUID
    skill_name: str
    meeting_link: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: int = 60

class SessionResponse(BaseModel):
    id: UUID
    mentor_id: UUID
    learner_id: UUID
    skill_name: str
    meeting_link: Optional[str]
    scheduled_at: Optional[datetime]
    duration_minutes: int
    status: str
    created_at: datetime

class SessionUpdate(BaseModel):
    meeting_link: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    
    duration_minutes: Optional[int] = None
    status: Optional[str] = None
    mentor_notes: Optional[str] = None
    learner_notes: Optional[str] = None


class MeetingLinkGenerateRequest(BaseModel):
    provider: Optional[str] = "google_meet"
    platform: Optional[str] = None
    session_topic: Optional[str] = "TalentConnect Session"
    session_id: Optional[UUID] = None

# =====================================================
# REVIEW SCHEMAS
# =====================================================

class ReviewCreate(BaseModel):
    session_id: UUID
    reviewed_user_id: UUID
    rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = None

class ReviewResponse(BaseModel):
    id: UUID
    session_id: UUID
    reviewer_id: UUID
    reviewed_user_id: UUID
    rating: int
    review_text: Optional[str]
    created_at: datetime

# =====================================================
# TASK SCHEMAS
# =====================================================
class SkillExchangeTaskCreate(BaseModel):
    description: Optional[str] = None
    skill_offered: str
  
    skill_requested: str
    difficulty_level: Optional[str] = None
    deadline: Optional[datetime] = None
    estimated_hours: Optional[int] = None


class SkillExchangeTaskAccept(BaseModel):
    reciprocal_task_id: Optional[UUID] = None
    message: Optional[str] = None

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=10, max_length=500)
    description: str
    subject: Optional[str] = None
    difficulty_level: Optional[str] = None
    price: float = Field(..., gt=0)
    deadline: datetime
    attachment_urls: Optional[List[str]] = None
    attachments: Optional[List[str]] = None
    requirements: Optional[str] = None
    estimated_hours: Optional[int] = None

class TaskResponse(BaseModel):
    id: UUID
    creator_id: UUID
    acceptor_id: Optional[UUID]
    title: str
    description: str
    subject: Optional[str]
    difficulty_level: Optional[str]
    price: float
    currency: str
    deadline: datetime
    status: str
    attachment_urls: Optional[List[str]]
    created_at: datetime

class TaskUpdate(BaseModel):
    status: Optional[str] = None
    acceptor_id: Optional[UUID] = None

class TaskSubmissionCreate(BaseModel):
   
    submission_text: Optional[str] = None
    submission_files: Optional[List[str]] = None

class TaskSubmissionResponse(BaseModel):
    id: UUID
    task_id: UUID
    submitter_id: UUID
    submission_text: Optional[str]
    submission_files: Optional[List[str]]
    is_approved: Optional[bool]
    review_notes: Optional[str]
    submitted_at: datetime



class TaskAcceptRequest(BaseModel):
    message: Optional[str] = None

class TaskAssignRequest(BaseModel):
    user_id: UUID

class TaskAcceptorResponse(BaseModel):
    id: UUID
    task_id: UUID
    user_id: UUID
    status: str
    message: Optional[str]
    accepted_at: datetime

class RealtimeMessageCreate(BaseModel):
    room_id: UUID
    room_type: str = "task"
    content: str
    message_type: str = "text"

# =====================================================
# PAYMENT SCHEMAS
# =====================================================

class PaymentCreate(BaseModel):
    task_id: UUID
    amount: float
    currency: str = "INR"

class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class PaymentResponse(BaseModel):
    id: UUID
    task_id: Optional[UUID]
    payer_id: UUID
    payee_id: Optional[UUID]
    amount: float
    currency: str
    razorpay_order_id: Optional[str]
    status: str
    is_escrowed: bool
    created_at: datetime

# =====================================================
# NOTIFICATION SCHEMAS
# =====================================================

class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    message: str
    notification_type: Optional[str]
    is_read: bool
    created_at: datetime

# =====================================================
# AI SCHEMAS
# =====================================================

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class SkillMatchRequest(BaseModel):
    skill_name: str
    limit: int = 5

class SkillRecommendationRequest(BaseModel):
    user_skills: List[str]
    limit: int = 5

class SkillVerificationRequest(BaseModel):
    skill_name: str
    skill_level: str

class SkillVerificationResponse(BaseModel):
    test_id: UUID
    questions: List[dict]

class SkillVerificationSubmit(BaseModel):
    test_id: UUID
    answers: List[int]

# =====================================================
# ADMIN SCHEMAS
# =====================================================

class UserBanRequest(BaseModel):
    reason: str
    duration_days: Optional[int] = None  # None means permanent

class PlatformMessageCreate(BaseModel):
    title: str
    message: str
    message_type: str = "info"
    expires_at: Optional[datetime] = None





# =====================================================
# REPORT SCHEMAS
# =====================================================

class ReportCreate(BaseModel):
    reported_entity_type: str  # 'task', 'user', 'skill_exchange', 'session'
    reported_entity_id: UUID
    reported_user_id: Optional[UUID] = None  # User being reported
    report_type: str = "general"  # 'fraud', 'incomplete', 'harassing', 'payment_issue', 'dispute', 'general'
    reason: str  # Category of report
    description: str  # Detailed description
    screenshots: Optional[List[str]] = None
    attachments: Optional[List[str]] = None

class ReportResponse(BaseModel):
    id: UUID
    reporter_id: UUID
    reported_entity_type: str
    reported_entity_id: UUID
    reason: str
    description: str
    status: str  # 'pending', 'under_review', 'resolved', 'dismissed'
    created_at: datetime

class ReportUpdate(BaseModel):
    status: str  # 'under_review', 'resolved', 'dismissed'
    admin_notes: Optional[str] = None
    admin_action_taken: Optional[str] = None

# =====================================================
# TASK CANCELLATION SCHEMAS
# =====================================================

class TaskCancelRequest(BaseModel):
    cancel_reason: str  # Must be one of predefined reasons
    cancel_details: Optional[str] = None  # Additional details if \"other\" is selected

class TaskCancelResponse(BaseModel):
    message: str
    refund_initiated: bool
    refund_amount: Optional[float] = None
    task_id: UUID

# =====================================================
# TASK DISPUTE SCHEMAS
# =====================================================

class TaskDisputeCreate(BaseModel):
    task_id: UUID
    against_user_id: UUID
    dispute_type: str  # 'payment', 'work_quality', 'deadline', 'fraud', 'other'
    dispute_reason: str
    evidence_urls: Optional[List[str]] = None

class TaskDisputeResponse(BaseModel):
    id: UUID
    task_id: UUID
    raised_by: UUID
    against_user_id: UUID
    dispute_type: str
    dispute_reason: str
    status: str
    created_at: datetime

class TaskDisputeUpdate(BaseModel):
    status: str  # 'under_review', 'resolved', 'dismissed'
    resolution: Optional[str] = None
    admin_notes: Optional[str] = None




# =====================================================
# BANK DETAILS SCHEMAS (For Production Mode)
# =====================================================

class BankDetailsCreate(BaseModel):
    bank_account_number: str
    ifsc_code: str
    account_holder_name: str
    upi_id: Optional[str] = None
    payout_preference: str = "bank"  # 'bank' or 'upi'

class BankDetailsResponse(BaseModel):
    bank_account_number: str
    ifsc_code: str
    account_holder_name: str
    upi_id: Optional[str]
    payout_preference: str