import { useState } from 'react'
import { X, Trash2, Circle, CheckCircle2 } from 'lucide-react'

const TaskDetailModal = ({ task, onClose, onDelete, onUpdate, onToggleComplete, projects = [], domains = [] }) => {
  const [isCompleted, setIsCompleted] = useState(task.status === 'completed')
  const [taskName, setTaskName] = useState(task.task_name)
  const [description, setDescription] = useState(task.description || '')
  const [notes, setNotes] = useState(task.notes || '')

  // Editable fields state
  const [editingField, setEditingField] = useState(null)
  const [projectId, setProjectId] = useState(task.project_id)
  const [domainId, setDomainId] = useState(task.domain_id)
  const [scheduledDate, setScheduledDate] = useState(task.scheduled_date)
  const [timeboxValue, setTimeboxValue] = useState(task.timebox_value || '')
  const [timeboxUnit, setTimeboxUnit] = useState(task.timebox_unit || 'mins')
  const [targetValue, setTargetValue] = useState(task.target_value || '')
  const [measureType, setMeasureType] = useState(task.measure_type || 'unit')
  const [measureUnit, setMeasureUnit] = useState(task.measure_unit || 'unit')
  const [version, setVersion] = useState(task.version || '')

  const handleToggleComplete = () => {
    if (onToggleComplete) {
      onToggleComplete(task.id)
    }
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id)
      onClose()
    }
  }

  const handleStartTimer = () => {
    // Will implement timer functionality later
    console.log('Start timer for task:', task.id)
  }

  const handleCompleteTask = () => {
    // Open check-in modal by calling onToggleComplete
    if (onToggleComplete) {
      onToggleComplete(task.id)
    }
  }

  const handleFieldUpdate = (field, value) => {
    onUpdate(task.id, { [field]: value })
    setEditingField(null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[var(--container-subtle)] rounded-lg w-[84%] h-[84%] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - 10% */}
        <div className="h-[10%] px-8 flex items-center justify-between border-b border-[var(--container-medium)]">
          <h2 className="text-base font-medium text-[var(--text-primary)]">Task</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
              aria-label="Delete task"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Content - 90% split into 76% + 24% */}
        <div className="h-[90%] flex">
          {/* Left Section - 76% */}
          <div className="w-[76%] p-8 flex flex-col border-r border-[var(--container-medium)]">
            {/* Task Name and Description */}
            <div className="flex items-start gap-3 mb-6">
              <button
                onClick={handleToggleComplete}
                className="mt-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-[var(--accent-primary)]" strokeWidth={2} />
                ) : (
                  <Circle className="w-5 h-5" strokeWidth={1.5} />
                )}
              </button>
              <div className="flex-1">
                <h3 className={`text-xl font-medium text-[var(--text-primary)] mb-2 ${isCompleted ? 'line-through opacity-60' : ''}`}>
                  {taskName}
                </h3>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => handleFieldUpdate('description', description)}
                  placeholder="add description..."
                  className="w-full bg-transparent border-none outline-none text-sm text-[var(--text-secondary)] placeholder:italic placeholder:text-[var(--text-secondary)]"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-[var(--container-medium)] mb-6" />

            {/* Notes Section */}
            <div className="flex-1">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => handleFieldUpdate('notes', notes)}
                placeholder="Add Notes..."
                className="w-full h-full bg-transparent border-none outline-none text-[var(--text-secondary)] text-sm resize-none placeholder:italic placeholder:text-[var(--text-secondary)]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleStartTimer}
                className="flex-1 py-3 rounded bg-[var(--container-medium)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--container-intense)] transition-colors"
              >
                Start Task Timer
              </button>
              <button
                onClick={handleCompleteTask}
                className="flex-1 py-3 rounded bg-[var(--container-medium)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--container-intense)] transition-colors"
              >
                Complete Task
              </button>
            </div>
          </div>

          {/* Right Section - 24% */}
          <div className="w-[24%] p-8 flex flex-col gap-6">
            {/* Project Details */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-4">Project Details</h4>

              {/* Project */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Project</label>
                {editingField === 'project' ? (
                  <select
                    value={projectId}
                    onChange={(e) => {
                      setProjectId(e.target.value)
                      handleFieldUpdate('project_id', e.target.value)
                    }}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className="w-full bg-transparent text-[var(--text-primary)] text-sm border-none outline-none"
                  >
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                ) : (
                  <div
                    onDoubleClick={() => setEditingField('project')}
                    className="text-sm text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-primary)]"
                  >
                    {projects.find(p => p.id === projectId)?.name || 'Select project'}
                  </div>
                )}
                <div className="w-[80%] h-px bg-[var(--container-medium)] mt-2" />
              </div>

              {/* Domain */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Domain</label>
                {editingField === 'domain' ? (
                  <select
                    value={domainId}
                    onChange={(e) => {
                      setDomainId(e.target.value)
                      handleFieldUpdate('domain_id', e.target.value)
                    }}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className="w-full bg-transparent text-[var(--text-primary)] text-sm border-none outline-none"
                  >
                    {domains.map(domain => (
                      <option key={domain.id} value={domain.id}>{domain.name}</option>
                    ))}
                  </select>
                ) : (
                  <div
                    onDoubleClick={() => setEditingField('domain')}
                    className="text-sm text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-primary)]"
                  >
                    {task.domain?.name || 'Select domain'}
                  </div>
                )}
                <div className="w-[80%] h-px bg-[var(--container-medium)] mt-2" />
              </div>

              {/* Day */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Day</label>
                {editingField === 'day' ? (
                  <input
                    type="date"
                    value={scheduledDate || ''}
                    onChange={(e) => {
                      setScheduledDate(e.target.value)
                      handleFieldUpdate('scheduled_date', e.target.value)
                    }}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className="w-full bg-transparent text-[var(--text-primary)] text-sm border-none outline-none"
                  />
                ) : (
                  <div
                    onDoubleClick={() => setEditingField('day')}
                    className="text-sm text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-primary)]"
                  >
                    {scheduledDate ? new Date(scheduledDate).toLocaleDateString() : 'Today'}
                  </div>
                )}
                <div className="w-[80%] h-px bg-[var(--container-medium)] mt-2" />
              </div>
            </div>

            {/* Divider between sections */}
            <div className="w-full h-px bg-[var(--container-medium)]" />

            {/* Project Goals */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-4">Project Goals</h4>

              {/* Timebox */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Timebox</label>
                {editingField === 'timebox' ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={timeboxValue}
                      onChange={(e) => setTimeboxValue(e.target.value)}
                      onBlur={() => handleFieldUpdate('timebox_value', parseFloat(timeboxValue) || null)}
                      className="w-16 bg-transparent text-[var(--text-primary)] text-sm border-none outline-none"
                      autoFocus
                    />
                    <select
                      value={timeboxUnit}
                      onChange={(e) => {
                        setTimeboxUnit(e.target.value)
                        handleFieldUpdate('timebox_unit', e.target.value)
                      }}
                      className="bg-transparent text-[var(--text-primary)] text-sm border-none outline-none"
                    >
                      <option value="mins">mins</option>
                      <option value="hrs">hrs</option>
                    </select>
                  </div>
                ) : (
                  <div
                    onDoubleClick={() => setEditingField('timebox')}
                    className="text-sm text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-primary)]"
                  >
                    {timeboxValue ? `${timeboxValue} ${timeboxUnit}` : 'Set timebox'}
                  </div>
                )}
                <div className="w-[80%] h-px bg-[var(--container-medium)] mt-2" />
              </div>

              {/* Target */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Target</label>
                {editingField === 'target' ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="number"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      className="w-full bg-transparent text-[var(--text-primary)] text-sm border-none outline-none"
                      placeholder="Value"
                    />
                    <select
                      value={measureType}
                      onChange={(e) => setMeasureType(e.target.value)}
                      className="bg-transparent text-[var(--text-primary)] text-sm border-none outline-none"
                    >
                      <option value="unit">Unit</option>
                      <option value="percentage">%</option>
                      <option value="status">Status</option>
                      <option value="revisions">Revisions</option>
                    </select>
                    {measureType === 'unit' && (
                      <input
                        type="text"
                        value={measureUnit}
                        onChange={(e) => setMeasureUnit(e.target.value)}
                        className="w-full bg-transparent text-[var(--text-primary)] text-sm border-none outline-none"
                        placeholder="Unit name"
                      />
                    )}
                    <button
                      onClick={() => {
                        handleFieldUpdate('target_value', parseFloat(targetValue) || null)
                        handleFieldUpdate('measure_type', measureType)
                        if (measureType === 'unit') {
                          handleFieldUpdate('measure_unit', measureUnit)
                        }
                      }}
                      className="text-xs text-[var(--accent-primary)] self-start"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div
                    onDoubleClick={() => setEditingField('target')}
                    className="text-sm text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-primary)]"
                  >
                    {targetValue ? `${targetValue} ${measureUnit || measureType}` : 'Set target'}
                  </div>
                )}
                <div className="w-[80%] h-px bg-[var(--container-medium)] mt-2" />
              </div>

              {/* Version */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Version</label>
                {editingField === 'version' ? (
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    onBlur={() => handleFieldUpdate('version', version)}
                    autoFocus
                    className="w-full bg-transparent text-[var(--text-primary)] text-sm border-none outline-none"
                  />
                ) : (
                  <div
                    onDoubleClick={() => setEditingField('version')}
                    className="text-sm text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-primary)]"
                  >
                    {version ? `Version ${version}` : 'Set version'}
                  </div>
                )}
                <div className="w-[80%] h-px bg-[var(--container-medium)] mt-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetailModal
