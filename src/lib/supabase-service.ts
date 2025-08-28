import { supabase } from './supabase'
import { Note, Folder, Tag } from '@/types'

export interface DatabaseNote {
  id: string
  user_id: string
  title: string
  content: string
  folder_id: string | null
  is_pinned: boolean
  created_at: string
  updated_at: string
  // Relations
  folder?: DatabaseFolder
  note_tags?: Array<{
    tag_id: string
    tags: DatabaseTag
  }>
}

export interface DatabaseFolder {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface DatabaseTag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

// Transform database objects to app types
const transformNote = (dbNote: DatabaseNote): Note => ({
  id: dbNote.id,
  title: dbNote.title,
  content: dbNote.content,
  folderId: dbNote.folder_id || undefined,
  tagIds: dbNote.note_tags?.map(nt => nt.tags.id) || [],
  isPinned: dbNote.is_pinned,
  createdAt: dbNote.created_at,
  updatedAt: dbNote.updated_at,
})

const transformFolder = (dbFolder: DatabaseFolder): Folder => ({
  id: dbFolder.id,
  name: dbFolder.name,
  color: dbFolder.color,
  createdAt: dbFolder.created_at,
  updatedAt: dbFolder.updated_at,
})

const transformTag = (dbTag: DatabaseTag): Tag => ({
  id: dbTag.id,
  name: dbTag.name,
  color: dbTag.color,
  createdAt: dbTag.created_at,
  updatedAt: dbTag.updated_at,
})

export const supabaseService = {
  // Notes
  async getNotes(): Promise<Note[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        folder:folders(*),
        note_tags(
          tag_id,
          tags(*)
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data?.map(transformNote) || []
  },

  async createNote(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: noteData.title,
        content: noteData.content,
        folder_id: noteData.folderId,
        is_pinned: noteData.isPinned,
      })
      .select()
      .single()

    if (error) throw error

    // Add tags if provided
    if (noteData.tagIds && noteData.tagIds.length > 0) {
      const tagInserts = noteData.tagIds.map(tagId => ({
        note_id: data.id,
        tag_id: tagId,
      }))

      const { error: tagError } = await supabase
        .from('note_tags')
        .insert(tagInserts)

      if (tagError) throw tagError
    }

    // Fetch the complete note with relations
    const { data: fullNote, error: fetchError } = await supabase
      .from('notes')
      .select(`
        *,
        folder:folders(*),
        note_tags(
          tag_id,
          tags(*)
        )
      `)
      .eq('id', data.id)
      .single()

    if (fetchError) throw fetchError
    return transformNote(fullNote)
  },

  async updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note> {
    console.log('🔍 supabaseService.updateNote called:', { id, updates });
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    console.log('👤 Current user ID:', user.id);

    const updateData: Record<string, unknown> = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.content !== undefined) updateData.content = updates.content
    if (updates.folderId !== undefined) updateData.folder_id = updates.folderId
    if (updates.isPinned !== undefined) updateData.is_pinned = updates.isPinned

    console.log('🔄 Note fields to update:', updateData);

    let data;

    // Only update notes table if there are actual note fields to update
    if (Object.keys(updateData).length > 0) {
      console.log('📝 Updating notes table...');
      const { data: noteData, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select(`
          *,
          folder:folders(*),
          note_tags(
            tag_id,
            tags(*)
          )
        `)
        .single()

      if (error) {
        console.error('❌ Notes table update failed:', error);
        throw error
      }
      
      console.log('✅ Notes table updated successfully:', noteData);
      data = noteData;
    } else {
      console.log('⏩ Skipping notes table update (no fields to update)');
      // If no note fields to update, just fetch the current note
      const { data: noteData, error: fetchError } = await supabase
        .from('notes')
        .select(`
          *,
          folder:folders(*),
          note_tags(
            tag_id,
            tags(*)
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        console.error('❌ Failed to fetch current note:', fetchError);
        throw fetchError;
      }
      data = noteData;
    }

    // Update tags if provided
    if (updates.tagIds !== undefined) {
      console.log('🏷️ Updating tags for note:', id, 'New tags:', updates.tagIds);
      
      // Remove existing tags
      console.log('🗑️ Removing existing tags...');
      const { error: deleteError } = await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', id)

      if (deleteError) {
        console.error('❌ Failed to delete existing tags:', deleteError);
        throw deleteError;
      }
      console.log('✅ Existing tags removed');

      // Add new tags
      if (updates.tagIds.length > 0) {
        console.log('➕ Adding new tags:', updates.tagIds);
        const tagInserts = updates.tagIds.map(tagId => ({
          note_id: id,
          tag_id: tagId,
        }))

        const { error: tagError } = await supabase
          .from('note_tags')
          .insert(tagInserts)

        if (tagError) {
          console.error('❌ Failed to insert new tags:', tagError);
          throw tagError;
        }
        console.log('✅ New tags added successfully');
      }
    }

    // If we updated tags, fetch the complete note again to get updated relationships
    if (updates.tagIds !== undefined) {
      console.log('🔄 Fetching complete note with updated tags...');
      const { data: fullNote, error: fetchError } = await supabase
        .from('notes')
        .select(`
          *,
          folder:folders(*),
          note_tags(
            tag_id,
            tags(*)
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        console.error('❌ Failed to fetch updated note:', fetchError);
        throw fetchError;
      }
      console.log('✅ Successfully fetched updated note with tags:', fullNote);
      return transformNote(fullNote)
    } else {
      // Use the data from the notes table fetch/update (already has relationships)
      console.log('✅ Using data from notes operation (no tags changed)');
      return transformNote(data)
    }
  },

  async deleteNote(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },

  // Folders
  async getFolders(): Promise<Folder[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (error) throw error
    return data?.map(transformFolder) || []
  },

  async createFolder(folderData: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Folder> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('folders')
      .insert({
        user_id: user.id,
        name: folderData.name,
        color: folderData.color,
      })
      .select()
      .single()

    if (error) throw error
    return transformFolder(data)
  },

  async updateFolder(id: string, updates: Partial<Omit<Folder, 'id' | 'createdAt'>>): Promise<Folder> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('folders')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return transformFolder(data)
  },

  async deleteFolder(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },

  // Tags
  async getTags(): Promise<Tag[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (error) throw error
    return data?.map(transformTag) || []
  },

  async createTag(tagData: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tag> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: user.id,
        name: tagData.name,
        color: tagData.color,
      })
      .select()
      .single()

    if (error) throw error
    return transformTag(data)
  },

  async updateTag(id: string, updates: Partial<Omit<Tag, 'id' | 'createdAt'>>): Promise<Tag> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return transformTag(data)
  },

  async deleteTag(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },
}