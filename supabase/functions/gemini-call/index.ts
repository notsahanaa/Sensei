/**
 * Gemini Edge Function
 *
 * This function provides a secure way to call the Gemini API from the client.
 * The API key is stored as an Edge Function secret and never exposed to the client.
 *
 * Usage from React:
 * const { data, error } = await supabase.functions.invoke('gemini-call', {
 *   body: {
 *     prompt: 'Your prompt here',
 *     systemInstruction: 'Optional system instruction',
 *     temperature: 0.7,
 *     maxTokens: 1000
 *   }
 * })
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { callGemini, parseWithGemini } from '../_shared/gemini.ts'

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
    const {
      prompt,
      systemInstruction,
      temperature,
      maxTokens,
      parseInstructions,
    } = await req.json()

    // Validate required fields
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'prompt is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let result

    // If parseInstructions is provided, use parseWithGemini
    if (parseInstructions) {
      result = await parseWithGemini(prompt, parseInstructions)
    } else {
      // Otherwise, use regular callGemini
      result = await callGemini({
        prompt,
        systemInstruction,
        temperature,
        maxTokens,
      })
    }

    // Check if there was an error
    if (result.error) {
      return new Response(
        JSON.stringify({ error: result.error }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Return success response
    return new Response(
      JSON.stringify({
        text: result.text,
        success: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in gemini-call function:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
