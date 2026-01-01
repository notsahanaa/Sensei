import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useProjectStore = create((set) => ({
  projects: [],
  isLoading: false,

  // Fetch all projects
  fetchProjects: async () => {
    try {
      set({ isLoading: true })
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ projects: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching projects:', error)
      set({ isLoading: false })
    }
  },

  // Delete a project
  deleteProject: async (projectId) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      // Update local state
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId)
      }))
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  },

  // Add a project (called after creation)
  addProject: (project) => {
    set((state) => ({
      projects: [project, ...state.projects]
    }))
  }
}))
