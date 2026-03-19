-- =====================================================
-- TALENTCONNECT - FINAL DATABASE SETUP
-- =====================================================
-- Run this ONCE in your Supabase SQL Editor
-- This creates all missing tables and fixes data isolation

-- =====================================================
-- 1. CREATE USER ACTIVITIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reference_id UUID,
    reference_type VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created ON user_activities(created_at DESC);

-- Enable RLS
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own activities
DROP POLICY IF EXISTS "Users can view their activities" ON user_activities;
CREATE POLICY "Users can view their activities" ON user_activities
    FOR SELECT
    USING (auth.uid() = user_id);

-- =====================================================
-- 2. ENSURE WALLET TABLES EXIST
-- =====================================================

-- Wallet table for real money
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

-- Wallet transactions
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON wallet_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their wallet" ON wallet;
CREATE POLICY "Users can view their wallet" ON wallet
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their wallet transactions" ON wallet_transactions;
CREATE POLICY "Users can view their wallet transactions" ON wallet_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- =====================================================
-- 3. ENSURE CRITICAL TASK COLUMNS EXIST
-- =====================================================

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

-- =====================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tasks_creator ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_acceptor ON tasks(acceptor_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON tasks(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_payment_status ON tasks(payment_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- 5. UPDATE TRIGGERS
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
-- VERIFICATION QUERIES (Run these to verify setup)
-- =====================================================

-- Check if user_activities table exists
-- SELECT COUNT(*) as user_activities_count FROM user_activities;

-- Check if wallet tables exist
-- SELECT COUNT(*) as wallet_count FROM wallet;
-- SELECT COUNT(*) as wallet_transactions_count FROM wallet_transactions;

-- Check task columns
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'tasks' 
-- AND column_name IN ('payment_status', 'assigned_user_id');

-- Check RLS policies
-- SELECT tablename, policyname FROM pg_policies 
-- WHERE tablename IN ('user_activities', 'wallet', 'wallet_transactions', 'notifications');

-- =====================================================
-- DONE! 
-- =====================================================
-- After running this:
-- 1. All necessary tables are created
-- 2. Activity tracking is enabled
-- 3. Wallet system is ready
-- 4. Indexes optimize queries
-- 5. RLS policies protect user data
