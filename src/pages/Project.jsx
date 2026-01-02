import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import TasksTab from '../components/tasks/TasksTab'
import ProductivityTab from '../components/productivity/ProductivityTab'
import ProgressTab from '../components/progress/ProgressTab'
import { supabase } from '../lib/supabase'

const Project = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [domains, setDomains] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')

  useEffect(() => {
    fetchProject()
    fetchDomains()
  }, [id])

  const fetchProject = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setProject(data)
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('project_id', id)
        .order('order_index', { ascending: true })

      if (error) throw error
      setDomains(data || [])
    } catch (error) {
      console.error('Error fetching domains:', error)
    }
  }

  const tabs = [
    { id: 'tasks', label: 'Tasks' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'progress', label: 'Progress' }
  ]

  if (isLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <p className="text-[var(--text-secondary)]">Loading project...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!project) {
    return (
      <DashboardLayout title="Project Not Found">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <p className="text-[var(--text-secondary)]">Project not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={project.name}>
      {/* Fixed Tabs Section */}
      <div className="sticky top-16 z-20 bg-[var(--bg)] border-b border-[var(--container-medium)] px-8">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                pb-3 pt-4 text-[14px] font-medium transition-colors relative
                ${activeTab === tab.id
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }
              `}
            >
              {tab.label}
              {/* Active indicator */}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent-primary)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Tab Content */}
      <div className="px-8 pt-6 pb-8">
        {activeTab === 'tasks' && <TasksTab projectId={id} domains={domains} />}
        {activeTab === 'productivity' && <ProductivityTab projectId={id} />}
        {activeTab === 'progress' && <ProgressTab projectId={id} />}
      </div>
    </DashboardLayout>
  )
}

export default Project
