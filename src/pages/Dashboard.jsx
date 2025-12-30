import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import Button from '../components/ui/Button'
import ProjectCreationModal from '../components/ui/ProjectCreationModal'

const Dashboard = () => {
  const navigate = useNavigate()
  const hasProjects = false // TODO: Check if user has projects
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)

  return (
    <DashboardLayout>
      {hasProjects ? (
        // Dashboard with projects (TODO: Implement later)
        <div>
          <h1 className="text-2xl font-medium text-[var(--text-primary)]">
            Dashboard
          </h1>
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
        onComplete={() => {
          // TODO: Handle project creation
          setIsProjectModalOpen(false)
        }}
      />
    </DashboardLayout>
  )
}

export default Dashboard
