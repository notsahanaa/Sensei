/**
 * Shared Gemini AI utilities for Supabase Edge Functions
 * Uses Vertex AI Studio API with API key authentication
 */

interface GeminiRequest {
  prompt: string
  systemInstruction?: string
  temperature?: number
  maxTokens?: number
}

interface GeminiResponse {
  text: string
  error?: string
}

/**
 * Call Vertex AI Studio Gemini API with a prompt
 */
export async function callGemini(
  request: GeminiRequest
): Promise<GeminiResponse> {
  const apiKey = Deno.env.get('GEMINI_API_KEY')

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set in environment')
  }

  const {
    prompt,
    systemInstruction = 'You are a helpful assistant.',
    temperature = 0.7,
    maxTokens = 1000,
  } = request

  try {
    // Call Vertex AI Studio API endpoint
    const endpoint = `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        systemInstruction: {
          parts: [
            {
              text: systemInstruction,
            },
          ],
        },
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(
        `Vertex AI error: ${errorData.error?.message || response.statusText}`
      )
    }

    const data = await response.json()
    const text = data.candidates[0]?.content?.parts[0]?.text || ''

    return { text }
  } catch (error) {
    console.error('Error calling Vertex AI:', error)
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Parse unstructured text into structured data using Gemini
 */
export async function parseWithGemini(
  userInput: string,
  parseInstructions: string
): Promise<GeminiResponse> {
  return callGemini({
    prompt: userInput,
    systemInstruction: parseInstructions,
    temperature: 0.3,
  })
}
