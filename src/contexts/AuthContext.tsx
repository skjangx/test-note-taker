'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Helper function to ensure user profile exists and check if sample data is needed
const ensureUserProfile = async (user: User): Promise<boolean> => {
  try {
    // Add a small delay to ensure user exists in auth.users table
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check if profile exists and if sample data has been created
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id, sample_data_created')
      .eq('id', user.id)
      .maybeSingle() // Use maybeSingle instead of single to avoid 406 errors

    console.log('Profile check result:', { existingProfile, checkError })

    // If no profile exists, create it
    if (!existingProfile && !checkError) {
      console.log('Creating new profile for user:', user.id)
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: user.email?.split('@')[0] || 'User',
          email: user.email,
          sample_data_created: false // New profiles need sample data
        })

      if (createError) {
        console.error('Failed to create user profile:', createError)
        // If it's a foreign key error, the user might not exist yet in auth.users
        if (createError.code === '23503') {
          console.log('User not yet available in auth.users table, will retry later')
          return false
        }
        // If profile already exists (duplicate key), check if it needs sample data
        if (createError.code === '23505') {
          console.log('Profile already exists, checking sample data status')
          // Try to get the existing profile again
          const { data: retryProfile } = await supabase
            .from('profiles')
            .select('sample_data_created')
            .eq('id', user.id)
            .maybeSingle()
          
          return !retryProfile?.sample_data_created || false
        }
        return false
      } else {
        console.log('User profile created successfully - needs sample data')
        return true // New profile created, needs sample data
      }
    }
    
    // Profile exists, check if sample data has been created
    if (existingProfile) {
      const needsSampleData = !existingProfile.sample_data_created
      console.log(`User profile status: ${needsSampleData ? 'existing profile - needs sample data' : 'existing profile - sample data already created'}`)
      return needsSampleData
    }
    
    // If there was an error but not a "not found" error
    if (checkError) {
      console.error('Error checking profile:', checkError)
      return false
    }
    
    return false
  } catch (error) {
    console.error('Error ensuring user profile:', error)
    return false
  }
}


