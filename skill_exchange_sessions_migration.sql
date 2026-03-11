-- Migration for Skill Exchange Sessions with Meeting Scheduling
-- This table stores scheduled meetings for skill exchange sessions

CREATE TABLE IF NOT EXISTS skill_exchange_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_task_id UUID NOT NULL REFERENCES skill_exchange_tasks(id) ON DELETE CASCADE,
    participant1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_duration_minutes INTEGER DEFAULT 60,
    meeting_topic VARCHAR(500),
    meeting_notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_skill_exchange_sessions_exchange ON skill_exchange_sessions(exchange_task_id);
CREATE INDEX IF NOT EXISTS idx_skill_exchange_sessions_participant1 ON skill_exchange_sessions(participant1_id);
CREATE INDEX IF NOT EXISTS idx_skill_exchange_sessions_participant2 ON skill_exchange_sessions(participant2_id);
CREATE INDEX IF NOT EXISTS idx_skill_exchange_sessions_date ON skill_exchange_sessions(meeting_date);
CREATE INDEX IF NOT EXISTS idx_skill_exchange_sessions_status ON skill_exchange_sessions(status);

-- Add RLS policies
ALTER TABLE skill_exchange_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view their sessions" ON skill_exchange_sessions
    FOR SELECT
    USING (
        participant1_id = auth.uid() OR participant2_id = auth.uid()
    );

-- Policy: Users can create sessions for their exchanges
CREATE POLICY "Users can create their sessions" ON skill_exchange_sessions
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid() AND (
            participant1_id = auth.uid() OR participant2_id = auth.uid()
        )
    );

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update their sessions" ON skill_exchange_sessions
    FOR UPDATE
    USING (
        participant1_id = auth.uid() OR participant2_id = auth.uid()
    );
