-- Migration: Add Advanced Features Fields
-- Run this SQL in your Supabase SQL Editor to add new fields for advanced features

-- =====================================================
-- Feature 1: Reputation System - Add trust score fields
-- =====================================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trust_score DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS verified_skills_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_rate DECIMAL(5,2) DEFAULT 0.00;

-- =====================================================
-- Feature 4: Skill Certification System
-- =====================================================

-- Skill Quizzes Table
CREATE TABLE IF NOT EXISTS skill_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name VARCHAR(255) NOT NULL,
    difficulty_level VARCHAR(20) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
    passing_score INTEGER DEFAULT 70,
    time_limit_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz Questions Table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES skill_quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of options: [\"option1\", \"option2\", \"option3\", \"option4\"]
    correct_answer INTEGER NOT NULL, -- Index of correct answer (0-3)
    points INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Quiz Attempts Table
CREATE TABLE IF NOT EXISTS user_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES skill_quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    time_taken_minutes INTEGER,
    answers JSONB, -- Store user's answers
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Feature 6: Leaderboard System
-- =====================================================

-- Leaderboard Entries Table
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'top_mentor', 'top_learner', 'top_contributor'
    score DECIMAL(10,2) NOT NULL,
    rank INTEGER,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category, week_start_date)
);

-- =====================================================
-- Feature 7: Skill Token Economy
-- =====================================================

-- Skill Tokens Table
CREATE TABLE IF NOT EXISTS skill_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Token Transactions Table
CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- 'earn', 'spend'
    amount INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL, -- 'session_completed', 'task_completed', 'high_rating', 'booking_session', etc.
    reference_id UUID, -- ID of related session, task, etc.
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Feature 8: Plagiarism Detection
-- =====================================================

-- Plagiarism Reports Table
CREATE TABLE IF NOT EXISTS plagiarism_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
    similarity_score DECIMAL(5,2) NOT NULL, -- 0-100 percentage
    flagged BOOLEAN DEFAULT false,
    matched_sources TEXT[], -- Array of matched sources
    detection_method VARCHAR(50), -- 'tfidf', 'cosine_similarity', etc.
    reviewed BOOLEAN DEFAULT false,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Feature 10: Smart Calendar
-- =====================================================

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
    event_title VARCHAR(500) NOT NULL,
    event_description TEXT,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    reminder_sent BOOLEAN DEFAULT false,
    calendar_link TEXT, -- Link to add to external calendar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Better Performance
-- =====================================================

-- Trust score indexes
CREATE INDEX IF NOT EXISTS idx_users_trust_score ON users(trust_score DESC);

-- Leaderboard indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_category_week ON leaderboard_entries(category, week_start_date, rank);

-- Token transactions indexes
CREATE INDEX IF NOT EXISTS idx_token_transactions_user ON token_transactions(user_id, created_at DESC);

-- Quiz attempts indexes
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON user_quiz_attempts(user_id, attempted_at DESC);

-- Plagiarism reports indexes
CREATE INDEX IF NOT EXISTS idx_plagiarism_flagged ON plagiarism_reports(flagged, reviewed);

-- Calendar events indexes
CREATE INDEX IF NOT EXISTS idx_calendar_user_time ON calendar_events(user_id, event_time);

-- =====================================================
-- TRIGGERS for Auto-updating timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to skill_tokens
DROP TRIGGER IF EXISTS update_skill_tokens_updated_at ON skill_tokens;
CREATE TRIGGER update_skill_tokens_updated_at
    BEFORE UPDATE ON skill_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to skill_quizzes
DROP TRIGGER IF EXISTS update_skill_quizzes_updated_at ON skill_quizzes;
CREATE TRIGGER update_skill_quizzes_updated_at
    BEFORE UPDATE ON skill_quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA / SEED DATA
-- =====================================================

-- Create initial token accounts for existing users
INSERT INTO skill_tokens (user_id, balance, total_earned, total_spent)
SELECT id, 100, 100, 0 FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Note: Quiz questions should be added separately based on skills in your system
