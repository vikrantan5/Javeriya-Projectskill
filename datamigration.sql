-- TalentConnect Database Schema Setup for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  bio TEXT,
  profile_photo VARCHAR(500),
  location VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  github VARCHAR(255),
  twitter VARCHAR(255),
  linkedin VARCHAR(255),
  company VARCHAR(255),
  job_title VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  role VARCHAR(50) DEFAULT 'student',
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  total_ratings INT DEFAULT 0,
  total_sessions INT DEFAULT 0,
  total_tasks_completed INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SKILLS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(255) NOT NULL,
  skill_type VARCHAR(50) NOT NULL CHECK (skill_type IN ('offered', 'wanted')),
  skill_level VARCHAR(50) CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  is_verified BOOLEAN DEFAULT false,
  verification_score INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SESSION REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS session_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_offered VARCHAR(255) NOT NULL,
  skill_wanted VARCHAR(255) NOT NULL,
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LEARNING SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(255) NOT NULL,
  meeting_link TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INT DEFAULT 60,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'pending')),
  mentor_notes TEXT,
  learner_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- TASKS TABLE (Paid Marketplace)
-- =====================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  acceptor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  subject VARCHAR(255),
  difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  currency VARCHAR(10) DEFAULT 'INR',
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'submitted', 'completed', 'cancelled')),
  attachment_urls TEXT[],
  requirements TEXT,
  estimated_hours INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SKILL EXCHANGE TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS skill_exchange_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_offered VARCHAR(255) NOT NULL,
  skill_requested VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'matched', 'completed', 'cancelled')),
  matched_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reciprocal_task_id UUID REFERENCES skill_exchange_tasks(id) ON DELETE SET NULL,
  difficulty_level VARCHAR(50),
  deadline TIMESTAMP WITH TIME ZONE,
  estimated_hours INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TASK SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS task_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  submitter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  submission_text TEXT,
  submission_files TEXT[],
  is_approved BOOLEAN,
  review_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewed_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  payer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  payee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'released')),
  is_escrowed BOOLEAN DEFAULT false,
  escrowed_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(100),
  reference_id UUID,
  reference_type VARCHAR(100),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REALTIME MESSAGES TABLE (For Chat)
-- =====================================================
CREATE TABLE IF NOT EXISTS realtime_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_type VARCHAR(50) NOT NULL CHECK (room_type IN ('task', 'session')),
  room_id UUID NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TOKEN BALANCES TABLE (Skill Tokens)
-- =====================================================
CREATE TABLE IF NOT EXISTS token_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance INT DEFAULT 0,
  total_earned INT DEFAULT 0,
  total_spent INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SKILL VERIFICATION TESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS skill_verification_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(255) NOT NULL,
  skill_level VARCHAR(50) NOT NULL,
  questions JSONB NOT NULL,
  answers INT[],
  score INT,
  passed BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- LEADERBOARD ENTRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  sessions_count INT DEFAULT 0,
  tasks_count INT DEFAULT 0,
  total_rating DECIMAL(4,2) DEFAULT 0,
  rank INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_receiver ON session_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_sender ON session_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_mentor ON learning_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_learner ON learning_sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_creator ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_acceptor ON tasks(acceptor_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_skill_exchange_creator ON skill_exchange_tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_skill_exchange_status ON skill_exchange_tasks(status);
CREATE INDEX IF NOT EXISTS idx_payments_task ON payments(task_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee ON payments(payee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_realtime_messages_room ON realtime_messages(room_type, room_id);
CREATE INDEX IF NOT EXISTS idx_reviews_session ON reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user ON reviews(reviewed_user_id);

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
$$ language 'plpgsql';

-- Apply triggers to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_skill_exchange_updated_at ON skill_exchange_tasks;
CREATE TRIGGER update_skill_exchange_updated_at BEFORE UPDATE ON skill_exchange_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate user average rating
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews
        WHERE reviewed_user_id = NEW.reviewed_user_id
    ),
    total_ratings = (
        SELECT COUNT(*)
        FROM reviews
        WHERE reviewed_user_id = NEW.reviewed_user_id
    )
    WHERE id = NEW.reviewed_user_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_rating_on_review ON reviews;
CREATE TRIGGER update_rating_on_review AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_user_rating();
