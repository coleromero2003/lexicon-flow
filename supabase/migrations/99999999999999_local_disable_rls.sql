-- =====================================================
-- LOCAL DEVELOPMENT ONLY: Disable RLS for Testing
-- =====================================================
-- This migration disables Row Level Security (RLS) on all tables
-- to simplify local development and testing without Clerk authentication.
--
-- IMPORTANT: This should NEVER be applied to production!
-- The high timestamp (99999999999999) ensures this runs after all other migrations.
-- Add this file to .gitignore if you don't want to commit it.
-- =====================================================

-- Disable RLS on boards table
ALTER TABLE IF EXISTS public.boards DISABLE ROW LEVEL SECURITY;

-- Disable RLS on columns table
ALTER TABLE IF EXISTS public.columns DISABLE ROW LEVEL SECURITY;

-- Disable RLS on tasks table
ALTER TABLE IF EXISTS public.tasks DISABLE ROW LEVEL SECURITY;

-- Disable RLS on projects table
ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;

-- Disable RLS on workflows table
ALTER TABLE IF EXISTS public.workflows DISABLE ROW LEVEL SECURITY;

-- Disable RLS on steps table
ALTER TABLE IF EXISTS public.steps DISABLE ROW LEVEL SECURITY;

-- Disable RLS on objects table
ALTER TABLE IF EXISTS public.objects DISABLE ROW LEVEL SECURITY;

-- Disable RLS on object_relations table
ALTER TABLE IF EXISTS public.object_relations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on object_subtasks table
ALTER TABLE IF EXISTS public.object_subtasks DISABLE ROW LEVEL SECURITY;

-- Disable RLS on files table
ALTER TABLE IF EXISTS public.files DISABLE ROW LEVEL SECURITY;

-- Disable RLS on object_files table
ALTER TABLE IF EXISTS public.object_files DISABLE ROW LEVEL SECURITY;

-- Disable RLS on object_lexicon_links table
ALTER TABLE IF EXISTS public.object_lexicon_links DISABLE ROW LEVEL SECURITY;

-- Disable RLS on lexicon_items table
ALTER TABLE IF EXISTS public.lexicon_items DISABLE ROW LEVEL SECURITY;

-- Disable RLS on lexicon_files table
ALTER TABLE IF EXISTS public.lexicon_files DISABLE ROW LEVEL SECURITY;
