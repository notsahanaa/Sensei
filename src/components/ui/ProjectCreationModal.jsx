import { useState, useEffect } from 'react'
import Button from './Button'
import { supabase } from '../../lib/supabase'

// Pre-templated domains for each project type
const PROJECT_TYPE_DOMAINS = {
  product: [
    {
      name: "Concept & Market",
      description: "Clarifying the problem, the user, and why this product should exist."
    },
    {
      name: "User Research",
      description: "Learning directly from users through conversations, testing, and observation."
    },
    {
      name: "Prod & Designing",
      description: "Defining what to build and how users will experience it."
    },
    {
      name: "Building",
      description: "Turning ideas into a working product through implementation and shipping."
    },
    {
      name: "Marketing & Distribution",
      description: "Getting the product in front of the right people and driving adoption."
    },
    {
      name: "Feedback & Analytics",
      description: "Understanding how users behave and what's working (or not)."
    },
    {
      name: "Customer Support",
      description: "Helping users succeed and learning from their issues and requests."
    }
  ]
}

const ProjectCreationModal = ({ isOpen, onClose, onComplete }) => {
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState('product')
  const [projectSummary, setProjectSummary] = useState('')
  const [domains, setDomains] = useState([])
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState(null)
  const [isAddingDomain, setIsAddingDomain] = useState(false)
  const [newDomainName, setNewDomainName] = useState('')
  const [newDomainDescription, setNewDomainDescription] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [domainsUnlocked, setDomainsUnlocked] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Initialize domains based on project type
  const currentDomains = domains.length > 0 ? domains : PROJECT_TYPE_DOMAINS[projectType] || []

  // Check if domains should be shown
  const shouldShowDomains = domainsUnlocked

  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newDomains = [...currentDomains]
    const draggedItem = newDomains[draggedIndex]
    newDomains.splice(draggedIndex, 1)
    newDomains.splice(index, 0, draggedItem)

    setDomains(newDomains)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleDeleteDomain = (index) => {
    const newDomains = currentDomains.filter((_, i) => i !== index)
    setDomains(newDomains)
    setDeleteConfirmIndex(null)
  }

  const handleSaveNewDomain = () => {
    if (newDomainName.trim() && newDomainDescription.trim()) {
      const newDomain = {
        name: newDomainName.trim(),
        description: newDomainDescription.trim()
      }
      setDomains([...currentDomains, newDomain])
      setNewDomainName('')
      setNewDomainDescription('')
      setIsAddingDomain(false)
    }
  }

  const handleAutosave = () => {
    // TODO: Implement actual autosave to database
    // For now, state is already being updated via onChange
    console.log('Autosaving project:', { projectName, projectSummary })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur() // Trigger blur event
      handleAutosave()
    }
  }

  const resetModalState = () => {
    setProjectName('')
    setProjectType('product')
    setProjectSummary('')
    setDomains([])
    setDraggedIndex(null)
    setDeleteConfirmIndex(null)
    setIsAddingDomain(false)
    setNewDomainName('')
    setNewDomainDescription('')
    setShowCancelConfirm(false)
    setDomainsUnlocked(false)
    setIsSaving(false)
    setSaveError(null)
  }

  const handleCancelConfirm = () => {
    resetModalState()
    onClose()
  }

  const handleCreateProject = async () => {
    try {
      setIsSaving(true)
      setSaveError(null)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('User not authenticated')

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([
          {
            user_id: user.id,
            name: projectName.trim(),
            description: projectSummary.trim(),
            type: projectType
          }
        ])
        .select()
        .single()

      if (projectError) throw projectError

      // Create domains for the project
      const domainsToInsert = currentDomains.map((domain, index) => ({
        project_id: project.id,
        name: domain.name,
        description: domain.description,
        order_index: index
      }))

      const { error: domainsError } = await supabase
        .from('domains')
        .insert(domainsToInsert)

      if (domainsError) throw domainsError

      // Success! Reset and close
      resetModalState()
      onComplete(project)
    } catch (error) {
      console.error('Error creating project:', error)
      setSaveError(error.message || 'Failed to create project')
    } finally {
      setIsSaving(false)
    }
  }

  // Unlock domains when user finishes typing project name
  const handleProjectNameComplete = () => {
    if (projectName.trim() && !domainsUnlocked) {
      setDomainsUnlocked(true)
    }
  }

  // Reset modal when it opens
  useEffect(() => {
    if (isOpen) {
      resetModalState()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black bg-opacity-70">
      {/* Modal Container - Pop-up Container (84% width) */}
      <div className="w-full max-w-[84%] bg-[var(--bg)] rounded-2xl border border-[var(--container-medium)] overflow-hidden flex flex-col h-[80vh]">

        {/* First Section - 16% of modal height */}
        <div className="h-[16%] p-6 md:p-8 flex flex-col justify-center gap-3">
          {/* Project Name & Type Tag Row */}
          <div className="flex items-center justify-between gap-3">
            {/* Project Name Input */}
            <input
              type="text"
              value={projectName}
              onChange={(e) => {
                const value = e.target.value
                setProjectName(value.charAt(0).toUpperCase() + value.slice(1))
              }}
              onBlur={() => {
                handleAutosave()
                handleProjectNameComplete()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur()
                  handleAutosave()
                  handleProjectNameComplete()
                }
              }}
              placeholder="Add Project Name…"
              className="flex-1 text-[24px] font-medium text-[var(--text-primary)] bg-transparent border-none outline-none placeholder:text-[var(--text-secondary)]"
              autoFocus
            />

            {/* Project Type Tag - TODO: Add dropdown later */}
            <span className="px-3 py-1 rounded-full text-[14px] font-normal bg-[var(--accent-primary)] text-[var(--bg)] whitespace-nowrap">
              Product
            </span>
          </div>

          {/* Project Summary Input */}
          <input
            type="text"
            value={projectSummary}
            onChange={(e) => {
              const value = e.target.value
              setProjectSummary(value.charAt(0).toUpperCase() + value.slice(1))
            }}
            onBlur={handleAutosave}
            onKeyDown={handleKeyDown}
            placeholder="Add a short summary of the project..."
            className="text-[14px] text-[var(--text-primary)] bg-transparent border-none outline-none placeholder:text-[var(--text-secondary)]"
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--container-medium)]"></div>

        {/* Second Section - 74% of modal height */}
        <div className="h-[74%] p-6 md:p-8 overflow-y-auto">
          {shouldShowDomains ? (
            <>
              {/* Section Heading */}
              <h3 className="text-[16px] font-medium text-[var(--text-primary)] mb-2">
                Domains ({PROJECT_TYPE_DOMAINS[projectType]?.length || 0})
              </h3>

              {/* Section Subheading */}
              <p className="text-[14px] text-[var(--text-secondary)] mb-6">
                Domains are the key areas of work that make up a project. Every task contributes to one domain, and together they show how the project is progressing.
              </p>

              {/* Domains List */}
              <div className="space-y-3">
                {currentDomains.map((domain, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className="group relative flex items-start gap-3 p-4 bg-[var(--container-subtle)] rounded-lg border border-[var(--container-medium)] cursor-move hover:border-[var(--accent-primary)] transition-all"
                  >
                    {/* Drag Handle - Shows on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab active:cursor-grabbing self-center">
                      <svg width="12" height="16" viewBox="0 0 12 16" fill="none" className="text-[var(--text-secondary)]">
                        <circle cx="3" cy="3" r="1.5" fill="currentColor"/>
                        <circle cx="9" cy="3" r="1.5" fill="currentColor"/>
                        <circle cx="3" cy="8" r="1.5" fill="currentColor"/>
                        <circle cx="9" cy="8" r="1.5" fill="currentColor"/>
                        <circle cx="3" cy="13" r="1.5" fill="currentColor"/>
                        <circle cx="9" cy="13" r="1.5" fill="currentColor"/>
                      </svg>
                    </div>

                    {/* Domain Content */}
                    <div className="flex-1 flex flex-col gap-1">
                      <h4 className="text-[14px] font-medium text-[var(--text-primary)]">
                        {domain.name}
                      </h4>
                      <p className="text-[12px] text-[var(--text-secondary)]">
                        {domain.description}
                      </p>
                    </div>

                    {/* Trash Icon */}
                    <button
                      onClick={() => setDeleteConfirmIndex(index)}
                      className="flex-shrink-0 p-1 text-[var(--text-secondary)] hover:text-red-500 transition-colors mt-1"
                      aria-label="Delete domain"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4m1.5 0v9.5a1 1 0 01-1 1h-7a1 1 0 01-1-1V4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add New Domain Card or Button */}
                {isAddingDomain ? (
                  <div className="flex items-start gap-3 p-4 bg-[var(--container-subtle)] rounded-lg border border-[var(--accent-primary)]">
                    {/* Domain Input Fields */}
                    <div className="flex-1 flex flex-col gap-2">
                      <input
                        type="text"
                        value={newDomainName}
                        onChange={(e) => setNewDomainName(e.target.value)}
                        placeholder="Name of the Domain…"
                        className="text-[14px] font-medium text-[var(--text-primary)] bg-transparent border-none outline-none placeholder:text-[var(--text-secondary)]"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={newDomainDescription}
                        onChange={(e) => setNewDomainDescription(e.target.value)}
                        placeholder="Describe the domain…"
                        className="text-[12px] text-[var(--text-primary)] bg-transparent border-none outline-none placeholder:text-[var(--text-secondary)]"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-center">
                      {/* Cancel Button */}
                      <button
                        onClick={() => {
                          setIsAddingDomain(false)
                          setNewDomainName('')
                          setNewDomainDescription('')
                        }}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--container-medium)] text-[var(--text-secondary)] flex items-center justify-center hover:opacity-80 transition-opacity"
                        aria-label="Cancel"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 4L4 12M4 4l8 8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      {/* Save Button - Arrow Icon with Circle */}
                      <button
                        onClick={handleSaveNewDomain}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--accent-primary)] text-[var(--bg)] flex items-center justify-center hover:opacity-80 transition-opacity"
                        aria-label="Save domain"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingDomain(true)}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-[var(--container-medium)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3v10M3 8h10" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[14px] font-medium">Add new Domain</span>
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--container-medium)]"></div>

        {/* Third Section - 10% of modal height */}
        <div className="h-[10%] p-6 md:p-8 flex flex-col justify-center gap-2">
          {/* Error Message */}
          {saveError && (
            <p className="text-[12px] text-red-500 text-right">
              {saveError}
            </p>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-4">
            <div className="w-[200px]">
              <Button
                onClick={() => setShowCancelConfirm(true)}
                variant="secondary"
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
            <div className="w-[200px]">
              <Button
                onClick={handleCreateProject}
                variant="primary"
                disabled={!projectName.trim() || isSaving}
                loading={isSaving}
              >
                {isSaving ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {deleteConfirmIndex !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black bg-opacity-70">
          <div className="bg-[var(--bg)] rounded-lg border border-[var(--container-medium)] p-6 max-w-sm w-full">
            <h3 className="text-[16px] font-medium text-[var(--text-primary)] mb-2">
              Delete Domain?
            </h3>
            <p className="text-[14px] text-[var(--text-secondary)] mb-6">
              Are you sure you want to delete "{currentDomains[deleteConfirmIndex]?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button onClick={() => setDeleteConfirmIndex(null)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={() => handleDeleteDomain(deleteConfirmIndex)} variant="primary">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Popup */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black bg-opacity-70">
          <div className="bg-[var(--bg)] rounded-lg border border-[var(--container-medium)] p-6 max-w-sm w-full">
            <h3 className="text-[16px] font-medium text-[var(--text-primary)] mb-2">
              Cancel Project Creation?
            </h3>
            <p className="text-[14px] text-[var(--text-secondary)] mb-6">
              Your progress will be lost and won't be saved. Are you sure you want to cancel?
            </p>
            <div className="flex justify-end gap-3">
              <Button onClick={() => setShowCancelConfirm(false)} variant="secondary">
                Keep Editing
              </Button>
              <Button onClick={handleCancelConfirm} variant="primary">
                Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectCreationModal
