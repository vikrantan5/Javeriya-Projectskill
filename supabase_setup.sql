-- TalentConnect - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- =====================================================
-- TABLES
-- =====================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    bio TEXT,
    profile_photo TEXT,
    location VARCHAR(255),
    phone VARCHAR(20),
    
    -- User Status
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    role VARCHAR(20) DEFAULT 'student', -- 'student' or 'admin'
    
    -- Reputation
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_tasks_completed INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- 2. User Skills Table
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    skill_type VARCHAR(20) NOT NULL, -- 'offered' or 'wanted'
    skill_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced', 'expert'
    is_verified BOOLEAN DEFAULT false,
    verification_score INTEGER, -- Quiz score if verified
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Learning Sessions Table
CREATE TABLE IF NOT EXISTS learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    learner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    
    -- Session Details
    meeting_link TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 60,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'scheduled', 'completed', 'cancelled'
    
    -- Session Notes
    mentor_notes TEXT,
    learner_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Session Requests Table
CREATE TABLE IF NOT EXISTS session_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_offered VARCHAR(255) NOT NULL,
    skill_wanted VARCHAR(255) NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Reviews and Ratings Table
CREATE TABLE IF NOT EXISTS reviews_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tasks Table (Paid Academic Tasks)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    acceptor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Task Details
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    subject VARCHAR(100),
    difficulty_level VARCHAR(20), -- 'easy', 'medium', 'hard'
    
    -- Payment
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Deadline
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'accepted', 'submitted', 'completed', 'disputed', 'cancelled'
    
    -- Files
    attachment_urls TEXT[], -- Array of file URLs
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Task Submissions Table
CREATE TABLE IF NOT EXISTS task_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    submitter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Submission Details
    submission_text TEXT,
    submission_files TEXT[], -- Array of file URLs
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Review
    is_approved BOOLEAN,
    review_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 8. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    payer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Payment Details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Razorpay Details
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded', 'escrowed', 'released'
    payment_method VARCHAR(50),
    
    -- Escrow
    is_escrowed BOOLEAN DEFAULT false,
    escrowed_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50), -- 'session_request', 'task_update', 'payment', 'system', etc.
    
    -- Reference
    reference_id UUID, -- ID of related entity (session, task, etc.)
    reference_type VARCHAR(50), -- Type of entity
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Fraud Logs Table
CREATE TABLE IF NOT EXISTS fraud_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Fraud Detection
    fraud_type VARCHAR(100), -- 'repeated_cancellation', 'fake_submission', 'spam', etc.
    severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    description TEXT,
    
    -- AI Detection Score
    confidence_score DECIMAL(5,4), -- 0.0000 to 1.0000
    
    -- Action Taken
    action_taken VARCHAR(100), -- 'warning', 'rating_penalty', 'temporary_ban', 'permanent_ban'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Skill Verification Tests Table
CREATE TABLE IF NOT EXISTS skill_verification_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    
    -- Test Details
    questions JSONB NOT NULL, -- Array of questions and options
    user_answers JSONB, -- User's submitted answers
    
    -- Results
    score INTEGER,
    total_questions INTEGER,
    passed BOOLEAN,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 12. Chat History Table (AI Chatbot)
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID, -- To group chat sessions
    
    -- Message Details
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    message TEXT NOT NULL,
    
    -- Context
    context JSONB, -- Additional context for AI
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Platform Messages Table (Admin Announcements)
CREATE TABLE IF NOT EXISTS platform_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill_name ON user_skills(skill_name);
CREATE INDEX idx_learning_sessions_mentor ON learning_sessions(mentor_id);
CREATE INDEX idx_learning_sessions_learner ON learning_sessions(learner_id);
CREATE INDEX idx_learning_sessions_status ON learning_sessions(status);
CREATE INDEX idx_session_requests_sender ON session_requests(sender_id);
CREATE INDEX idx_session_requests_receiver ON session_requests(receiver_id);
CREATE INDEX idx_session_requests_status ON session_requests(status);
CREATE INDEX idx_tasks_creator ON tasks(creator_id);
CREATE INDEX idx_tasks_acceptor ON tasks(acceptor_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_payments_task ON payments(task_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_fraud_logs_user ON fraud_logs(user_id);
CREATE INDEX idx_chat_history_user ON chat_history(user_id);
CREATE INDEX idx_chat_history_session ON chat_history(session_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_sessions_updated_at BEFORE UPDATE ON learning_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_requests_updated_at BEFORE UPDATE ON session_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE ADMIN USER (Optional - for testing)
-- =====================================================

-- Note: You should change the password hash in production
-- This is a placeholder. Generate proper hash in your application.

-- INSERT INTO users (email, username, password_hash, full_name, role, is_verified)
-- VALUES (
--     'admin@talentconnect.com',
--     'admin',
--     'REPLACE_WITH_ACTUAL_HASH',
--     'Platform Administrator',
--     'admin',
--     true
-- );

-- =====================================================
-- NOTES
-- =====================================================

-- 1. Run this entire script in your Supabase SQL Editor
-- 2. All tables use UUID as primary keys for better scalability
-- 3. Timestamps use TIMESTAMP WITH TIME ZONE for proper timezone handling
-- 4. Foreign keys have appropriate CASCADE/SET NULL constraints
-- 5. Indexes are created on frequently queried columns
-- 6. Triggers automatically update 'updated_at' fields
-- 7. Consider enabling Row Level Security (RLS) in production
-- 8. Update the admin user INSERT with a proper password hash
