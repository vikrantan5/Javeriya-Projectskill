-- TalentConnect - Database Migration for Missing Tables and Columns (FIXED)
-- Run this in your Supabase SQL Editor

-- =====================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add reputation columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trust_score DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS verified_skills_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_rate DECIMAL(5,2) DEFAULT 0.00;

-- =====================================================
-- CREATE NEW TABLES
-- =====================================================

-- 1. Skill Tokens Table
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

-- 2. Token Transactions Table
CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL,
    amount INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reference_id UUID,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Leaderboard Entries Table
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL,
    rank INTEGER NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category, week_start_date)
);

-- 4. Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
    event_title VARCHAR(255) NOT NULL,
    event_description TEXT,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    reminder_sent BOOLEAN DEFAULT false,
    calendar_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Plagiarism Reports Table
CREATE TABLE IF NOT EXISTS plagiarism_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
    similarity_score DECIMAL(5,2) NOT NULL,
    flagged BOOLEAN DEFAULT false,
    matched_sources UUID[],
    detection_method VARCHAR(100),
    reviewed BOOLEAN DEFAULT false,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Skill Verification Quizzes Table
CREATE TABLE IF NOT EXISTS skill_verification_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name VARCHAR(255) NOT NULL,
    questions JSONB NOT NULL,
    passing_score INTEGER NOT NULL,
    difficulty_level VARCHAR(20),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES skill_verification_quizzes(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    user_answers JSONB,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    time_taken_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Mentor Matches Table
CREATE TABLE IF NOT EXISTS mentor_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    similarity_score DECIMAL(5,4),
    status VARCHAR(20) DEFAULT 'suggested',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Learning Roadmaps Table
CREATE TABLE IF NOT EXISTS learning_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    career_goal VARCHAR(255) NOT NULL,
    roadmap_data JSONB NOT NULL,
    current_step INTEGER DEFAULT 1,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_skill_tokens_user ON skill_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_category ON leaderboard_entries(category);
CREATE INDEX IF NOT EXISTS idx_leaderboard_week ON leaderboard_entries(week_start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_time ON calendar_events(event_time);
CREATE INDEX IF NOT EXISTS idx_plagiarism_reports_submission ON plagiarism_reports(submission_id);
CREATE INDEX IF NOT EXISTS idx_plagiarism_reports_flagged ON plagiarism_reports(flagged);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_mentor_matches_learner ON mentor_matches(learner_id);
CREATE INDEX IF NOT EXISTS idx_mentor_matches_mentor ON mentor_matches(mentor_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user ON learning_roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_users_trust_score ON users(trust_score);

-- =====================================================
-- UPDATE TRIGGERS FOR NEW TABLES (IDEMPOTENT)
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_skill_tokens_updated_at ON skill_tokens;
DROP TRIGGER IF EXISTS update_learning_roadmaps_updated_at ON learning_roadmaps;

-- Recreate triggers
CREATE TRIGGER update_skill_tokens_updated_at BEFORE UPDATE ON skill_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_roadmaps_updated_at BEFORE UPDATE ON learning_roadmaps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA FOR SKILL VERIFICATION QUIZZES
-- =====================================================

-- Sample Python Quiz
INSERT INTO skill_verification_quizzes (skill_name, questions, passing_score, difficulty_level, is_active)
VALUES (
    'Python',
    '[
        {
            "question": "What is the output of: print(type([]))?",
            "options": ["<class ''list''>", "<class ''tuple''>", "<class ''dict''>", "<class ''set''>"],
            "correct_answer": 0
        },
        {
            "question": "Which keyword is used to define a function in Python?",
            "options": ["function", "def", "func", "define"],
            "correct_answer": 1
        },
        {
            "question": "What does the ''len()'' function do?",
            "options": ["Returns the length of an object", "Returns the type of an object", "Returns the value of an object", "Returns the name of an object"],
            "correct_answer": 0
        },
        {
            "question": "How do you create a dictionary in Python?",
            "options": ["[]", "{}", "()", "''"],
            "correct_answer": 1
        },
        {
            "question": "What is the correct way to create a list in Python?",
            "options": ["list = {1, 2, 3}", "list = (1, 2, 3)", "list = [1, 2, 3]", "list = <1, 2, 3>"],
            "correct_answer": 2
        }
    ]'::jsonb,
    4,
    'beginner',
    true
)
ON CONFLICT DO NOTHING;

-- Sample React Quiz
INSERT INTO skill_verification_quizzes (skill_name, questions, passing_score, difficulty_level, is_active)
VALUES (
    'React',
    '[
        {
            "question": "What is JSX in React?",
            "options": ["A JavaScript extension", "A CSS framework", "A database", "A testing library"],
            "correct_answer": 0
        },
        {
            "question": "Which hook is used for side effects in React?",
            "options": ["useState", "useEffect", "useContext", "useReducer"],
            "correct_answer": 1
        },
        {
            "question": "How do you pass data from parent to child component?",
            "options": ["Using state", "Using props", "Using hooks", "Using context"],
            "correct_answer": 1
        },
        {
            "question": "What does the ''key'' prop do in React lists?",
            "options": ["Styles the element", "Helps React identify elements", "Adds security", "Creates animations"],
            "correct_answer": 1
        },
        {
            "question": "Which method is used to update state in a class component?",
            "options": ["updateState()", "setState()", "changeState()", "modifyState()"],
            "correct_answer": 1
        }
    ]'::jsonb,
    4,
    'intermediate',
    true
)
ON CONFLICT DO NOTHING;
