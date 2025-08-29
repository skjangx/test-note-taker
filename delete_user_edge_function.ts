// Edge Function: delete-user
// File: supabase/functions/delete-user/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: req.headers.get('Authorization')! } 
        } 
      }
    )

    // Get the user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'No user found' }), 
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Deleting user:', user.id)

    // Create admin client for user deletion
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Delete in correct order to respect foreign key constraints
    console.log('1. Deleting note_tags...')
    const { error: noteTagsError } = await supabaseAdmin
      .from('note_tags')
      .delete()
      .in('note_id', 
        supabaseAdmin
          .from('notes')
          .select('id')
          .eq('user_id', user.id)
      )

    if (noteTagsError) {
      console.error('Error deleting note_tags:', noteTagsError)
    }

    console.log('2. Deleting notes...')
    const { error: notesError } = await supabaseAdmin
      .from('notes')
      .delete()
      .eq('user_id', user.id)

    if (notesError) {
      console.error('Error deleting notes:', notesError)
    }

    console.log('3. Deleting folders...')
    const { error: foldersError } = await supabaseAdmin
      .from('folders')
      .delete()
      .eq('user_id', user.id)

    if (foldersError) {
      console.error('Error deleting folders:', foldersError)
    }

    console.log('4. Deleting tags...')
    const { error: tagsError } = await supabaseAdmin
      .from('tags')
      .delete()
      .eq('user_id', user.id)

    if (tagsError) {
      console.error('Error deleting tags:', tagsError)
    }

    console.log('5. Deleting profile...')
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
    }

    console.log('6. Deleting auth user...')
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    )

    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete user', 
          details: deleteUserError.message 
        }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('User deletion completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User and all related data deleted successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      },
    )
  }
})
