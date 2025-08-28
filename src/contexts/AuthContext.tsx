'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Helper function to ensure user profile exists
const ensureUserProfile = async (user: User) => {
  try {
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    // If profile doesn't exist, create it
    if (checkError && checkError.code === 'PGRST116') {
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: user.email?.split('@')[0] || 'User',
          email: user.email
        })

      if (createError) {
        console.error('Failed to create user profile:', createError)
      } else {
        console.log('User profile created successfully')
        
        // Create sample data for new users
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
            console.error('Folders error details:', {
              message: foldersError.message,
              details: foldersError.details,
              hint: foldersError.hint,
              code: foldersError.code
            })
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

          // Create a sample note if we have folders and tags
          if (!foldersError && !tagsError && foldersData && tagsData) {
            console.log('Creating sample note...')
            const { data: noteData, error: noteError } = await supabase
              .from('notes')
              .insert({
                user_id: user.id,
                title: 'Welcome to Your Notes!',
                content: '<p>👋 Welcome to your new note-taking app!</p><p>This is your first note. You can:</p><ul><li>📝 Create and edit notes</li><li>📁 Organize with folders</li><li>🏷️ Add tags for better organization</li><li>📌 Pin important notes</li></ul><p>Start writing and organizing your thoughts!</p>',
                folder_id: foldersData[0].id,
                is_pinned: false
              })
              .select()

            if (noteError) {
              console.error('Failed to create sample note:', noteError)
            } else {
              console.log('✅ Sample note created:', noteData)
            }
          }

          console.log('Sample data creation completed')
        } catch (sampleError) {
          console.error('Unexpected error creating sample data:', sampleError)
        }
      }
    }
  } catch (error) {
    console.error('Error ensuring user profile:', error)
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  emailConfirmationSent: boolean
  signIn: (email: string, password: string) => Promise<{ error?: AuthError }>
  signUp: (email: string, password: string) => Promise<{ error?: AuthError; emailConfirmationSent?: boolean }>
  signOut: () => Promise<void>
  resendConfirmation: (email: string) => Promise<{ error?: AuthError }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null
      setUser(user)
      
      // Ensure profile exists if user is authenticated
      if (user) {
        await ensureUserProfile(user)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      setUser(user)
      
      // Ensure profile exists if user is authenticated
      if (user) {
        await ensureUserProfile(user)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error || undefined }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (!error && data.user && !data.session) {
      // User created but needs email confirmation
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