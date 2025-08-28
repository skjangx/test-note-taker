-- Complete Database Schema Reset
-- Run this in Supabase SQL Editor to reset everything

-- 1. Drop existing tables and policies (in reverse dependency order)
DROP TABLE IF EXISTS note_tags CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_sample_data_for_user(uuid) CASCADE;

-- 2. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'User',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create folders table
CREATE TABLE public.folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create tags table
CREATE TABLE public.tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#ef4444',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create notes table
CREATE TABLE public.notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create note_tags junction table
CREATE TABLE public.note_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(note_id, tag_id)
);

-- 8. Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(id);
CREATE INDEX idx_folders_user_id ON public.folders(user_id);
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_folder_id ON public.notes(folder_id);
CREATE INDEX idx_notes_updated_at ON public.notes(updated_at DESC);
CREATE INDEX idx_note_tags_note_id ON public.note_tags(note_id);
CREATE INDEX idx_note_tags_tag_id ON public.note_tags(tag_id);

-- 9. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS Policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for service role" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Folders policies
CREATE POLICY "Users can view own folders" ON public.folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders" ON public.folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON public.folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON public.folders
  FOR DELETE USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Users can view own tags" ON public.tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tags" ON public.tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags" ON public.tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags" ON public.tags
  FOR DELETE USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can view own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- Note_tags policies
CREATE POLICY "Users can view own note_tags" ON public.note_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own note_tags" ON public.note_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own note_tags" ON public.note_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()
    )
  );

-- 11. Create sample data function
CREATE OR REPLACE FUNCTION public.create_sample_data_for_user(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
  folder_personal_id UUID;
  folder_work_id UUID;
  folder_ideas_id UUID;
  tag_important_id UUID;
  tag_draft_id UUID;
  tag_meeting_id UUID;
  tag_project_id UUID;
  welcome_note_id UUID;
BEGIN
  -- Create sample folders
  INSERT INTO public.folders (user_id, name, color) VALUES
    (user_id_param, 'Personal', '#3b82f6'),
    (user_id_param, 'Work', '#22c55e'),
    (user_id_param, 'Ideas', '#f59e0b')
  RETURNING id INTO folder_personal_id, folder_work_id, folder_ideas_id;

  -- Get the first folder ID for the welcome note
  SELECT id INTO folder_personal_id FROM public.folders 
  WHERE user_id = user_id_param AND name = 'Personal' LIMIT 1;

  -- Create sample tags
  INSERT INTO public.tags (user_id, name, color) VALUES
    (user_id_param, 'important', '#ef4444'),
    (user_id_param, 'draft', '#f97316'),
    (user_id_param, 'meeting', '#8b5cf6'),
    (user_id_param, 'project', '#22c55e')
  RETURNING id INTO tag_important_id, tag_draft_id, tag_meeting_id, tag_project_id;

  -- Get tag IDs
  SELECT id INTO tag_important_id FROM public.tags 
  WHERE user_id = user_id_param AND name = 'important' LIMIT 1;

  -- Create welcome note
  INSERT INTO public.notes (user_id, title, content, folder_id, is_pinned) VALUES
    (user_id_param, 'Welcome to Your Notes!', 
     '<p>👋 Welcome to your new note-taking app!</p><p>This is your first note. You can:</p><ul><li>📝 Create and edit notes</li><li>📁 Organize with folders</li><li>🏷️ Add tags for better organization</li><li>📌 Pin important notes</li></ul><p>Start writing and organizing your thoughts!</p>', 
     folder_personal_id, true)
  RETURNING id INTO welcome_note_id;

  -- Add tag to welcome note
  INSERT INTO public.note_tags (note_id, tag_id) VALUES
    (welcome_note_id, tag_important_id);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create user profile and sample data trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), NEW.email);
  
  -- Create sample data
  PERFORM public.create_sample_data_for_user(NEW.id);
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the user creation
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Schema reset complete!
-- All tables, policies, functions, and triggers are now properly configured.