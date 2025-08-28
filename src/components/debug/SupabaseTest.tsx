'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SupabaseTest() {
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testConnection = async () => {
    addResult('Testing Supabase connection...')
    
    try {
      // Test 1: Check auth
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        addResult(`❌ Auth error: ${authError.message}`)
        return
      }
      
      if (!user) {
        addResult('❌ No authenticated user found')
        return
      }
      
      addResult(`✅ User authenticated: ${user.email}`)
      addResult(`User ID: ${user.id}`)

      // Test 2: Check if notes table exists and is accessible
      addResult('Testing notes table access...')
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('count')
        .limit(1)

      if (notesError) {
        addResult(`❌ Notes table error: ${JSON.stringify(notesError)}`)
      } else {
        addResult('✅ Notes table accessible')
      }

      // Test 3: Check folders table
      addResult('Testing folders table access...')
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('count')
        .limit(1)

      if (foldersError) {
        addResult(`❌ Folders table error: ${JSON.stringify(foldersError)}`)
      } else {
        addResult('✅ Folders table accessible')
      }

      // Test 4: Check tags table
      addResult('Testing tags table access...')
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('count')
        .limit(1)

      if (tagsError) {
        addResult(`❌ Tags table error: ${JSON.stringify(tagsError)}`)
      } else {
        addResult('✅ Tags table accessible')
      }

      // Test 5: Check if user profile exists
      addResult('Checking user profile...')
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        addResult(`❌ Profile check error: ${JSON.stringify(profileError)}`)
      } else if (!profileData) {
        addResult('❌ User profile missing - creating it...')
        
        // Create the missing profile
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.email?.split('@')[0] || 'User',
            email: user.email
          })
          .select()
          .single()

        if (createProfileError) {
          addResult(`❌ Profile creation error: ${JSON.stringify(createProfileError)}`)
        } else {
          addResult('✅ User profile created successfully')
          
          // Create sample data for new user
          addResult('Creating sample data...')
          try {
            // Create sample folders
            const { data: sampleFolders } = await supabase
              .from('folders')
              .insert([
                { user_id: user.id, name: 'Personal', color: '#3b82f6' },
                { user_id: user.id, name: 'Work', color: '#22c55e' },
                { user_id: user.id, name: 'Ideas', color: '#f59e0b' }
              ])
              .select()

            // Create sample tags  
            const { data: sampleTags } = await supabase
              .from('tags')
              .insert([
                { user_id: user.id, name: 'important', color: '#ef4444' },
                { user_id: user.id, name: 'draft', color: '#f97316' },
                { user_id: user.id, name: 'meeting', color: '#8b5cf6' },
                { user_id: user.id, name: 'project', color: '#22c55e' }
              ])
              .select()

            addResult('✅ Sample data created successfully')
          } catch (sampleError) {
            addResult(`⚠️ Sample data creation failed: ${sampleError}`)
          }
        }
      } else {
        addResult(`✅ User profile exists: ${profileData.name}`)
      }

      // Test 6: Try to insert a simple note
      addResult('Testing note insertion...')
      const { data: insertData, error: insertError } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: 'Test Note',
          content: 'This is a test note',
          folder_id: null,
          is_pinned: false,
        })
        .select()
        .single()

      if (insertError) {
        addResult(`❌ Insert error: ${JSON.stringify(insertError)}`)
      } else {
        addResult('✅ Note inserted successfully')
        addResult(`Inserted note ID: ${insertData?.id}`)
        
        // Clean up - delete the test note
        if (insertData?.id) {
          await supabase.from('notes').delete().eq('id', insertData.id)
          addResult('🧹 Test note cleaned up')
        }
      }

    } catch (error) {
      addResult(`❌ Unexpected error: ${error}`)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>🔍 Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testConnection} className="w-full">
          Run Supabase Tests
        </Button>
        
        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}