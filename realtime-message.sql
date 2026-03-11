-- Realtime Messages Table Migration for TalentConnect
-- This table stores all real-time chat messages for tasks and sessions

CREATE TABLE IF NOT EXISTS realtime_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('task', 'session')),
    room_id UUID NOT NULL,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file', 'image')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_realtime_messages_room ON realtime_messages(room_type, room_id);
CREATE INDEX IF NOT EXISTS idx_realtime_messages_sender ON realtime_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_realtime_messages_created_at ON realtime_messages(created_at);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE realtime_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read messages from rooms they're part of
CREATE POLICY \"Users can read their room messages\" ON realtime_messages
    FOR SELECT
    USING (
        -- For tasks: user is either creator or acceptor
        (room_type = 'task' AND EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = room_id::uuid 
            AND (tasks.creator_id = auth.uid() OR tasks.acceptor_id = auth.uid())
        ))
        OR
        -- For sessions: user is either mentor or learner
        (room_type = 'session' AND EXISTS (
            SELECT 1 FROM learning_sessions 
            WHERE learning_sessions.id = room_id::uuid 
            AND (learning_sessions.mentor_id = auth.uid() OR learning_sessions.learner_id = auth.uid())
        ))
    );

-- Policy: Users can insert messages in their rooms
CREATE POLICY \"Users can send messages in their rooms\" ON realtime_messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND (
            (room_type = 'task' AND EXISTS (
                SELECT 1 FROM tasks 
                WHERE tasks.id = room_id::uuid 
                AND (tasks.creator_id = auth.uid() OR tasks.acceptor_id = auth.uid())
            ))
            OR
            (room_type = 'session' AND EXISTS (
                SELECT 1 FROM learning_sessions 
                WHERE learning_sessions.id = room_id::uuid 
                AND (learning_sessions.mentor_id = auth.uid() OR learning_sessions.learner_id = auth.uid())
            ))
        )
    );