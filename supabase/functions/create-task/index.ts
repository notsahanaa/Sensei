import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callGemini } from '../_shared/gemini.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateTaskRequest {
  taskName: string
  description?: string
  notes?: string
  projectId: string
  domainId: string
  version?: string
  measureType?: string
  measureUnit?: string
  scheduledDate?: string | null
  targetValue?: number
  timeboxValue?: number
  timeboxUnit?: string
}

interface GeminiSimilarityResult {
  matchFound: boolean
  matchedCanonicalTaskId?: string
  confidence: number
  reasoning?: string
}

async function findSimilarCanonicalTask(
  newTask: { taskName: string; description?: string; domainName: string },
  existingCanonicals: Array<{ id: string; canonical_name: string; description?: string }>
): Promise<GeminiSimilarityResult> {
  const systemInstruction = `You are a task similarity analyzer. Determine if a new task matches any existing canonical tasks.

Return JSON with this structure:
{
  "matchFound": true/false,
  "matchedCanonicalTaskId": "uuid or null",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation"
}

Confidence scale:
- 0.9-1.0: Very high (same activity, different wording)
- 0.75-0.89: High (similar activity)
- 0.5-0.74: Medium (related but different)
- 0.0-0.49: Low (different activities)`

  const canonicalsList = existingCanonicals
    .map(c => `- ${c.canonical_name}: ${c.description || 'No description'}`)
    .join('\n')

  const prompt = `New Task:
Name: ${newTask.taskName}
Description: ${newTask.description || 'No description'}
Domain: ${newTask.domainName}

Existing Canonical Tasks in this domain:
${canonicalsList}

Determine if the new task matches any existing canonical task.`

  try {
    const result = await callGemini({
      prompt,
      systemInstruction,
      temperature: 0.2,
      maxTokens: 300,
    })

    if (result.error) {
      console.error('Gemini error:', result.error)
      return { matchFound: false, confidence: 0 }
    }

    // Parse JSON response
    const parsed = JSON.parse(result.text)
    return parsed
  } catch (error) {
    console.error('Error parsing Gemini response:', error)
    return { matchFound: false, confidence: 0 }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: CreateTaskRequest = await req.json()
    const {
      taskName,
      description,
      notes,
      projectId,
      domainId,
      version,
      measureType,
      measureUnit,
      scheduledDate,
      targetValue,
      timeboxValue,
      timeboxUnit,
    } = body

    // Validate required fields
    if (!taskName || !projectId || !domainId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: taskName, projectId, domainId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get domain name for Gemini context
    const { data: domain } = await supabaseClient
      .from('domains')
      .select('name')
      .eq('id', domainId)
      .single()

    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch existing canonical tasks filtered by domain AND version
    let canonicalsQuery = supabaseClient
      .from('canonical_tasks')
      .select('id, canonical_name, description')
      .eq('user_id', user.id)
      .eq('domain_id', domainId)

    // Handle version filtering (null vs empty string)
    if (version) {
      canonicalsQuery = canonicalsQuery.eq('version', version)
    } else {
      canonicalsQuery = canonicalsQuery.is('version', null)
    }

    const { data: existingCanonicals } = await canonicalsQuery

    let canonicalTaskId: string | null = null

    // Check similarity with Gemini if canonicals exist
    if (existingCanonicals && existingCanonicals.length > 0) {
      try {
        const geminiResult = await findSimilarCanonicalTask(
          { taskName, description, domainName: domain.name },
          existingCanonicals
        )

        console.log('Gemini similarity result:', geminiResult)

        if (geminiResult.matchFound && geminiResult.confidence >= 0.75) {
          canonicalTaskId = geminiResult.matchedCanonicalTaskId!
        }
      } catch (error) {
        console.error('Gemini call failed, using fallback:', error)
        // Fallback: exact string match
        const exactMatch = existingCanonicals.find(
          c => c.canonical_name.toLowerCase() === taskName.trim().toLowerCase()
        )
        if (exactMatch) canonicalTaskId = exactMatch.id
      }
    }

    // Create new canonical task if no match found
    if (!canonicalTaskId) {
      const { data: newCanonical, error: canonicalError } = await supabaseClient
        .from('canonical_tasks')
        .insert({
          user_id: user.id,
          project_id: projectId,
          domain_id: domainId,
          canonical_name: taskName.trim(),
          description: description || null,
          version: version || null,
          measure_type: measureType || null,
          measure_unit: measureUnit || null,
        })
        .select()
        .single()

      if (canonicalError) {
        console.error('Error creating canonical task:', canonicalError)
        return new Response(
          JSON.stringify({ error: 'Failed to create canonical task', details: canonicalError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      canonicalTaskId = newCanonical.id
    }

    // Create task instance
    const { data: taskInstance, error: taskError } = await supabaseClient
      .from('task_instances')
      .insert({
        user_id: user.id,
        project_id: projectId,
        domain_id: domainId,
        canonical_task_id: canonicalTaskId,
        task_name: taskName,
        description: description || null,
        notes: notes || null,
        scheduled_date: scheduledDate || null,
        target_value: targetValue || null,
        timebox_value: timeboxValue || null,
        timebox_unit: timeboxUnit || null,
        status: 'pending',
      })
      .select(`
        *,
        domain:domains(id, name),
        canonical_task:canonical_tasks(id, canonical_name, version, measure_type, measure_unit)
      `)
      .single()

    if (taskError) {
      console.error('Error creating task instance:', taskError)
      return new Response(
        JSON.stringify({ error: 'Failed to create task instance', details: taskError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ data: taskInstance }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
