-- =====================================================
-- TALENTCONNECT - COMPREHENSIVE DATABASE FIXES (FIXED)
-- =====================================================
-- This SQL file fixes all critical backend issues
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. ENSURE ALL REQUIRED COLUMNS EXIST
-- =====================================================

-- Add payment_status to tasks (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='tasks' AND column_name='payment_status'
    ) THEN
        ALTER TABLE tasks 
        ADD COLUMN payment_status VARCHAR(50) DEFAULT 'unpaid' 
        CHECK (payment_status IN ('unpaid', 'payment_pending', 'paid', 'refunded'));
    END IF;
END $$;

-- Add assigned_user_id to tasks (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='tasks' AND column_name='assigned_user_id'
    ) THEN
        ALTER TABLE tasks 
        ADD COLUMN assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add read_at to notifications (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='notifications' AND column_name='read_at'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- =====================================================
-- 2. CREATE WALLET TABLES (Real Money)
-- =====================================================

-- Create wallet table for real money (separate from tokens)
CREATE TABLE IF NOT EXISTS wallet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_earned DECIMAL(10,2) DEFAULT 0.00,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT wallet_user_id_unique UNIQUE(user_id)
);

-- Create wallet transactions table (real money)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
    amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(100),
    balance_after DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on critical tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_acceptors ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TASKS TABLE POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view tasks they created or accepted" ON tasks;
DROP POLICY IF EXISTS "Users can view open tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;

-- Policy: Users can view tasks they created, accepted, or open tasks
CREATE POLICY "Users can view tasks they created or accepted" ON tasks
    FOR SELECT
    USING (
        auth.uid() = creator_id 
        OR auth.uid() = acceptor_id 
        OR auth.uid() = assigned_user_id
        OR status = 'open'
    );

-- Policy: Users can create tasks
CREATE POLICY "Users can create tasks" ON tasks
    FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

-- Policy: Users can update their own tasks or accept tasks
CREATE POLICY "Users can update their own tasks" ON tasks
    FOR UPDATE
    USING (
        auth.uid() = creator_id 
        OR auth.uid() = acceptor_id 
        OR auth.uid() = assigned_user_id
    );

-- =====================================================
-- TASK SUBMISSIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view submissions for their tasks" ON task_submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON task_submissions;
DROP POLICY IF EXISTS "Task creators can update submissions" ON task_submissions;
DROP POLICY IF EXISTS "task_submissions_select_policy" ON task_submissions;
DROP POLICY IF EXISTS "task_submissions_insert_policy" ON task_submissions;
DROP POLICY IF EXISTS "task_submissions_update_policy" ON task_submissions;

-- Policy: Users can view submissions if they're the submitter or task creator
CREATE POLICY "Users can view submissions for their tasks" ON task_submissions
    FOR SELECT
    USING (
        auth.uid() = submitter_id 
        OR auth.uid() IN (
            SELECT creator_id FROM tasks WHERE id = task_id
        )
        OR auth.uid() IN (
            SELECT acceptor_id FROM tasks WHERE id = task_id
        )
        OR auth.uid() IN (
            SELECT assigned_user_id FROM tasks WHERE id = task_id
        )
    );

-- Policy: Users can create submissions for tasks they accepted
CREATE POLICY "Users can create submissions" ON task_submissions
    FOR INSERT
    WITH CHECK (
        auth.uid() = submitter_id
        AND auth.uid() IN (
            SELECT acceptor_id FROM tasks WHERE id = task_id
            UNION
            SELECT assigned_user_id FROM tasks WHERE id = task_id
        )
    );

-- Policy: Task creators can update (approve/reject) submissions
CREATE POLICY "Task creators can update submissions" ON task_submissions
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT creator_id FROM tasks WHERE id = task_id
        )
    );

-- =====================================================
-- TASK ACCEPTORS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view task acceptors" ON task_acceptors;
DROP POLICY IF EXISTS "Users can create task acceptor records" ON task_acceptors;
DROP POLICY IF EXISTS "Task creators can update acceptor status" ON task_acceptors;

