-- Task Acceptors Table Migration
-- This table tracks multiple users who accept a task before assignment

CREATE TABLE IF NOT EXISTS task_acceptors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'rejected')),
  message TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- Add assigned_user_id column to tasks table if not exists
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_task_acceptors_task ON task_acceptors(task_id);
CREATE INDEX IF NOT EXISTS idx_task_acceptors_user ON task_acceptors(user_id);
CREATE INDEX IF NOT EXISTS idx_task_acceptors_status ON task_acceptors(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON tasks(assigned_user_id);

-- Add payment_status column to tasks table for tracking payment
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded'));

COMMENT ON TABLE task_acceptors IS 'Tracks users who accept tasks before creator assigns one';
COMMENT ON COLUMN tasks.assigned_user_id IS 'The user assigned to complete this task (chosen from acceptors)';
COMMENT ON COLUMN tasks.payment_status IS 'Payment status for task completion';
