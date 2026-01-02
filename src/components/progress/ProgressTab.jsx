import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { linkOrphanedTasks } from '../../utils/linkOrphanedTasks'
import { formatLocalDate, formatDisplayDate, formatMonthYear, getMonthStart, getMonthEnd } from '../../utils/dateUtils'

const ProgressTab = ({ projectId }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [stats, setStats] = useState({
    totalHours: 0,
    dailyAverage: 0,
    avgCompletion: 0,
    tasksCompleted: 0
  })
  const [domains, setDomains] = useState([])
  const [selectedDomain, setSelectedDomain] = useState(null)
  const [chartData, setChartData] = useState([])
  const [canonicalTasks, setCanonicalTasks] = useState([])
  const [selectedCanonical, setSelectedCanonical] = useState(null)
  const [canonicalInstances, setCanonicalInstances] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [orphanedTaskCount, setOrphanedTaskCount] = useState(0)
  const [isLinking, setIsLinking] = useState(false)
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [canonicalNotes, setCanonicalNotes] = useState('')

  useEffect(() => {
    fetchDomains()
    fetchMonthlyData()
  }, [projectId, currentMonth])

  useEffect(() => {
    if (selectedDomain) {
      fetchCanonicalTasksForDomain(selectedDomain)
    }
  }, [selectedDomain])

  useEffect(() => {
    // Set default selected domain to first domain with tasks
    if (chartData.length > 0 && !selectedDomain) {
      const firstDomainWithTasks = chartData.find(d => d.count > 0)
      if (firstDomainWithTasks) {
        setSelectedDomain(firstDomainWithTasks.domainId)
      } else {
        // If no domains have tasks, select the first domain
        setSelectedDomain(chartData[0]?.domainId)
      }
    }
  }, [chartData])

  const fetchDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

      if (error) throw error
      setDomains(data || [])
      if (data && data.length > 0 && !selectedDomain) {
        setSelectedDomain(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching domains:', error)
    }
  }

  const fetchMonthlyData = async () => {
    try {
      setIsLoading(true)

      const monthStart = getMonthStart(currentMonth)
      const monthEnd = getMonthEnd(currentMonth)

      // Fetch all task instances for the month
      const { data: tasks, error } = await supabase
        .from('task_instances')
        .select('*, domain:domains(id, name)')
        .eq('project_id', projectId)
        .gte('scheduled_date', formatLocalDate(monthStart))
        .lte('scheduled_date', formatLocalDate(monthEnd))

      if (error) throw error

      // Calculate stats
      const completedTasks = tasks?.filter(t => t.status === 'completed') || []
      const totalHours = Math.round(completedTasks.reduce((sum, t) => sum + (t.actual_time_spent || 0), 0) / 60)

      // Daily completion rate
      const daysInMonth = monthEnd.getDate()
      const dailyCompletionRates = []

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        const dateStr = formatLocalDate(date)

        const dayTasks = tasks?.filter(t => t.scheduled_date === dateStr) || []
        const dayCompleted = dayTasks.filter(t => t.status === 'completed').length
        const dayTotal = dayTasks.length

        if (dayTotal > 0) {
          dailyCompletionRates.push((dayCompleted / dayTotal) * 100)
        }
      }

      const avgCompletion = dailyCompletionRates.length > 0
        ? Math.round(dailyCompletionRates.reduce((sum, rate) => sum + rate, 0) / dailyCompletionRates.length)
        : 0

      setStats({
        totalHours,
        dailyAverage: dailyCompletionRates.length > 0 ? Math.round(totalHours / dailyCompletionRates.length) : 0,
        avgCompletion,
        tasksCompleted: completedTasks.length
      })

      // Fetch canonical tasks for chart
      await fetchChartData()
    } catch (error) {
      console.error('Error fetching monthly data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchChartData = async () => {
    try {
      // Fetch all domains for the project (ordered)
      const { data: allDomains, error: domainsError } = await supabase
        .from('domains')
        .select('id, name, order_index')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

      if (domainsError) throw domainsError

      // Initialize chart data with all domains (count = 0)
      const domainMap = {}
      allDomains?.forEach(domain => {
        domainMap[domain.id] = {
          name: domain.name,
          count: 0,
          domainId: domain.id,
          order: domain.order_index
        }
      })

      // Fetch all canonical tasks for the project
      const { data: canonicals, error } = await supabase
        .from('canonical_tasks')
        .select(`
          *,
          domain:domains(id, name)
        `)
        .eq('project_id', projectId)

      if (error) throw error

      console.log('📊 Chart: Found', canonicals?.length || 0, 'canonical tasks total')

      // Check how many completed tasks have NO canonical link
      const { data: orphanedTasks } = await supabase
        .from('task_instances')
        .select('id, task_name, canonical_task_id')
        .eq('project_id', projectId)
        .eq('status', 'completed')
        .is('canonical_task_id', null)

      console.log('⚠️ Completed tasks WITHOUT canonical link:', orphanedTasks?.length || 0, orphanedTasks)
      setOrphanedTaskCount(orphanedTasks?.length || 0)

      // Count canonical tasks with completions by domain
      for (const canonical of canonicals || []) {
        // Check if this canonical task has ANY completed instances (all-time)
        const { data: completedInstances } = await supabase
          .from('task_instances')
          .select('id')
          .eq('canonical_task_id', canonical.id)
          .eq('status', 'completed')
          .limit(1) // Just check if at least one exists

        const hasCompletions = completedInstances && completedInstances.length > 0

        if (hasCompletions && domainMap[canonical.domain_id]) {
          domainMap[canonical.domain_id].count += 1
        }
      }

      // Convert to array and sort by order_index
      const chartData = Object.values(domainMap).sort((a, b) => a.order - b.order)
      setChartData(chartData)
    } catch (error) {
      console.error('Error fetching chart data:', error)
    }
  }

  const fetchCanonicalTasksForDomain = async (domainId) => {
    try {
      const { data, error } = await supabase
        .from('canonical_tasks')
        .select('*')
        .eq('project_id', projectId)
        .eq('domain_id', domainId)

      if (error) throw error

      // Get completion counts for each canonical task (all-time)
      const tasksWithCounts = await Promise.all(
        (data || []).map(async (canonical) => {
          const { data: instances } = await supabase
            .from('task_instances')
            .select('id, actual_time_spent')
            .eq('canonical_task_id', canonical.id)
            .eq('status', 'completed')

          const completionCount = instances?.length || 0
          const totalTime = instances?.reduce((sum, i) => sum + (i.actual_time_spent || 0), 0) || 0

          return {
            ...canonical,
            completionCount,
            totalTime: Math.round(totalTime)
          }
        })
      )

      // Filter to only show tasks that have been completed at least once
      const completedTasks = tasksWithCounts.filter(t => t.completionCount > 0)
      setCanonicalTasks(completedTasks)
    } catch (error) {
      console.error('Error fetching canonical tasks:', error)
    }
  }

  const fetchCanonicalInstances = async (canonicalId) => {
    try {
      const { data, error } = await supabase
        .from('task_instances')
        .select('*')
        .eq('canonical_task_id', canonicalId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      if (error) throw error
      setCanonicalInstances(data || [])
    } catch (error) {
      console.error('Error fetching canonical instances:', error)
    }
  }

  const handleCanonicalClick = async (canonical) => {
    setSelectedCanonical(canonical)
    setCanonicalNotes(canonical.description || '')
    setIsNotesOpen(false)
    await fetchCanonicalInstances(canonical.id)
  }

  const handleDeleteCanonical = async () => {
    if (!selectedCanonical) return

    const confirmed = window.confirm(`Delete "${selectedCanonical.canonical_name}"? This will unlink all task instances but won't delete them.`)
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('canonical_tasks')
        .delete()
        .eq('id', selectedCanonical.id)

      if (error) throw error

      setSelectedCanonical(null)
      await fetchChartData()
      if (selectedDomain) {
        await fetchCanonicalTasksForDomain(selectedDomain)
      }
    } catch (error) {
      console.error('Error deleting canonical task:', error)
      alert('Failed to delete canonical task')
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedCanonical) return

    try {
      const { error } = await supabase
        .from('canonical_tasks')
        .update({ description: canonicalNotes.trim() })
        .eq('id', selectedCanonical.id)

      if (error) throw error

      setSelectedCanonical({ ...selectedCanonical, description: canonicalNotes.trim() })
    } catch (error) {
      console.error('Error saving notes:', error)
    }
  }

  const getDateRangeInfo = (instances) => {
    if (!instances || instances.length === 0) {
      return { days: 0, startDate: null, endDate: null }
    }

    const dates = instances
      .map(i => new Date(i.completed_at || i.scheduled_date))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a - b)

    if (dates.length === 0) {
      return { days: 0, startDate: null, endDate: null }
    }

    const startDate = dates[0]
    const endDate = dates[dates.length - 1]
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1

    return {
      days: daysDiff,
      startDate: formatDisplayDate(startDate),
      endDate: formatDisplayDate(endDate)
    }
  }

  const handleBarClick = (data) => {
    console.log('🖱️ Bar clicked:', data)
    console.log('🖱️ Setting selected domain to:', data.domainId)
    console.log('🖱️ Domain name:', data.name)
    setSelectedDomain(data.domainId)
  }

  const handleLinkOrphanedTasks = async () => {
    setIsLinking(true)
    const result = await linkOrphanedTasks(projectId)
    setIsLinking(false)

    if (result.success) {
      alert(`Successfully linked ${result.linked} tasks and created ${result.created} canonical tasks!`)
      // Refresh the data
      await fetchMonthlyData()
      await fetchChartData()
      if (selectedDomain) {
        await fetchCanonicalTasksForDomain(selectedDomain)
      }
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const formatTime = (minutes) => {
    if (!minutes) return '0 mins'
    if (minutes < 60) return `${minutes} mins`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-[var(--text-secondary)]">Loading progress...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Remove focus outlines from chart SVG elements */}
      <style>{`
        .recharts-bar-rectangle:focus,
        .recharts-bar-rectangle:focus-visible,
        .recharts-surface:focus,
        .recharts-surface:focus-visible,
        .recharts-wrapper:focus,
        .recharts-wrapper:focus-visible {
          outline: none !important;
        }
        .recharts-bar-rectangle {
          outline: none !important;
        }
      `}</style>

      {/* Orphaned Tasks Warning */}
      {orphanedTaskCount > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-yellow-400 text-sm font-medium mb-1">
              {orphanedTaskCount} completed {orphanedTaskCount === 1 ? 'task' : 'tasks'} not linked to canonical tasks
            </p>
            <p className="text-yellow-400/70 text-xs">
              These tasks were created before the canonical system was set up. Click to link them now.
            </p>
          </div>
          <button
            onClick={handleLinkOrphanedTasks}
            disabled={isLinking}
            className="px-4 py-2 bg-yellow-500 text-black rounded text-sm font-medium hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLinking ? 'Linking...' : 'Link Tasks'}
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--container-subtle)] rounded-lg p-4 text-center">
          <div className="text-2xl font-medium text-[var(--text-primary)] mb-1">
            {stats.totalHours}h
          </div>
          <div className="text-sm text-[var(--text-secondary)]">This Month</div>
        </div>

        <div className="bg-[var(--container-subtle)] rounded-lg p-4 text-center">
          <div className="text-2xl font-medium text-[var(--text-primary)] mb-1">
            {stats.dailyAverage}h
          </div>
          <div className="text-sm text-[var(--text-secondary)]">Daily Avg</div>
        </div>

        <div className="bg-[var(--container-subtle)] rounded-lg p-4 text-center">
          <div className="text-2xl font-medium text-[var(--text-primary)] mb-1">
            {stats.avgCompletion}%
          </div>
          <div className="text-sm text-[var(--text-secondary)]">Avg Completion</div>
        </div>

        <div className="bg-[var(--container-subtle)] rounded-lg p-4 text-center">
          <div className="text-2xl font-medium text-[var(--text-primary)] mb-1">
            {stats.tasksCompleted}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">Tasks Completed</div>
        </div>
      </div>

      {/* Progress Bar Chart */}
      <div className="bg-[var(--container-subtle)] rounded-lg p-6">
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
          Canonical Tasks by Domain
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              onClick={(data) => {
                if (data && data.activeLabel) {
                  // activeLabel gives us the domain name from the X-axis
                  const clickedDomain = chartData.find(d => d.name === data.activeLabel)
                  if (clickedDomain) {
                    handleBarClick(clickedDomain)
                  }
                }
              }}
              style={{ outline: 'none' }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--container-medium)" />
              <XAxis
                dataKey="name"
                stroke="var(--text-secondary)"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              />
              <YAxis
                stroke="var(--text-secondary)"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                label={{ value: 'Canonical Tasks Completed', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 12 }}
              />
              <Bar
                dataKey="count"
                radius={[8, 8, 0, 0]}
                fill="#879FC8"
                fillOpacity={0.8}
                activeBar={{ fillOpacity: 1 }}
                style={{ cursor: 'pointer', outline: 'none' }}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            No canonical tasks completed yet
          </div>
        )}
      </div>

      {/* Domain Canonical Tasks */}
      <div className="bg-[var(--container-subtle)] rounded-lg p-6">
        {/* Domain Name */}
        <h3 className="text-base font-medium text-[var(--text-primary)] mb-6">
          {domains.find(d => d.id === selectedDomain)?.name || 'Select a domain from the chart'}
        </h3>

        {/* Canonical Tasks List */}
        {canonicalTasks.length > 0 ? (
          <div className="space-y-3">
            {canonicalTasks.map((canonical) => (
              <div
                key={canonical.id}
                onClick={() => handleCanonicalClick(canonical)}
                className="bg-[var(--container-medium)] rounded-lg p-4 cursor-pointer hover:bg-[var(--container-intense)] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-[var(--text-primary)] font-medium mb-1">
                      {canonical.canonical_name}
                    </h4>
                    {canonical.version && (
                      <span className="text-xs text-[var(--text-secondary)]">V{canonical.version}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[var(--text-primary)] font-medium">
                      {canonical.completionCount} {canonical.completionCount === 1 ? 'time' : 'times'}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      {formatTime(canonical.totalTime)} total
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--text-secondary)]">
            No tasks here yet
          </div>
        )}
      </div>

      {/* Canonical Task Detail Modal */}
      {selectedCanonical && (() => {
        const dateInfo = getDateRangeInfo(canonicalInstances)
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedCanonical(null)}>
            <div
              className="bg-[var(--container-subtle)] rounded-lg w-[84%] h-[84%] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Section 1: Header (16%) */}
              <div className="px-6 py-4 border-b border-[var(--container-medium)]">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-medium text-[var(--text-primary)]">
                      {selectedCanonical.canonical_name}
                    </h2>
                    {selectedCanonical.version && (
                      <span className="px-2 py-0.5 text-xs bg-[var(--container-medium)] text-[var(--text-primary)] rounded">
                        V{selectedCanonical.version}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeleteCanonical}
                      className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                      aria-label="Delete canonical task"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => setSelectedCanonical(null)}
                      className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {dateInfo.days} {dateInfo.days === 1 ? 'day' : 'days'}
                  {dateInfo.startDate && dateInfo.endDate && (
                    <> | {dateInfo.startDate} - {dateInfo.endDate}</>
                  )}
                </p>
              </div>

              {/* Section 2: Notes Accordion (6% closed, 34% open) */}
              <div className="border-b border-[var(--container-medium)]">
                <button
                  onClick={() => setIsNotesOpen(!isNotesOpen)}
                  className="w-full px-6 py-3 flex items-center justify-between text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <span className="text-sm italic">
                    {canonicalNotes.trim() ? 'Notes' : 'Add Notes...'}
                  </span>
                  {isNotesOpen ? (
                    <ChevronUp className="w-4 h-4" strokeWidth={1.5} />
                  ) : (
                    <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                  )}
                </button>
                {isNotesOpen && (
                  <div className="px-6 pb-4">
                    <textarea
                      value={canonicalNotes}
                      onChange={(e) => setCanonicalNotes(e.target.value)}
                      onBlur={handleSaveNotes}
                      placeholder="Add Notes..."
                      className="w-full min-h-[120px] px-3 py-2 bg-[var(--container-medium)] text-[var(--text-primary)] text-sm rounded border-none outline-none resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Section 3: Task Instances */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Tasks</h3>
                <div className="space-y-2">
                  {canonicalInstances.map((instance) => {
                    const instanceStartDate = instance.scheduled_date ? new Date(instance.scheduled_date) : null
                    const instanceEndDate = instance.completed_at ? new Date(instance.completed_at) : null
                    const instanceDays = instanceStartDate && instanceEndDate
                      ? Math.ceil((instanceEndDate - instanceStartDate) / (1000 * 60 * 60 * 24)) + 1
                      : 1

                    return (
                      <div
                        key={instance.id}
                        className="bg-[var(--container-medium)] rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between">
                          {/* Left side */}
                          <div className="flex-1">
                            <p className="text-sm text-[var(--text-primary)] font-medium mb-1">
                              {instance.task_name}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {instanceDays} {instanceDays === 1 ? 'day' : 'days'} | {formatDisplayDate(instance.completed_at || instance.scheduled_date)}
                            </p>
                          </div>

                          {/* Right side */}
                          <div className="text-right ml-4">
                            <p className="text-sm text-[var(--text-primary)] font-medium mb-1">
                              {instance.actual_work_completed || 'Done'}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {formatTime(instance.actual_time_spent || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default ProgressTab