-- Policy: Users can view acceptor records for their tasks
CREATE POLICY "Users can view task acceptors" ON task_acceptors
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR auth.uid() IN (
            SELECT creator_id FROM tasks WHERE id = task_id
        )
    );

-- Policy: Users can create acceptor records
CREATE POLICY "Users can create task acceptor records" ON task_acceptors
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Task creators can update acceptor status (assign/reject)
CREATE POLICY "Task creators can update acceptor status" ON task_acceptors
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT creator_id FROM tasks WHERE id = task_id
        )
    );

-- =====================================================
-- PAYMENTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their payments" ON payments;
DROP POLICY IF EXISTS "Users can create payments" ON payments;
DROP POLICY IF EXISTS "Users can update their payments" ON payments;
DROP POLICY IF EXISTS "payments_select_policy" ON payments;
DROP POLICY IF EXISTS "payments_insert_policy" ON payments;
DROP POLICY IF EXISTS "payments_update_policy" ON payments;

-- Policy: Users can only view payments they're involved in
CREATE POLICY "Users can view their payments" ON payments
    FOR SELECT
    USING (auth.uid() = payer_id OR auth.uid() = payee_id);

-- Policy: Payers can create payments
CREATE POLICY "Users can create payments" ON payments
    FOR INSERT
    WITH CHECK (auth.uid() = payer_id);

-- Policy: Payers can update payments (verify, release)
CREATE POLICY "Users can update their payments" ON payments
    FOR UPDATE
    USING (auth.uid() = payer_id);

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;

-- Policy: Users can only view their own notifications
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark read)
CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their notifications" ON notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- WALLET & TOKENS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their tokens" ON skill_tokens;
DROP POLICY IF EXISTS "Users can view their token transactions" ON token_transactions;
DROP POLICY IF EXISTS "Users can view their wallet" ON wallet;
DROP POLICY IF EXISTS "Users can view their wallet transactions" ON wallet_transactions;

-- Policy: Users can only view their own token balance
CREATE POLICY "Users can view their tokens" ON skill_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only view their own token transactions
CREATE POLICY "Users can view their token transactions" ON token_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only view their own wallet
CREATE POLICY "Users can view their wallet" ON wallet
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only view their own wallet transactions
CREATE POLICY "Users can view their wallet transactions" ON wallet_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tasks_creator ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_acceptor ON tasks(acceptor_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON tasks(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_payment_status ON tasks(payment_status);
CREATE INDEX IF NOT EXISTS idx_task_submissions_task ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_submitter ON task_submissions(submitter_id);
CREATE INDEX IF NOT EXISTS idx_task_acceptors_task ON task_acceptors(task_id);
CREATE INDEX IF NOT EXISTS idx_task_acceptors_user ON task_acceptors(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_task ON payments(task_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee ON payments(payee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(transaction_type);

-- =====================================================
-- 5. TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to wallet table
DROP TRIGGER IF EXISTS update_wallet_updated_at ON wallet;
CREATE TRIGGER update_wallet_updated_at 
    BEFORE UPDATE ON wallet
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these after migration to verify success
-- SELECT COUNT(*) FROM wallet;
-- SELECT COUNT(*) FROM wallet_transactions;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks' AND column_name IN ('payment_status', 'assigned_user_id');
-- SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('tasks', 'wallet', 'payments', 'notifications');

-- =====================================================
-- NOTES
-- =====================================================
-- ✅ After running this migration:
-- 1. All data isolation is enforced at database level via RLS
-- 2. Wallet system is ready for real money transactions
-- 3. Token system remains separate for skill economy
-- 4. All indexes optimize query performance
-- 5. Existing data is preserved

-- ⚠️ STORAGE BUCKET POLICIES:
-- Storage policies for file access need to be set up separately in Supabase Dashboard:
-- 1. Go to Storage > Policies
-- 2. Create policies for 'task-attachments' bucket
-- 3. Policy for INSERT: Allow authenticated users to upload
-- 4. Policy for SELECT: Allow task participants (creator/acceptor) to view files
-- 
-- See STORAGE_POLICIES.md for detailed instructions
