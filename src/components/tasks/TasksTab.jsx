import { useState, forwardRef, useEffect } from 'react'
import { Sparkles, Calendar, Plus } from 'lucide-react'
import Button from '../ui/Button'
import DatePicker from '../ui/DatePicker'
import AddTaskCard from './AddTaskCard'
import TaskCard from './TaskCard'
import TaskDetailModal from './TaskDetailModal'
import CheckInModal from './CheckInModal'
import { useTaskStore } from '../../stores/useTaskStore'
import { formatLocalDate } from '../../utils/dateUtils'

// Custom input component for DatePicker (calendar icon button)
const CalendarButton = forwardRef(({ value, onClick }, ref) => (
  <button
    onClick={onClick}
    ref={ref}
    className="p-2 rounded bg-[var(--container-subtle)] text-[var(--text-secondary)] hover:bg-[var(--container-medium)] transition-colors flex items-center justify-center"
    aria-label="Select date"
  >
    <Calendar className="w-4 h-4" strokeWidth={1.5} />
  </button>
))

CalendarButton.displayName = 'CalendarButton'

const TasksTab = ({ projectId, domains = [], projects = [] }) => {
  const { tasks, isLoading, error, fetchTasksForDate, deleteTask, updateTask, completeTask } = useTaskStore()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [backlogCount] = useState(0) // Will be fetched from backend later
  const [showAddTask, setShowAddTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [checkInTask, setCheckInTask] = useState(null)

  // Fetch tasks when date or project changes
  useEffect(() => {
    if (projectId && selectedDate) {
      const dateStr = formatLocalDate(selectedDate)
      fetchTasksForDate(projectId, dateStr)
    }
  }, [projectId, selectedDate, fetchTasksForDate])

  // Handle date change from picker
  const handleDateChange = (date) => {
    setSelectedDate(date)
  }

  // Handle save task
  const handleSaveTask = (taskData) => {
    console.log('Task saved:', taskData)
    setShowAddTask(false)
  }

  // Handle cancel add task
  const handleCancelAddTask = () => {
    setShowAddTask(false)
  }

  // Handle delete task
  const handleDeleteTask = async (taskId) => {
    const result = await deleteTask(taskId)
    if (!result.success) {
      console.error('Failed to delete task:', result.error)
    }
  }

  // Handle toggle task completion - opens check-in modal
  const handleToggleComplete = (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // If task is already completed, uncomplete it
    if (task.status === 'completed') {
      updateTask(taskId, {
        status: 'pending',
        completed_at: null
      })
    } else {
      // Open check-in modal for completion
      setCheckInTask(task)
    }
  }

  // Handle complete task from check-in modal
  const handleCompleteTask = async (taskId, completionData) => {
    const result = await completeTask(taskId, completionData)
    if (!result.success) {
      console.error('Failed to complete task:', result.error)
    }
    setCheckInTask(null)
    setSelectedTask(null)
  }

  // Handle task card click
  const handleTaskClick = (task) => {
    setSelectedTask(task)
  }

  // Handle close modal
  const handleCloseModal = () => {
    setSelectedTask(null)
  }

  // Handle update task from modal
  const handleUpdateTask = async (taskId, updates) => {
    const result = await updateTask(taskId, updates)
    if (!result.success) {
      console.error('Failed to update task:', result.error)
    }
  }

  const hasTasks = tasks.length > 0 || showAddTask

  return (
    <div className="w-full">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {/* Today Heading */}
          <h2 className="text-base font-medium text-[var(--text-primary)]">
            Today
          </h2>

          {/* Date Picker */}
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            customInput={<CalendarButton />}
            todayButton="Today"
          />
        </div>

        {/* Backlog - Right aligned */}
        <button
          className="px-4 py-2 rounded bg-[var(--container-subtle)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--container-medium)] transition-colors"
        >
          Backlog ({backlogCount})
        </button>
      </div>

      {/* Content Area - Empty State, Add Task, or Task List */}
      {!hasTasks ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
          <div className="w-full max-w-[40%] mx-auto text-left">
            <h1 className="text-xl font-medium text-[var(--text-primary)] mb-4">
              Your Tasks
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">
              Tasks are small units of activities you complete everyday to progress your project.
              Sensei helps turn your vague direction into measurable, actionable, time bound tasks
              you can complete today.
            </p>
            <div className="flex gap-4">
              <Button
                variant="primary"
                onClick={() => setShowAddTask(true)}
              >
                Add Task
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  // Will open Ask Sensei modal/interface
                  console.log('Ask Sensei clicked')
                }}
                className="flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                Ask Sensei
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Task list */}
          {!isLoading && !error && tasks.length > 0 && (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDelete={handleDeleteTask}
                  onToggleComplete={handleToggleComplete}
                  onClick={handleTaskClick}
                />
              ))}

              {/* Add Task Card or Button - appears at bottom */}
              {showAddTask ? (
                <AddTaskCard
                  onSave={handleSaveTask}
                  onCancel={handleCancelAddTask}
                  domains={domains}
                  projectId={projectId}
                  scheduledDate={formatLocalDate(selectedDate)}
                />
              ) : (
                <button
                  onClick={() => setShowAddTask(true)}
                  className="w-full p-4 rounded-lg bg-[var(--container-subtle)] text-[var(--text-secondary)] hover:bg-[var(--container-medium)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                  <span className="text-sm font-medium">Add Task</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && !checkInTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={handleCloseModal}
          onDelete={handleDeleteTask}
          onUpdate={handleUpdateTask}
          onToggleComplete={handleToggleComplete}
          projects={projects}
          domains={domains}
        />
      )}

      {/* Check-In Modal */}
      {checkInTask && (
        <CheckInModal
          task={checkInTask}
          onClose={() => setCheckInTask(null)}
          onBack={selectedTask ? () => setCheckInTask(null) : null}
          onDelete={handleDeleteTask}
          onComplete={handleCompleteTask}
          projects={projects}
          domains={domains}
        />
      )}
    </div>
  )
}

export default TasksTab
