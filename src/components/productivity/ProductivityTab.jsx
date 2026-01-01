import { useState, useEffect, forwardRef } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Target } from 'lucide-react'
import DatePicker from '../ui/DatePicker'
import { supabase } from '../../lib/supabase'

// Custom input component for DatePicker (calendar icon button)
const CalendarButton = forwardRef(({ value, onClick }, ref) => (
  <button
    onClick={onClick}
    ref={ref}
    className="p-2 rounded bg-[var(--container-subtle)] text-[var(--text-secondary)] hover:bg-[var(--container-medium)] transition-colors flex items-center justify-center"
    aria-label="Select month"
  >
    <Calendar className="w-4 h-4" strokeWidth={1.5} />
  </button>
))

CalendarButton.displayName = 'CalendarButton'

const ProductivityTab = ({ projectId }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [monthData, setMonthData] = useState([])
  const [dayTasks, setDayTasks] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Stats
  const [totalHours, setTotalHours] = useState(0)
  const [dailyAvg, setDailyAvg] = useState(0)
  const [avgCompletion, setAvgCompletion] = useState(0)
  const [tasksCompleted, setTasksCompleted] = useState(0)

  // Fetch productivity data for the month
  useEffect(() => {
    if (projectId) {
      fetchMonthData()
    }
  }, [projectId, selectedMonth])

  // Fetch tasks for selected date
  useEffect(() => {
    if (projectId) {
      fetchDayTasks()
    }
  }, [projectId, selectedDate])

  const fetchMonthData = async () => {
    setIsLoading(true)

    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)

    try {
      const { data, error } = await supabase
        .from('task_instances')
        .select('*')
        .eq('project_id', projectId)
        .gte('scheduled_date', startOfMonth.toISOString().split('T')[0])
        .lte('scheduled_date', endOfMonth.toISOString().split('T')[0])

      if (error) throw error

      setMonthData(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error fetching productivity data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDayTasks = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('task_instances')
        .select(`
          *,
          domain:domains(id, name)
        `)
        .eq('project_id', projectId)
        .eq('scheduled_date', dateStr)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDayTasks(data || [])
    } catch (error) {
      console.error('Error fetching day tasks:', error)
    }
  }

  const calculateStats = (tasks) => {
    // Group tasks by date
    const tasksByDate = {}
    tasks.forEach(task => {
      const date = task.scheduled_date
      if (!tasksByDate[date]) {
        tasksByDate[date] = { total: 0, completed: 0, hours: 0 }
      }
      tasksByDate[date].total += 1
      if (task.status === 'completed') {
        tasksByDate[date].completed += 1
        // Convert actual_time_spent to hours (assuming it's in minutes)
        tasksByDate[date].hours += (task.actual_time_spent || 0) / 60
      }
    })

    // Calculate total hours
    const totalHrs = Object.values(tasksByDate).reduce((sum, day) => sum + day.hours, 0)
    setTotalHours(totalHrs)

    // Calculate daily average (only counting days with tasks)
    const daysWithTasks = Object.keys(tasksByDate).length
    setDailyAvg(daysWithTasks > 0 ? totalHrs / daysWithTasks : 0)

    // Calculate average completion rate
    const completionRates = Object.values(tasksByDate).map(day =>
      day.total > 0 ? (day.completed / day.total) * 100 : 0
    )
    const avgRate = completionRates.length > 0
      ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
      : 0
    setAvgCompletion(avgRate)

    // Count total completed tasks
    const completed = tasks.filter(t => t.status === 'completed').length
    setTasksCompleted(completed)
  }

  // Get hours for a specific date
  const getHoursForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    const tasksOnDate = monthData.filter(t => t.scheduled_date === dateStr && t.status === 'completed')
    const hours = tasksOnDate.reduce((sum, task) => sum + ((task.actual_time_spent || 0) / 60), 0)
    return hours
  }

  // Get opacity based on hours (every 2 hours = 10%, starts at 30%)
  const getOpacityForHours = (hours) => {
    if (hours === 0) return 0
    const baseOpacity = 0.3
    const increment = Math.floor(hours / 2) * 0.1
    return Math.min(baseOpacity + increment, 1)
  }

  // Generate calendar days for the month
  const generateCalendarDays = () => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startingDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days = []

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  // Get week dates for selected date
  const getWeekDates = () => {
    const date = new Date(selectedDate)
    const day = date.getDay()
    const diff = date.getDate() - day // Get to Sunday
    const sunday = new Date(date.setDate(diff))

    const week = []
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(sunday)
      weekDay.setDate(sunday.getDate() + i)
      week.push(weekDay)
    }
    return week
  }

  const handleDateClick = (date) => {
    setSelectedDate(date)
  }

  const handleMonthChange = (date) => {
    setSelectedMonth(date)
  }

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const formatDateFull = (date) => {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Calculate completion rate for the day
  const calculateCompletionRate = () => {
    const completedTasks = dayTasks.filter(t => t.status === 'completed')
    if (completedTasks.length === 0) return 0

    let totalActual = 0
    let totalTarget = 0

    completedTasks.forEach(task => {
      if (task.actual_time_spent) {
        totalActual += task.actual_time_spent
      }
      if (task.timebox_value) {
        const targetInMins = task.timebox_unit === 'hrs'
          ? task.timebox_value * 60
          : task.timebox_value
        totalTarget += targetInMins
      }
    })

    if (totalTarget === 0) return 0
    return Math.round((totalActual / totalTarget) * 100)
  }

  const weekDates = getWeekDates()
  const calendarDays = generateCalendarDays()
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  // Check if there's any productivity data
  const hasData = monthData.length > 0 && tasksCompleted > 0

  return (
    <div className="w-full">
      {/* Month Selector */}
      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-base font-medium text-[var(--text-primary)]">
          {formatMonthYear(selectedMonth)}
        </h2>
        <DatePicker
          selected={selectedMonth}
          onChange={handleMonthChange}
          customInput={<CalendarButton />}
          dateFormat="MMMM yyyy"
          showMonthYearPicker
        />
      </div>

      {/* Empty State */}
      {!hasData && !isLoading && (
        <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
          <p className="text-[var(--text-secondary)] text-base">
            Complete a few tasks to see how productive you've been
          </p>
        </div>
      )}

      {/* Stats Boxes */}
      {hasData && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--container-subtle)] rounded-lg p-4 text-center">
          <div className="text-2xl font-medium text-[var(--text-primary)] mb-1">
            {Math.round(totalHours)} hours
          </div>
          <div className="text-xs text-[var(--text-secondary)]">This Month</div>
        </div>

        <div className="bg-[var(--container-subtle)] rounded-lg p-4 text-center">
          <div className="text-2xl font-medium text-[var(--text-primary)] mb-1">
            {dailyAvg.toFixed(1)} hours
          </div>
          <div className="text-xs text-[var(--text-secondary)]">Daily Avg</div>
        </div>

        <div className="bg-[var(--container-subtle)] rounded-lg p-4 text-center">
          <div className="text-2xl font-medium text-[var(--text-primary)] mb-1">
            {Math.round(avgCompletion)}%
          </div>
          <div className="text-xs text-[var(--text-secondary)]">Avg Completion</div>
        </div>

        <div className="bg-[var(--container-subtle)] rounded-lg p-4 text-center">
          <div className="text-2xl font-medium text-[var(--text-primary)] mb-1">
            {tasksCompleted}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">Tasks Completed</div>
        </div>
      </div>

      {/* Heatmap and Bar Chart */}
      <div className="flex gap-4">
        {/* Heatmap - 50% */}
        <div className="w-1/2 bg-[var(--container-subtle)] rounded-lg p-6">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day, i) => (
              <div key={i} className="text-center text-xs text-[var(--text-secondary)] font-medium">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={index} className="aspect-square" />
              }

              const hours = getHoursForDate(date)
              const opacity = getOpacityForHours(hours)
              const isSelected = date.toDateString() === selectedDate.toDateString()
              const isToday = date.toDateString() === new Date().toDateString()

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`aspect-square rounded flex items-center justify-center text-xs transition-all ${
                    isSelected
                      ? 'ring-2 ring-[var(--accent-primary)]'
                      : ''
                  }`}
                  style={{
                    backgroundColor: `rgba(var(--accent-primary-rgb, 135, 159, 200), ${opacity})`,
                  }}
                >
                  <span className={opacity > 0 ? 'text-white' : 'text-[var(--text-secondary)]'}>
                    {date.getDate()}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Weekly Bar Chart - 50% */}
        <div className="w-1/2 bg-[var(--container-subtle)] rounded-lg p-6">
          {/* Time labels at top - fixed position */}
          <div className="flex justify-between gap-2 mb-2 h-6">
            {weekDates.map((date, index) => {
              const hours = getHoursForDate(date)
              return (
                <div key={index} className="flex-1 text-center">
                  {hours > 0 && (
                    <div className="text-xs text-[var(--text-secondary)]">
                      {hours.toFixed(1)} hr
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Bar chart */}
          <div className="flex items-end justify-between gap-2 h-56">
            {weekDates.map((date, index) => {
              const hours = getHoursForDate(date)
              const maxHours = 8 // Assume 8 hours max for scaling
              const heightPercent = Math.min((hours / maxHours) * 100, 100)

              return (
                <div key={index} className="flex-1 flex flex-col items-center justify-end">
                  <div
                    className="w-full bg-[var(--container-medium)] rounded-t transition-all"
                    style={{ height: `${heightPercent}%`, minHeight: hours > 0 ? '8px' : '0' }}
                  />
                </div>
              )
            })}
          </div>

          {/* Date numbers */}
          <div className="flex justify-between gap-2 mt-2">
            {weekDates.map((date, index) => (
              <div key={index} className="flex-1 text-center text-xs text-[var(--text-secondary)]">
                {date.getDate()}
              </div>
            ))}
          </div>

          {/* Week day labels at bottom */}
          <div className="flex justify-between gap-2 mt-2 pt-4 border-t border-[var(--container-medium)]">
            {weekDates.map((date, index) => (
              <div key={index} className="flex-1 text-center text-xs text-[var(--text-secondary)]">
                {fullDayNames[date.getDay()].slice(0, 3)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Completed Tasks Section */}
      <div className="mt-8">
        {/* Date navigation and completion rate */}
        <div className="flex items-center justify-between mb-6">
          {/* Date navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreviousDay}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {formatDateFull(selectedDate)}
            </span>
            <button
              onClick={handleNextDay}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Completion rate circle */}
          <div className="flex items-center gap-2">
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="var(--container-medium)"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="var(--accent-primary)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - calculateCompletionRate() / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-[var(--text-primary)]">
                {calculateCompletionRate()}%
              </div>
            </div>
          </div>
        </div>

        {/* Task list */}
        {dayTasks.length === 0 ? (
          <p className="text-[var(--text-secondary)] text-sm text-center py-8">
            No tasks scheduled for this day
          </p>
        ) : (
          <div className="space-y-3">
            {dayTasks.map((task) => {
              const isCompleted = task.status === 'completed'
              return (
                <div
                  key={task.id}
                  className={`bg-[var(--container-subtle)] rounded-lg p-4 ${
                    !isCompleted ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[var(--text-primary)] font-medium mb-1">
                        {task.task_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        {task.domain && <span>{task.domain.name}</span>}
                        {task.domain && task.version && <span>|</span>}
                        {task.version && <span>V {task.version}</span>}
                      </div>
                    </div>

                    {/* Right side: Target/Timebox */}
                    <div className="flex items-center gap-3">
                      {(task.target_value || task.timebox_value) && (
                        <div className="text-right">
                          {task.target_value && (
                            <div className="flex items-center gap-1 text-[var(--text-primary)] text-sm font-medium justify-end">
                              <Target className="w-4 h-4" strokeWidth={1.5} />
                              <span>
                                {task.target_value} {task.measure_unit || task.measure_type}
                              </span>
                            </div>
                          )}
                          {task.timebox_value && (
                            <div className="text-xs text-[var(--text-secondary)] mt-1">
                              {task.timebox_value} {task.timebox_unit}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  )
}

export default ProductivityTab
