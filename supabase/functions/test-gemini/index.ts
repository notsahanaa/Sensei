import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment');
    }

    // Get the prompt from the request body
    let prompt = "Say hello and confirm you're working!";
    try {
      const body = await req.text();
      if (body) {
        const parsed = JSON.parse(body);
        prompt = parsed.prompt || prompt;
      }
    } catch (parseError) {
      console.log('Using default prompt due to parse error:', parseError.message);
    }

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    // Extract the generated text from Gemini's response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Gemini AI is working!',
        prompt: prompt,
        response: generatedText,
        fullResponse: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
