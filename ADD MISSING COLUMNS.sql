-- =====================================================
-- ADD MISSING COLUMNS TO TASKS TABLE
-- =====================================================
-- Run this script in your Supabase SQL Editor to add missing columns
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor → New Query
-- Paste this script and click RUN

-- Add requirements column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS requirements TEXT;

-- Add estimated_hours column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN tasks.requirements IS 'Specific requirements, skills needed, or prerequisites for the task';
COMMENT ON COLUMN tasks.estimated_hours IS 'Estimated hours to complete the task';

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
AND column_name IN ('requirements', 'estimated_hours')
ORDER BY column_name;

-- SUCCESS MESSAGE
DO $$ 
BEGIN
    RAISE NOTICE '✅ Missing columns have been added to the tasks table!';
    RAISE NOTICE '✅ requirements (TEXT) - for task requirements';
    RAISE NOTICE '✅ estimated_hours (INTEGER) - for estimated completion time';
END $$;
