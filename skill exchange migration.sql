-- TalentConnect Skill Exchange Task Marketplace
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS skill_exchange_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matched_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reciprocal_task_id UUID REFERENCES skill_exchange_tasks(id) ON DELETE SET NULL,
    skill_offered VARCHAR(255) NOT NULL,
    skill_requested VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_exchange_creator ON skill_exchange_tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_skill_exchange_status ON skill_exchange_tasks(status);
CREATE INDEX IF NOT EXISTS idx_skill_exchange_pair ON skill_exchange_tasks(skill_offered, skill_requested);

DROP TRIGGER IF EXISTS update_skill_exchange_tasks_updated_at ON skill_exchange_tasks;
CREATE TRIGGER update_skill_exchange_tasks_updated_at
    BEFORE UPDATE ON skill_exchange_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();