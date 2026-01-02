import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useTaskStore = create((set, get) => ({
  // State
  tasks: [],
  isLoading: false,
  error: null,

  // Fetch tasks for a specific date
  fetchTasksForDate: async (projectId, date) => {
    try {
      set({ isLoading: true, error: null })

      const { data, error } = await supabase
        .from('task_instances')
        .select(`
          *,
          domain:domains(id, name)
        `)
        .eq('project_id', projectId)
        .eq('scheduled_date', date)
        .order('created_at', { ascending: false })
        .range(0, 99) // Pagination: 100 per page

      if (error) throw error

      set({ tasks: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching tasks:', error)
      set({ isLoading: false, error: error.message })
    }
  },

  // Fetch backlog tasks (scheduled_date IS NULL)
  fetchBacklogTasks: async (projectId) => {
    try {
      set({ isLoading: true, error: null })

      const { data, error } = await supabase
        .from('task_instances')
        .select(`
          *,
          domain:domains(id, name)
        `)
        .eq('project_id', projectId)
        .is('scheduled_date', null)
        .order('created_at', { ascending: false })
        .range(0, 99)

      if (error) throw error

      set({ tasks: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching backlog:', error)
      set({ isLoading: false, error: error.message })
    }
  },

  // Create task instance with edge function (canonical grouping) and fallback
  createTask: async (taskData) => {
    try {
      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Try edge function first (with canonical task grouping via Gemini)
      try {
        console.log('🔵 Attempting to call edge function...')
        const { data: edgeFunctionResult, error: edgeFunctionError } = await supabase.functions.invoke('create-task', {
          body: {
            taskName: taskData.taskName,
            description: taskData.description || null,
            notes: taskData.notes || null,
            projectId: taskData.projectId,
            domainId: taskData.domainId,
            version: taskData.version || null,
            measureType: taskData.measureType || null,
            measureUnit: taskData.measureUnit || null,
            targetValue: taskData.targetValue || null,
            timeboxValue: taskData.timeboxValue || null,
            timeboxUnit: taskData.timeboxUnit || null,
            scheduledDate: taskData.scheduledDate || null,
          }
        })

        console.log('🔍 Edge function response:', { edgeFunctionResult, edgeFunctionError })

        // Log the full error details
        if (edgeFunctionError) {
          console.error('❌ Edge function error details:', {
            message: edgeFunctionError.message,
            context: edgeFunctionError.context,
            details: edgeFunctionResult
          })
        }

        if (edgeFunctionResult?.data && !edgeFunctionError) {
          console.log('✅ Task created via edge function with canonical grouping')
          console.log('📋 Task data:', edgeFunctionResult.data)

          // Optimistic update: add to local state
          set((state) => ({
            tasks: [edgeFunctionResult.data, ...state.tasks]
          }))

          return { success: true, data: edgeFunctionResult.data, method: 'edge-function' }
        }

        // Edge function returned error, fall through to fallback
        console.warn('⚠️ Edge function returned error, using fallback:', edgeFunctionError)
      } catch (edgeFunctionException) {
        // Edge function threw exception, fall through to fallback
        console.error('❌ Edge function failed with exception:', edgeFunctionException)
        console.warn('⚠️ Using direct insert fallback')
      }

      // FALLBACK: Direct insert without canonical grouping
      console.log('⚠️ Using direct insert fallback (no canonical grouping)')

      const { data, error } = await supabase
        .from('task_instances')
        .insert({
          user_id: user.id,
          task_name: taskData.taskName,
          description: taskData.description || null,
          notes: taskData.notes || null,
          project_id: taskData.projectId,
          domain_id: taskData.domainId,
          version: taskData.version || null,
          measure_type: taskData.measureType || null,
          measure_unit: taskData.measureUnit || null,
          target_value: taskData.targetValue || null,
          timebox_value: taskData.timeboxValue || null,
          timebox_unit: taskData.timeboxUnit || null,
          scheduled_date: taskData.scheduledDate || null,
          status: 'pending',
          canonical_task_id: null // Explicitly set to null for fallback
        })
        .select(`
          *,
          domain:domains(id, name)
        `)
        .single()

      if (error) throw error

      // Optimistic update: add to local state
      set((state) => ({
        tasks: [data, ...state.tasks]
      }))

      return { success: true, data, method: 'direct-insert-fallback' }
    } catch (error) {
      console.error('Error creating task:', error)
      return { success: false, error: error.message || 'Failed to create task' }
    }
  },

  // Update task instance
  updateTask: async (taskId, updates) => {
    try {
      const { data, error } = await supabase
        .from('task_instances')
        .update(updates)
        .eq('id', taskId)
        .select(`
          *,
          domain:domains(id, name)
        `)
        .single()

      if (error) throw error

      // Update local state
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? data : t)
      }))

      return { success: true, data }
    } catch (error) {
      console.error('Error updating task:', error)
      return { success: false, error: error.message }
    }
  },

  // Delete task instance
  deleteTask: async (taskId) => {
    try {
      const { error } = await supabase
        .from('task_instances')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      // Update local state
      set((state) => ({
        tasks: state.tasks.filter(t => t.id !== taskId)
      }))

      return { success: true }
    } catch (error) {
      console.error('Error deleting task:', error)
      return { success: false, error: error.message }
    }
  },

  // Complete task
  completeTask: async (taskId, completionData) => {
    try {
      // completionData already contains the fields in correct format
      const { data, error } = await supabase
        .from('task_instances')
        .update(completionData)
        .eq('id', taskId)
        .select(`
          *,
          domain:domains(id, name)
        `)
        .single()

      if (error) throw error

      // Update local state
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? data : t)
      }))

      return { success: true, data }
    } catch (error) {
      console.error('Error completing task:', error)
      return { success: false, error: error.message }
    }
  }
}))