// Helper function to create sample data (run in background)
const createSampleDataAsync = async (user: User) => {
  try {
    // Create folders first
    console.log('Creating sample folders...')
    const { data: foldersData, error: foldersError } = await supabase
      .from('folders')
      .insert([
        { user_id: user.id, name: 'Personal', color: '#3b82f6' },
        { user_id: user.id, name: 'Work', color: '#22c55e' },
        { user_id: user.id, name: 'Ideas', color: '#f59e0b' }
      ])
      .select()

    if (foldersError) {
      console.error('Failed to create folders:', JSON.stringify(foldersError, null, 2))
    } else {
      console.log('✅ Sample folders created:', foldersData)
    }

    // Create tags second
    console.log('Creating sample tags...')
    const { data: tagsData, error: tagsError } = await supabase
      .from('tags')
      .insert([
        { user_id: user.id, name: 'important', color: '#ef4444' },
        { user_id: user.id, name: 'draft', color: '#f97316' },
        { user_id: user.id, name: 'meeting', color: '#8b5cf6' },
        { user_id: user.id, name: 'project', color: '#22c55e' }
      ])
      .select()

    if (tagsError) {
      console.error('Failed to create tags:', tagsError)
    } else {
      console.log('✅ Sample tags created:', tagsData)
    }

    // Create sample notes if we have folders and tags
    if (!foldersError && !tagsError && foldersData && tagsData) {
      console.log('Creating sample notes...')
      
      const sampleNotes = [
        {
          title: 'Welcome to Your Notes! 🎉',
          content: '<p>👋 Welcome to your new note-taking app!</p><p>This is your first note. You can:</p><ul><li>📝 Create and edit notes</li><li>📁 Organize with folders</li><li>🏷️ Add tags for better organization</li><li>📌 Pin important notes</li></ul><p>Start writing and organizing your thoughts!</p>',
          folder_id: foldersData[0].id, // Personal
          is_pinned: true,
          tags: ['important']
        },
        {
          title: 'Project Planning Template',
          content: '<h2>Project Overview</h2><p>Use this template for planning your next project.</p><h3>Goals:</h3><ul><li>Define clear objectives</li><li>Set realistic timelines</li><li>Identify key resources</li></ul><h3>Next Steps:</h3><p>List your immediate action items here.</p>',
          folder_id: foldersData[1].id, // Work
          is_pinned: false,
          tags: ['project', 'draft']
        },
        {
          title: 'Meeting Notes - Team Sync',
          content: '<h2>Team Meeting Notes</h2><p><strong>Date:</strong> Today</p><p><strong>Attendees:</strong> Team members</p><h3>Discussion Points:</h3><ul><li>Project updates</li><li>Upcoming deadlines</li><li>Resource allocation</li></ul><h3>Action Items:</h3><ul><li>Follow up on pending tasks</li><li>Schedule next review</li></ul>',
          folder_id: foldersData[1].id, // Work
          is_pinned: false,
          tags: ['meeting', 'project']
        },
        {
          title: 'Creative Ideas & Inspiration',
          content: '<h2>💡 Brainstorming Session</h2><p>Capturing creative thoughts and inspirations:</p><ul><li><strong>App Feature Ideas:</strong> What would make this app even better?</li><li><strong>Design Concepts:</strong> Visual improvements and user experience</li><li><strong>Content Ideas:</strong> Topics to explore and write about</li></ul><p><em>"The best ideas come when you least expect them."</em></p>',
          folder_id: foldersData[2].id, // Ideas
          is_pinned: false,
          tags: ['draft']
        },
        {
          title: 'Quick Daily Notes',
          content: '<h2>Daily Thoughts</h2><p>A space for quick notes, reminders, and daily reflections:</p><ul><li>Things to remember</li><li>Interesting observations</li><li>Random thoughts</li><li>Quick reminders</li></ul><p>Use this note for anything that comes to mind throughout the day!</p>',
          folder_id: foldersData[0].id, // Personal
          is_pinned: false,
          tags: ['draft']
        },
        {
          title: 'Learning & Resources',
          content: '<h2>📚 Knowledge Collection</h2><p>Keep track of learning resources and insights:</p><h3>Currently Learning:</h3><ul><li>New technologies</li><li>Best practices</li><li>Industry trends</li></ul><h3>Resources to Check:</h3><ul><li>Recommended articles</li><li>Useful tutorials</li><li>Important documentation</li></ul>',
          folder_id: foldersData[2].id, // Ideas
          is_pinned: false,
          tags: ['important', 'draft']
        }
      ]

      for (const noteTemplate of sampleNotes) {
        const { data: noteData, error: noteError } = await supabase
          .from('notes')
          .insert({
            user_id: user.id,
            title: noteTemplate.title,
            content: noteTemplate.content,
            folder_id: noteTemplate.folder_id,
            is_pinned: noteTemplate.is_pinned
          })
          .select()

        if (noteError) {
          console.error('Failed to create sample note:', noteTemplate.title, noteError)
        } else {
          console.log('✅ Sample note created:', noteTemplate.title)
          
          // Add tags to the note
          if (noteData?.[0] && noteTemplate.tags) {
            for (const tagName of noteTemplate.tags) {
              const tag = tagsData?.find(t => t.name === tagName)
              if (tag) {
                const { error: tagLinkError } = await supabase
                  .from('note_tags')
                  .insert({
                    note_id: noteData[0].id,
                    tag_id: tag.id
                  })
                
                if (tagLinkError) {
                  console.error('Failed to link tag:', tagName, 'to', noteTemplate.title, tagLinkError)
                } else {
                  console.log('✅ Tag linked:', tagName, 'to', noteTemplate.title)
                }
              }
            }
          }
        }
      }
    }

    // Mark profile as having sample data created
    console.log('Marking profile as having sample data created...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ sample_data_created: true })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update sample_data_created flag:', updateError)
    } else {
      console.log('✅ Profile marked as having sample data created')
    }

    console.log('Sample data creation completed')
  } catch (sampleError) {
    console.error('Unexpected error creating sample data:', sampleError)
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  emailConfirmationSent: boolean
  showWelcomeModal: boolean
  setShowWelcomeModal: (show: boolean) => void
  signIn: (email: string, password: string) => Promise<{ error?: AuthError; isNewUser?: boolean }>
  signUp: (email: string, password: string) => Promise<{ error?: AuthError; emailConfirmationSent?: boolean }>
  signOut: () => Promise<void>
  resendConfirmation: (email: string) => Promise<{ error?: AuthError }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  useEffect(() => {
    let isInitialLoad = true
    
    // Get initial session quickly without heavy operations
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null
      setUser(user)
      setLoading(false) // Set loading to false immediately for initial session
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null
      setUser(user)
      
      console.log('🔄 Auth state changed:', { event, isInitialLoad, hasUser: !!user })
      
      // Only do heavy operations for actual auth events (not initial session)
      if (!isInitialLoad && user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        console.log(`🔐 User authenticated via ${event}, checking if user needs sample data...`)
        
        // Check if user needs sample data
        const needsSampleData = await ensureUserProfile(user)
        if (needsSampleData) {
          console.log('🆕 New user detected (profile created), creating sample data...')
          try {
            await createSampleDataAsync(user)
            console.log('✅ Sample data created for new user')
            setShowWelcomeModal(true)
          } catch (error) {
            console.error('❌ Failed to create sample data for new user:', error)
          }
        } else {
          console.log('👤 Existing user, no sample data needed')
        }
      }
      
      // For page refreshes, ensure profile exists in background (non-blocking)
      if (user && isInitialLoad) {
        // Run profile check in background without blocking UI
        ensureUserProfile(user).catch(error => {
          console.error('Background profile check failed:', error)
        })
      }
      
      isInitialLoad = false
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // If signin successful, check if this is a new user (sample data not yet created)
    let isNewUser = false
    if (!error && data.user) {
      try {
        // Check if user profile exists and if sample data has been created
        const { data: profile } = await supabase
          .from('profiles')
          .select('sample_data_created')
          .eq('id', data.user.id)
          .maybeSingle()
        
        // User is considered "new" if they don't have sample data created yet
        isNewUser = !profile?.sample_data_created
        console.log('Sign-in user status:', { hasProfile: !!profile, sampleDataCreated: profile?.sample_data_created, isNewUser })
      } catch (err) {
        console.error('Error checking user status during signin:', err)
      }
    }
    
    return { error: error || undefined, isNewUser }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (!error && data.user && !data.session) {
      // User created but needs email confirmation
      // Just ensure profile exists, sample data will be created when they confirm and sign in
      try {
        console.log('🆕 Ensuring user profile exists for new signup...');
        await ensureUserProfile(data.user);
        console.log('✅ User profile ensured for new signup');
      } catch (profileError) {
        console.error('❌ Failed to ensure user profile during signup:', profileError);
        // Don't fail the signup process if profile creation fails
      }
      
      setEmailConfirmationSent(true)
      return { error: error || undefined, emailConfirmationSent: true }
    }
    
    return { error: error || undefined, emailConfirmationSent: false }
  }

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })
    return { error: error || undefined }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    loading,
    emailConfirmationSent,
    showWelcomeModal,
    setShowWelcomeModal,
    signIn,
    signUp,
    signOut,
    resendConfirmation,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}