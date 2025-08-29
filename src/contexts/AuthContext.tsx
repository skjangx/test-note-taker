'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useNotesStore } from '@/lib/store/notes'
import { useFoldersStore } from '@/lib/store/folders'
import { useTagsStore } from '@/lib/store/tags'

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
          
          return !retryProfile?.sample_data_created
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
  const executionId = Math.random().toString(36).substring(7)
  console.log(`🚀 [EXEC-${executionId}] createSampleDataAsync STARTED for user:`, user.id.slice(0,8))
  
  try {
    // Create folders first
    console.log(`📁 [EXEC-${executionId}] Creating sample folders...`)
    const { data: foldersData, error: foldersError } = await supabase
      .from('folders')
      .insert([
        { user_id: user.id, name: 'Personal', color: '#3b82f6' },
        { user_id: user.id, name: 'Work', color: '#22c55e' },
        { user_id: user.id, name: 'Ideas', color: '#f59e0b' }
      ])
      .select()
    
    console.log(`📁 [EXEC-${executionId}] Folders insert result:`, { 
      success: !foldersError, 
      count: foldersData?.length || 0,
      error: foldersError 
    })

    if (foldersError) {
      console.error('Failed to create folders:', JSON.stringify(foldersError, null, 2))
    } else {
      console.log('✅ Sample folders created:', foldersData)
    }

    // Create tags second
    console.log(`🏷️ [EXEC-${executionId}] Creating sample tags...`)
    const { data: tagsData, error: tagsError } = await supabase
      .from('tags')
      .insert([
        { user_id: user.id, name: 'important', color: '#ef4444' },
        { user_id: user.id, name: 'draft', color: '#f97316' },
        { user_id: user.id, name: 'meeting', color: '#8b5cf6' },
        { user_id: user.id, name: 'project', color: '#22c55e' }
      ])
      .select()
    
    console.log(`🏷️ [EXEC-${executionId}] Tags insert result:`, { 
      success: !tagsError, 
      count: tagsData?.length || 0,
      error: tagsError 
    })

    if (tagsError) {
      console.error('Failed to create tags:', tagsError)
    } else {
      console.log('✅ Sample tags created:', tagsData)
    }

    // Create sample notes if we have folders and tags
    let notesCreated = 0
    let notesErrors = 0
    
    if (!foldersError && !tagsError && foldersData && tagsData) {
      console.log(`📝 [EXEC-${executionId}] Creating sample notes...`)
      
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
        console.log(`📝 [EXEC-${executionId}] Creating note: "${noteTemplate.title}"`)
        
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
          console.error(`❌ [EXEC-${executionId}] Failed to create note "${noteTemplate.title}":`, noteError)
          notesErrors++
        } else {
          console.log(`✅ [EXEC-${executionId}] Note created: "${noteTemplate.title}" (ID: ${noteData?.[0]?.id})`)
          notesCreated++
          
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

    // Only mark profile as having sample data created if ALL components were successful
    const allDataCreated = !foldersError && !tagsError && notesErrors === 0 && notesCreated > 0
    
    if (allDataCreated) {
      console.log('Marking profile as having sample data created...')
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ sample_data_created: true })
        .eq('id', user.id)

      if (updateError) {
        console.error('Failed to update sample_data_created flag:', updateError)
      } else {
        console.log('✅ Profile marked as having sample data created')
        console.log(`📊 Sample data summary: ${notesCreated} notes, 3 folders, 4 tags`)
      }
    } else {
      console.log('❌ Sample data creation failed - NOT marking profile as complete')
      console.log('Folders error:', foldersError)
      console.log('Tags error:', tagsError)
      console.log('Notes created:', notesCreated, 'Notes errors:', notesErrors)
      // Don't update the profile - this will allow retry on next auth event
    }

    console.log(`🏁 [EXEC-${executionId}] createSampleDataAsync COMPLETED for user:`, user.id.slice(0,8))
  } catch (sampleError) {
    console.error(`❌ [EXEC-${executionId}] Unexpected error creating sample data:`, sampleError)
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  emailConfirmationSent: boolean
  showWelcomeModal: boolean
  isSettingUpUser: boolean
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
  const [authHandlerProcessedUser, setAuthHandlerProcessedUser] = useState<string | null>(null)
  const [isSettingUpUser, setIsSettingUpUser] = useState(false)
  const sampleDataCreationInProgress = useRef<string | null>(null)
  

  // Track component lifecycle
  console.log('🏁 AuthProvider component mounted/remounted at', new Date().toISOString())

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
      const eventId = Math.random().toString(36).substring(7) // Unique ID for this event
      
      console.log(`🚨 AUTH EVENT [${eventId}] FIRED:`, { 
        event, 
        isInitialLoad, 
        hasUser: !!user, 
        userId: user?.id?.slice(0,8),
        timestamp: new Date().toISOString()
      })
      console.log(`🔍 [${eventId}] Current sampleDataCreationInProgress:`, sampleDataCreationInProgress.current)
      
      // Set user first
      setUser(user)
      
      // CRITICAL: Set loading state immediately after user for email confirmation flow
      if (!isInitialLoad && user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        console.log(`🔐 [${eventId}] User signing in - SET LOADING STATE`)
        setIsSettingUpUser(true)
      }
      
      // Debug: Check ALL events to see what's happening
      if (!isInitialLoad && user) {
        console.log(`🔍 [${eventId}] Auth event: ${event} (user: ${user.id.slice(0, 8)}...)`)
      }
      
      // Handle any user authentication event - check if they need setup
      if (!isInitialLoad && user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        console.log(`🔐 [${eventId}] User signed in, checking if setup needed...`, { 
          event, 
          userId: user.id.slice(0,8),
          currentProgress: sampleDataCreationInProgress.current 
        })
        
        // Wait for profile to exist and check if user needs sample data
        setTimeout(async () => {
          console.log(`⏰ [${eventId}] setTimeout callback started at`, new Date().toISOString())
          try {
            // Keep trying until profile exists
            let profile = null
            let attempts = 0
            const maxAttempts = 4
            
            while (!profile && attempts < maxAttempts) {
              console.log(`🔍 [${eventId}] Checking for profile (attempt ${attempts + 1}/${maxAttempts})...`)
              
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('sample_data_created')
                .eq('id', user.id)
                .maybeSingle()
              
              console.log(`🔍 [${eventId}] Profile check attempt ${attempts + 1} result:`, {
                profileData,
                error: error?.message,
                sampleDataCreated: profileData?.sample_data_created
              })
              
              if (profileData) {
                profile = profileData
                break
              }
              
              if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error(`❌ [${eventId}] Profile check error:`, error)
              }
              
              attempts++
              if (attempts < maxAttempts) {
                console.log(`⏱️ [${eventId}] Profile not ready, waiting 1 second...`)
                await new Promise(resolve => setTimeout(resolve, 1000))
              }
            }
            
            if (!profile) {
              console.log(`🔨 [${eventId}] Profile not found after all attempts, creating new profile...`)
              
              // Create the profile now
              const { error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  name: user.email?.split('@')[0] || 'User',
                  email: user.email,
                  sample_data_created: false // New profiles need sample data
                })

              if (createError) {
                console.error(`❌ [${eventId}] Failed to create profile:`, createError)
                setIsSettingUpUser(false)
                return
              }
              
              console.log(`✅ [${eventId}] Profile created successfully`)
              profile = { sample_data_created: false }
            }
            
            console.log(`✅ [${eventId}] Profile found, checking sample data status`)
            
            if (!profile.sample_data_created) {
              console.log(`🔍 [${eventId}] COMPREHENSIVE DUPLICATE CHECK:`, {
                eventId,
                userId: user.id.slice(0,8),
                profileSampleDataCreated: profile.sample_data_created,
                currentProgress: sampleDataCreationInProgress.current,
                willSkipInProgress: sampleDataCreationInProgress.current === user.id,
                timestamp: new Date().toISOString()
              })
              
              // Primary check: useRef for immediate deduplication
              if (sampleDataCreationInProgress.current === user.id) {
                console.log(`🔄 [${eventId}] Sample data creation already in progress (useRef check), skipping...`)
                return
              }
              
              // Secondary check: verify no sample data exists in database
              console.log(`🔍 [${eventId}] Double-checking: verifying no sample data exists in database...`)
              const { data: existingNotes } = await supabase
                .from('notes')
                .select('id')
                .eq('user_id', user.id)
                .limit(1)
              
              const { data: existingFolders } = await supabase
                .from('folders')
                .select('id')
                .eq('user_id', user.id)
                .limit(1)
              
              if (existingNotes && existingNotes.length > 0) {
                console.log(`⚠️ [${eventId}] Sample data already exists in database (found ${existingNotes.length} notes), marking profile as complete...`)
                // Mark profile as complete to prevent future attempts
                await supabase
                  .from('profiles')
                  .update({ sample_data_created: true })
                  .eq('id', user.id)
                return
              }
              
              if (existingFolders && existingFolders.length > 0) {
                console.log(`⚠️ [${eventId}] Sample data already exists in database (found ${existingFolders.length} folders), marking profile as complete...`)
                // Mark profile as complete to prevent future attempts
                await supabase
                  .from('profiles')
                  .update({ sample_data_created: true })
                  .eq('id', user.id)
                return
              }
              
              console.log(`🆕 [${eventId}] New user confirmed - no existing data found, creating sample data...`, {
                eventId,
                userId: user.id.slice(0,8),
                settingProgress: true,
                timestamp: new Date().toISOString()
              })
              
              // Set in-progress flag
              sampleDataCreationInProgress.current = user.id
              console.log(`✅ [${eventId}] Progress flag set (useRef only)`)
              
              try {
                await createSampleDataAsync(user)
                console.log(`✅ [${eventId}] Sample data created, reloading app data...`)
                
                // Reload all data after sample data creation
                try {
                  await Promise.all([
                    useNotesStore.getState().loadNotes(),
                    useFoldersStore.getState().loadFolders(),
                    useTagsStore.getState().loadTags()
                  ])
                  console.log(`✅ [${eventId}] App data reloaded after sample data creation`)
                } catch (reloadError) {
                  console.error(`❌ [${eventId}] Failed to reload app data:`, reloadError)
                }
                
                setShowWelcomeModal(true)
              } finally {
                sampleDataCreationInProgress.current = null
                console.log(`🧹 [${eventId}] Progress flag cleared`)
              }
            } else {
              console.log(`👤 [${eventId}] Existing user, no setup needed`)
            }
            
            // Always clear loading state when done
            setIsSettingUpUser(false)
            console.log(`🏁 [${eventId}] setTimeout callback completed at`, new Date().toISOString())
          } catch (error) {
            console.error(`❌ [${eventId}] Error checking user setup:`, error)
            setIsSettingUpUser(false) // Clear loading state on error too
          }
        }, 500)
      }
      
      // Skip background profile check - let the main auth handler take care of everything
      // This was causing race conditions and duplicate sample data creation
      
      isInitialLoad = false
    })

    return () => {
      console.log('🚪 AuthProvider component unmounting, unsubscribing auth listener')
      subscription.unsubscribe()
    }
  }, [])

  // Check if we're in React Strict Mode (which runs effects twice)
  useEffect(() => {
    console.log('🔍 useEffect running - React Strict Mode might cause this to run twice in development')
    return () => {
      console.log('🔍 useEffect cleanup - React Strict Mode might cause this to run twice in development')
    }
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
        // Check if user needs sample data (works for both manual and email confirmation)
        const { data: profile } = await supabase
          .from('profiles')
          .select('sample_data_created')
          .eq('id', data.user.id)
          .maybeSingle()
        
        isNewUser = !profile?.sample_data_created
        
        // If new user, create sample data and show welcome modal
        if (isNewUser) {
          console.log('🆕 New user detected, creating sample data...')
          await createSampleDataAsync(data.user)
          console.log('✅ Sample data created, showing welcome modal')
          setShowWelcomeModal(true)
        } else {
          console.log('👤 Existing user, showing welcome toast')
        }
      } catch (err) {
        console.error('Error checking user status:', err)
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
      // Profile creation will happen during first sign-in when user exists in auth.users table
      console.log('🆕 User signup successful, profile will be created on first sign-in');
      
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
    isSettingUpUser,
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