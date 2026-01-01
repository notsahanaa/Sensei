import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import TasksTab from '../components/tasks/TasksTab'
import ProductivityTab from '../components/productivity/ProductivityTab'
import { supabase } from '../lib/supabase'

const Project = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [domains, setDomains] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')

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

  const handleNameDoubleClick = () => {
    setEditedName(project.name)
    setIsEditingName(true)
  }

  const handleDescriptionDoubleClick = () => {
    setEditedDescription(project.description || '')
    setIsEditingDescription(true)
  }

  const saveName = async () => {
    if (!editedName.trim()) {
      setIsEditingName(false)
      return
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({ name: editedName.trim() })
        .eq('id', id)

      if (error) throw error

      setProject({ ...project, name: editedName.trim() })
      setIsEditingName(false)
    } catch (error) {
      console.error('Error updating project name:', error)
    }
  }

  const saveDescription = async () => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ description: editedDescription.trim() })
        .eq('id', id)

      if (error) throw error

      setProject({ ...project, description: editedDescription.trim() })
      setIsEditingDescription(false)
    } catch (error) {
      console.error('Error updating project description:', error)
    }
  }

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveName()
    } else if (e.key === 'Escape') {
      setIsEditingName(false)
    }
  }

  const handleDescriptionKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveDescription()
    } else if (e.key === 'Escape') {
      setIsEditingDescription(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <p className="text-[var(--text-secondary)]">Loading project...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <p className="text-[var(--text-secondary)]">Project not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="px-8 pt-4 pb-8">
        {/* Project Name Heading */}
        {isEditingName ? (
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={saveName}
            onKeyDown={handleNameKeyDown}
            className="text-[20px] font-medium text-[var(--text-primary)] mb-1 bg-transparent border-none outline-none w-full"
            autoFocus
          />
        ) : (
          <h1
            onDoubleClick={handleNameDoubleClick}
            className="text-[20px] font-medium text-[var(--text-primary)] mb-1 cursor-text hover:opacity-80 transition-opacity"
          >
            {project.name}
          </h1>
        )}

        {/* Project Description Subtitle */}
        {isEditingDescription ? (
          <input
            type="text"
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            onBlur={saveDescription}
            onKeyDown={handleDescriptionKeyDown}
            placeholder="Add a description..."
            className="text-[14px] text-[var(--text-primary)] mb-6 bg-transparent border-none outline-none w-full"
            autoFocus
          />
        ) : (
          <p
            onDoubleClick={handleDescriptionDoubleClick}
            className="text-[14px] text-[var(--text-secondary)] mb-6 cursor-text hover:opacity-80 transition-opacity"
          >
            {project.description || 'Double-click to add a description...'}
          </p>
        )}

        {/* Tabs */}
        <div className="border-b border-[var(--container-medium)] mb-6">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  pb-3 text-[14px] font-medium transition-colors relative
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

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'tasks' && <TasksTab projectId={id} domains={domains} />}
          {activeTab === 'productivity' && <ProductivityTab projectId={id} />}
          {activeTab === 'progress' && (
            <div className="text-[var(--text-secondary)]">
              Progress content coming soon...
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Project
