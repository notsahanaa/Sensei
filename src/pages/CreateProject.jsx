import DashboardLayout from '../components/layout/DashboardLayout'

const CreateProject = () => {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-[var(--text-primary)] mb-4">
            Add New Project
          </h1>
          <p className="text-[var(--text-secondary)]">
            Project creation flow coming soon...
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CreateProject
