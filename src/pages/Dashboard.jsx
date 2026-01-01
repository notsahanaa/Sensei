import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import Button from '../components/ui/Button'
import ProjectCreationModal from '../components/ui/ProjectCreationModal'
import { useProjectStore } from '../stores/useProjectStore'

const Dashboard = () => {
  const navigate = useNavigate()
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [deleteConfirmProject, setDeleteConfirmProject] = useState(null)

  // Use Zustand store
  const { projects, isLoading, fetchProjects, deleteProject } = useProjectStore()

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleDeleteProject = async (projectId) => {
    try {
      await deleteProject(projectId)
      setDeleteConfirmProject(null)
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const hasProjects = projects.length > 0

  return (
    <DashboardLayout>
      {isLoading ? (
        // Loading state
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <p className="text-[var(--text-secondary)]">Loading projects...</p>
        </div>
      ) : hasProjects ? (
        // Dashboard with projects
        <div className="px-8 pt-6 pb-8">
          <h1 className="text-[20px] font-medium text-[var(--text-primary)] mb-6">
            Your Projects
          </h1>

          {/* Project Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-6 bg-[var(--container-subtle)] rounded-lg border border-[var(--container-medium)] hover:border-[var(--accent-primary)] transition-all cursor-pointer"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-[16px] font-medium text-[var(--text-primary)] flex-1">
                    {project.name}
                  </h3>

                  {/* Delete Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirmProject(project)
                    }}
                    className="p-1 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                    aria-label="Delete project"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4m1.5 0v9.5a1 1 0 01-1 1h-7a1 1 0 01-1-1V4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {/* Project Description */}
                {project.description && (
                  <p className="text-[12px] text-[var(--text-secondary)] line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Empty state - No projects yet
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="w-full max-w-[40%] mx-auto text-left">
            {/* Heading */}
            <h1 className="text-xl font-medium text-[var(--text-primary)] mb-4">
              Your Projects
            </h1>

            {/* Description */}
            <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">
              Projects are time-bound activities with clear outcomes. Unlike habits, projects require you to work on different activities on a day-to-day basis and to make sure the activities matter to your end-result. Sensei helps you break down your projects into daily activities and help you understand if they move the needle.
            </p>

            {/* CTA Button */}
            <div className="max-w-xs">
              <Button
                onClick={() => setIsProjectModalOpen(true)}
                variant="primary"
              >
                Add New Project
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Project Creation Modal */}
      <ProjectCreationModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onComplete={(project) => {
          setIsProjectModalOpen(false)
          fetchProjects() // Refresh projects list in store
        }}
      />

      {/* Delete Confirmation Popup */}
      {deleteConfirmProject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black bg-opacity-70">
          <div className="bg-[var(--bg)] rounded-lg border border-[var(--container-medium)] p-6 max-w-sm w-full">
            <h3 className="text-[16px] font-medium text-[var(--text-primary)] mb-2">
              Delete Project?
            </h3>
            <p className="text-[14px] text-[var(--text-secondary)] mb-6">
              Are you sure you want to delete "{deleteConfirmProject.name}"? This will also delete all associated domains and tasks. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button onClick={() => setDeleteConfirmProject(null)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={() => handleDeleteProject(deleteConfirmProject.id)} variant="primary">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Dashboard
