-- COPY THE CODE BELOW AND PASTE IT INTO YOUR SUPABASE EDGE FUNCTION
-- Replace ALL existing code in the Supabase editor with this:

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user from the request authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !userData.user) {
      throw new Error('Unauthorized')
    }

    const userId = userData.user.id

    // 1. Delete user data from custom tables (in correct order)
    
    // Delete note_tags first - get note IDs first
    const { data: userNotes, error: notesError } = await supabaseAdmin
      .from('notes')
      .select('id')
      .eq('user_id', userId)
    
    if (notesError) throw notesError
    
    if (userNotes && userNotes.length > 0) {
      const noteIds = userNotes.map(note => note.id)
      await supabaseAdmin
        .from('note_tags')
        .delete()
        .in('note_id', noteIds)
    }

    // Delete notes
    await supabaseAdmin.from('notes').delete().eq('user_id', userId)
    
    // Delete tags  
    await supabaseAdmin.from('tags').delete().eq('user_id', userId)
    
    // Delete folders
    await supabaseAdmin.from('folders').delete().eq('user_id', userId)
    
    // Delete profile
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    // 2. Delete the auth user (this requires service role key)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      throw deleteError
    }

    return new Response(
      JSON.stringify({ message: 'User deleted successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})