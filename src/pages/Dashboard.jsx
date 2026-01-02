import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreVertical, Circle, CheckCircle2 } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Button from '../components/ui/Button'
import ProjectCreationModal from '../components/ui/ProjectCreationModal'
import AddTaskCard from '../components/tasks/AddTaskCard'
import { useProjectStore } from '../stores/useProjectStore'
import { supabase } from '../lib/supabase'
import { formatLocalDate } from '../utils/dateUtils'

const Dashboard = () => {
  const navigate = useNavigate()
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [selectedDate] = useState(new Date())
  const [projectsWithTasks, setProjectsWithTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [addingTaskToProjectId, setAddingTaskToProjectId] = useState(null)
  const [projectDomains, setProjectDomains] = useState({})

  // Use Zustand store
  const { projects, fetchProjects, deleteProject } = useProjectStore()

  // Fetch projects and their tasks on mount
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Fetch tasks for all projects when projects are loaded
  useEffect(() => {
    if (projects.length > 0) {
      fetchAllProjectTasks()
    } else {
      setIsLoading(false)
    }
  }, [projects, selectedDate])

  const fetchAllProjectTasks = async () => {
    setIsLoading(true)
    try {
      const dateStr = formatLocalDate(selectedDate)

      // Fetch tasks for all projects for today
      const projectTasksPromises = projects.map(async (project) => {
        const { data: tasks, error } = await supabase
          .from('task_instances')
          .select(`
            *,
            domain:domains(id, name)
          `)
          .eq('project_id', project.id)
          .eq('scheduled_date', dateStr)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Calculate streak (simplified - just checking if there are completed tasks)
        const completedToday = tasks?.filter(t => t.status === 'completed').length || 0

        return {
          ...project,
          tasks: tasks || [],
          taskCount: tasks?.length || 0,
          streak: completedToday > 0 ? 1 : 0 // TODO: Implement proper streak calculation
        }
      })

      const projectsData = await Promise.all(projectTasksPromises)
      setProjectsWithTasks(projectsData)
    } catch (error) {
      console.error('Error fetching project tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleComplete = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
      const { error } = await supabase
        .from('task_instances')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId)

      if (error) throw error

      // Refresh tasks
      await fetchAllProjectTasks()
    } catch (error) {
      console.error('Error toggling task completion:', error)
    }
  }

  const handleArchiveProject = async (projectId) => {
    // TODO: Implement archive functionality
    console.log('Archive project:', projectId)
    setOpenMenuId(null)
  }

  const handleDeleteProject = async (projectId) => {
    const confirmed = window.confirm('Delete this project and all its tasks?')
    if (!confirmed) return

    try {
      await deleteProject(projectId)
      setOpenMenuId(null)
      await fetchProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const handleAddTaskClick = async (projectId) => {
    // Fetch domains for this project if not already loaded
    if (!projectDomains[projectId]) {
      try {
        const { data: domains, error } = await supabase
          .from('domains')
          .select('*')
          .eq('project_id', projectId)
          .order('order_index', { ascending: true })

        if (error) throw error

        setProjectDomains(prev => ({
          ...prev,
          [projectId]: domains || []
        }))
      } catch (error) {
        console.error('Error fetching domains:', error)
      }
    }

    setAddingTaskToProjectId(projectId)
  }

  const handleSaveTask = async () => {
    // Task is saved via AddTaskCard component
    setAddingTaskToProjectId(null)
    await fetchAllProjectTasks()
  }

  const handleCancelAddTask = () => {
    setAddingTaskToProjectId(null)
  }


  const formatTime = (minutes) => {
    if (!minutes) return '0 mins'
    if (minutes < 60) return `${minutes} mins`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  // Calculate total time for today
  const totalMinutesToday = projectsWithTasks.reduce((sum, project) => {
    return sum + project.tasks.reduce((taskSum, task) => {
      return taskSum + (task.timebox_value || 0)
    }, 0)
  }, 0)

  const completedMinutesToday = projectsWithTasks.reduce((sum, project) => {
    return sum + project.tasks
      .filter(t => t.status === 'completed')
      .reduce((taskSum, task) => {
        return taskSum + (task.actual_time_spent || task.timebox_value || 0)
      }, 0)
  }, 0)

  const hasProjects = projects.length > 0

  if (isLoading) {
    return (
      <DashboardLayout title={selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!hasProjects) {
    return (
      <DashboardLayout title={selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="w-full max-w-[40%] mx-auto text-left">
            <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">
              Projects are time-bound activities with clear outcomes. Unlike habits, projects require you to work on different activities on a day-to-day basis and to make sure the activities matter to your end-result. Sensei helps you break down your projects into daily activities and help you understand if they move the needle.
            </p>
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

        <ProjectCreationModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          onComplete={() => {
            setIsProjectModalOpen(false)
            fetchProjects()
          }}
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title={selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      headerRight={
        <div className="flex items-center gap-3">
          <span className="text-[14px] text-[var(--text-secondary)]">
            {completedMinutesToday}/{totalMinutesToday} mins
          </span>
          <div className="w-12 h-12 rounded-full border-2 border-[var(--container-medium)] flex items-center justify-center">
            <span className="text-xs text-[var(--text-secondary)]">
              {totalMinutesToday > 0 ? Math.round((completedMinutesToday / totalMinutesToday) * 100) : 0}%
            </span>
          </div>
        </div>
      }
    >
      {/* Projects Section */}
      <div className="space-y-8">
        {projectsWithTasks.map((project) => (
          <div key={project.id} className="space-y-4">
            {/* Project Header */}
            <div className="flex items-start justify-between">
              {/* Left side: Name and stats */}
              <div>
                <h2 className="text-[20px] font-medium text-[var(--text-primary)] mb-1">
                  {project.name}
                </h2>
                <p className="text-[12px] text-[var(--text-secondary)]">
                  {project.streak} day streak | {project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}
                </p>
              </div>

              {/* Right side: Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="px-4 py-2 text-[12px] font-medium text-[var(--text-primary)] bg-[var(--container-subtle)] hover:bg-[var(--container-medium)] rounded transition-colors"
                >
                  View Project
                </button>

                {/* Three-dot menu */}
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" strokeWidth={1.5} />
                  </button>

                  {openMenuId === project.id && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />

                      {/* Menu */}
                      <div className="absolute right-0 top-full mt-1 bg-[var(--container-subtle)] border border-[var(--container-medium)] rounded-lg shadow-lg py-1 min-w-[150px] z-20">
                        <button
                          onClick={() => handleArchiveProject(project.id)}
                          className="w-full px-4 py-2 text-left text-[12px] text-[var(--text-primary)] hover:bg-[var(--container-medium)] transition-colors"
                        >
                          Archive project
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="w-full px-4 py-2 text-left text-[12px] text-red-500 hover:bg-[var(--container-medium)] transition-colors"
                        >
                          Delete project
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Task Cards */}
            <div className="space-y-2">
              {project.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-[var(--container-subtle)] rounded-lg"
                >
                  {/* Left: Checkbox + Task info */}
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => handleToggleComplete(task.id, task.status)}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} />
                      ) : (
                        <Circle className="w-5 h-5" strokeWidth={1.5} />
                      )}
                    </button>

                    <div className="flex-1">
                      <p className="text-[14px] font-medium text-[var(--text-primary)] mb-0.5">
                        {task.task_name}
                      </p>
                      <p className="text-[12px] text-[var(--text-secondary)]">
                        {task.description || task.domain?.name || 'No description'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Time */}
                  <span className="text-[12px] text-[var(--text-secondary)] ml-4">
                    {formatTime(task.timebox_value)}
                  </span>
                </div>
              ))}

              {/* Add Task Button or Card */}
              {addingTaskToProjectId === project.id ? (
                <AddTaskCard
                  onSave={handleSaveTask}
                  onCancel={handleCancelAddTask}
                  domains={projectDomains[project.id] || []}
                  projectId={project.id}
                  scheduledDate={formatLocalDate(selectedDate)}
                />
              ) : (
                <button
                  onClick={() => handleAddTaskClick(project.id)}
                  className="w-full p-4 text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--container-subtle)] hover:bg-[var(--container-medium)] rounded-lg transition-colors text-left"
                >
                  + Add Task
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Project Creation Modal */}
      <ProjectCreationModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onComplete={() => {
          setIsProjectModalOpen(false)
          fetchProjects()
        }}
      />
    </DashboardLayout>
  )
}

export default Dashboard
