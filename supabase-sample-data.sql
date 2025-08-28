-- Sample Data for Note-Taking App
-- Run this AFTER the main schema is created
-- This creates sample data for new users (onboarding)

-- Function to create sample data for a new user
CREATE OR REPLACE FUNCTION create_sample_data_for_user(user_id UUID)
RETURNS void AS $$
DECLARE
  work_folder_id UUID;
  personal_folder_id UUID;
  projects_folder_id UUID;
  important_tag_id UUID;
  ideas_tag_id UUID;
  todo_tag_id UUID;
  meeting_tag_id UUID;
  welcome_note_id UUID;
  meeting_note_id UUID;
  ideas_note_id UUID;
  journal_note_id UUID;
BEGIN
  -- Create sample folders
  INSERT INTO folders (user_id, name) VALUES 
    (user_id, 'Work') RETURNING id INTO work_folder_id;
  
  INSERT INTO folders (user_id, name) VALUES 
    (user_id, 'Personal') RETURNING id INTO personal_folder_id;
    
  INSERT INTO folders (user_id, name) VALUES 
    (user_id, 'Projects') RETURNING id INTO projects_folder_id;

  -- Create sample tags with colors
  INSERT INTO tags (user_id, name, color) VALUES 
    (user_id, 'Important', '#ef4444') RETURNING id INTO important_tag_id;
    
  INSERT INTO tags (user_id, name, color) VALUES 
    (user_id, 'Ideas', '#22c55e') RETURNING id INTO ideas_tag_id;
    
  INSERT INTO tags (user_id, name, color) VALUES 
    (user_id, 'To-Do', '#f97316') RETURNING id INTO todo_tag_id;
    
  INSERT INTO tags (user_id, name, color) VALUES 
    (user_id, 'Meeting', '#3b82f6') RETURNING id INTO meeting_tag_id;

  -- Create sample notes
  -- Welcome note (pinned)
  INSERT INTO notes (user_id, title, content, is_pinned) VALUES 
    (user_id, 
     'Welcome to Notes App! 👋', 
     '<h1>Welcome to your new notes app!</h1><p>This is your first note. Here''s what you can do:</p><h2>✨ Key Features</h2><ul><li><strong>Create</strong> notes using the "New Note" button </li><li><strong>Auto-save</strong> - your changes are saved automatically</li><li><strong>Search</strong> through all your notes instantly</li><li><strong>Organize</strong> with folders and colorful tags</li><li><strong>Pin</strong> important notes to keep them at the top</li></ul><h2>💡 Pro Tips</h2><ul><li>Titles are generated automatically from your content</li><li>Use <strong>bold</strong>, <em>italic</em>, and headers to format text</li><li>Create folders and tags from the sidebar</li><li>Toggle dark/light mode anytime</li></ul><p>Start writing below or create a new note. Happy note-taking! 🚀</p>',
     true
    ) RETURNING id INTO welcome_note_id;

  -- Meeting notes (in Work folder)
  INSERT INTO notes (user_id, title, content, folder_id) VALUES 
    (user_id,
     'Meeting Notes - Q1 Planning',
     '<h2>Q1 Planning Meeting</h2><p><strong>Date:</strong> Today</p><p><strong>Attendees:</strong> Team leads</p><h3>Key Points:</h3><ul><li>Budget allocation for new projects</li><li>Timeline for product launch</li><li>Resource planning</li></ul><h3>Action Items:</h3><ol><li>Review budget proposal</li><li>Schedule follow-up meetings</li><li>Prepare presentation</li></ol>',
     work_folder_id
    ) RETURNING id INTO meeting_note_id;

  -- Project ideas (in Projects folder)  
  INSERT INTO notes (user_id, title, content, folder_id) VALUES 
    (user_id,
     'Project Ideas Brainstorm',
     '<h2>New Project Ideas</h2><p>Brainstorming session for upcoming projects:</p><ul><li><strong>Mobile App:</strong> Notes sync across devices</li><li><strong>AI Integration:</strong> Smart categorization</li><li><strong>Collaboration:</strong> Shared notebooks</li><li><strong>Templates:</strong> Pre-made note formats</li></ul><p>Need to prioritize and estimate effort for each idea.</p>',
     projects_folder_id
    ) RETURNING id INTO ideas_note_id;

  -- Daily journal (in Personal folder)
  INSERT INTO notes (user_id, title, content, folder_id) VALUES 
    (user_id,
     'Daily Journal',
     '<h2>Today''s Reflections</h2><p>This is a space for daily thoughts and reflections:</p><ul><li>What went well today?</li><li>What could be improved?</li><li>Goals for tomorrow</li></ul><p>Writing helps organize thoughts and track progress over time.</p>',
     personal_folder_id
    ) RETURNING id INTO journal_note_id;

  -- Create note-tag relationships
  -- Welcome note: Important tag
  INSERT INTO note_tags (note_id, tag_id) VALUES 
    (welcome_note_id, important_tag_id);

  -- Meeting note: Meeting + Important tags  
  INSERT INTO note_tags (note_id, tag_id) VALUES 
    (meeting_note_id, meeting_tag_id),
    (meeting_note_id, important_tag_id);

  -- Ideas note: Ideas + To-Do tags
  INSERT INTO note_tags (note_id, tag_id) VALUES 
    (ideas_note_id, ideas_tag_id),
    (ideas_note_id, todo_tag_id);

  -- Journal note: no tags (to show variety)

END;
$$ LANGUAGE plpgsql;

-- Modified trigger function to create sample data for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), NEW.email);
  
  -- Create sample data for onboarding
  PERFORM create_sample_data_for_user(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger already exists from the main schema, this just updates the function