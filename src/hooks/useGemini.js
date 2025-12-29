import { useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Custom hook for calling Gemini AI via Supabase Edge Functions
 *
 * @returns {Object} - { callGemini, parseWithGemini, loading, error }
 *
 * @example
 * const { callGemini, loading, error } = useGemini()
 *
 * const response = await callGemini({
 *   prompt: 'What is the meaning of life?',
 *   systemInstruction: 'You are a philosophical assistant',
 *   temperature: 0.7,
 *   maxTokens: 500
 * })
 */
export const useGemini = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Call Gemini AI with a prompt
   * @param {Object} params - Request parameters
   * @param {string} params.prompt - The prompt to send to Gemini
   * @param {string} [params.systemInstruction] - Optional system instruction
   * @param {number} [params.temperature=0.7] - Temperature for response generation
   * @param {number} [params.maxTokens=1000] - Maximum tokens in response
   * @returns {Promise<{text: string, success: boolean}>}
   */
  const callGemini = async ({
    prompt,
    systemInstruction,
    temperature = 0.7,
    maxTokens = 1000,
  }) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'gemini-call',
        {
          body: {
            prompt,
            systemInstruction,
            temperature,
            maxTokens,
          },
        }
      )

      if (invokeError) {
        throw new Error(invokeError.message)
      }

      if (data.error) {
        throw new Error(data.error)
      }

      setLoading(false)
      return {
        text: data.text,
        success: true,
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
      return {
        text: '',
        success: false,
        error: err.message,
      }
    }
  }

  /**
   * Parse unstructured text using Gemini
   * @param {string} userInput - The unstructured text to parse
   * @param {string} parseInstructions - Instructions for how to parse the text
   * @returns {Promise<{text: string, success: boolean}>}
   *
   * @example
   * const response = await parseWithGemini(
   *   'Work on landing page, debug auth flow',
   *   'Parse this into a JSON array of tasks with fields: name, description'
   * )
   */
  const parseWithGemini = async (userInput, parseInstructions) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'gemini-call',
        {
          body: {
            prompt: userInput,
            parseInstructions,
          },
        }
      )

      if (invokeError) {
        throw new Error(invokeError.message)
      }

      if (data.error) {
        throw new Error(data.error)
      }

      setLoading(false)
      return {
        text: data.text,
        success: true,
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
      return {
        text: '',
        success: false,
        error: err.message,
      }
    }
  }

  return {
    callGemini,
    parseWithGemini,
    loading,
    error,
  }
}
