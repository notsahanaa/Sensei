import { useState } from 'react'
import './MultiStepForm.css'

// Sensei Logo Component
const SenseiLogo = () => (
  <img src="/logo.png" alt="Sensei" style={{ width: '14px', height: '14px' }} />
)

const MultiStepForm = ({ email, onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    xHandle: '',
    challenge: [],
    challengeOther: '',
    triedApps: '',
    appsUsed: [],
    appsOther: '',
    whyNotWork: '',
    betaTesting: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const questions = [
    {
      id: 'userInfo',
      question: 'Tell us a bit about yourself',
      type: 'fields',
      fields: [
        {
          id: 'name',
          label: 'Name',
          placeholder: 'Enter your name',
          required: true
        },
        {
          id: 'xHandle',
          label: 'X handle (optional)',
          placeholder: '@username',
          required: false
        }
      ]
    },
    {
      id: 'challenge',
      question: 'What is your biggest challenge as a side hustler?',
      type: 'multiple',
      options: [
        "I'm not very consistent",
        "I feel guilty when I take a break",
        "I often spend time on low-priority tasks (busy work)",
        "I can't track how my project is progressing",
        "Other"
      ],
      otherField: 'challengeOther',
      otherPlaceholder: 'What other challenges do you face?'
    },
    {
      id: 'triedApps',
      question: 'Have you tried any productivity apps before?',
      type: 'single',
      options: [
        "No, Sensei will be my first",
        "Yes, but nothing worked",
        "Yes, currently using some"
      ]
    },
    {
      id: 'appsUsed',
      question: 'What apps have you used?',
      type: 'multiple',
      options: [
        "Asana",
        "ClickUp",
        "Jira",
        "Notion",
        "Obsidian",
        "Habitify",
        "Todoist",
        "Other"
      ],
      otherField: 'appsOther',
      otherPlaceholder: 'What other apps have you used?',
      conditional: () => formData.triedApps === 'Yes, currently using some' || formData.triedApps === 'Yes, but nothing worked',
      twoColumns: true
    },
    {
      id: 'whyNotWork',
      question: 'Why did the other apps not work?',
      type: 'text',
      placeholder: 'Tell us your experience...',
      conditional: () => formData.triedApps !== 'No, Sensei will be my first' && formData.triedApps !== ''
    },
    {
      id: 'betaTesting',
      question: 'Would you like to be contacted for user research and beta testing?',
      type: 'single',
      options: ["Yes", "No"]
    }
  ]

  // Filter out conditional questions that shouldn't be shown
  const activeQuestions = questions.filter(q => !q.conditional || q.conditional())
  const currentQuestion = activeQuestions[currentStep]

  const handleCheckboxChange = (value) => {
    const currentValues = formData[currentQuestion.id]
    setFormData(prev => ({
      ...prev,
      [currentQuestion.id]: currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value]
    }))
  }

  const handleRadioChange = (value) => {
    setFormData(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }))
  }

  const handleTextChange = (value) => {
    setFormData(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }))
  }

  const handleOtherFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const isStepValid = () => {
    if (currentQuestion.type === 'fields') {
      // Check all required fields are filled
      return currentQuestion.fields.every(field => {
        if (field.required) {
          return formData[field.id].trim() !== ''
        }
        return true
      })
    } else if (currentQuestion.type === 'multiple') {
      return formData[currentQuestion.id].length > 0
    } else if (currentQuestion.type === 'single') {
      return formData[currentQuestion.id] !== ''
    } else if (currentQuestion.type === 'text') {
      return formData[currentQuestion.id].trim() !== ''
    }
    return false
  }

  const handleNext = () => {
    if (currentStep < activeQuestions.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    } else {
      onBack()
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    const submitData = {
      email,
      name: formData.name,
      xHandle: formData.xHandle,
      challenge: formData.challenge,
      challengeOther: formData.challenge.includes('Other') ? formData.challengeOther : '',
      triedApps: formData.triedApps,
      appsUsed: (formData.triedApps === 'Yes, currently using some' || formData.triedApps === 'Yes, but nothing worked') ? formData.appsUsed : [],
      appsOther: formData.appsUsed.includes('Other') ? formData.appsOther : '',
      whyNotWork: formData.triedApps !== 'No, Sensei will be my first' ? formData.whyNotWork : '',
      betaTesting: formData.betaTesting
    }

    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbxUi2XQgDObYBdBniwgQe9suf4XhirAEP2Goz4zGZKuHQ3Ej8TqqulYavlhGPZLs7a_fQ/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      // no-cors mode means we can't read the response, but if no error is thrown, it worked
      onComplete()
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('There was an error submitting your response. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const showOtherField = currentQuestion.otherField &&
    (currentQuestion.type === 'multiple'
      ? formData[currentQuestion.id].includes('Other')
      : formData[currentQuestion.id] === 'Other')

  return (
    <div className="multistep-form">
      <div className="form-container">
        {/* Header */}
        <div className="form-header">
          <div className="header-group">
            <button className="back-button" onClick={handleBack} type="button">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="pill">
              <SenseiLogo />
              <span>Sensei</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          {activeQuestions.map((_, index) => (
            <div
              key={index}
              className={`progress-segment ${index <= currentStep ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* Question */}
        <h1 className="question-title">{currentQuestion.question}</h1>

        {/* Options */}
        <div className="options-container">
          {currentQuestion.type === 'fields' && (
            <div className="input-fields">
              {currentQuestion.fields.map(field => (
                <div key={field.id} className="input-field">
                  <label className="field-label">{field.label}</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder={field.placeholder}
                    value={formData[field.id]}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                    required={field.required}
                  />
                </div>
              ))}
            </div>
          )}

          {currentQuestion.type === 'multiple' && (
            <div className={`checkbox-group ${currentQuestion.twoColumns ? 'two-columns' : ''}`}>
              {currentQuestion.options.map(option => (
                <label key={option} className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={formData[currentQuestion.id].includes(option)}
                    onChange={() => handleCheckboxChange(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === 'single' && (
            <div className="radio-group">
              {currentQuestion.options.map(option => (
                <label key={option} className="radio-option">
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    checked={formData[currentQuestion.id] === option}
                    onChange={() => handleRadioChange(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === 'text' && (
            <textarea
              className="text-area"
              placeholder={currentQuestion.placeholder}
              value={formData[currentQuestion.id]}
              onChange={(e) => handleTextChange(e.target.value)}
              rows="6"
            />
          )}

          {showOtherField && (
            <input
              type="text"
              className="other-input"
              placeholder={currentQuestion.otherPlaceholder}
              value={formData[currentQuestion.otherField]}
              onChange={(e) => handleOtherFieldChange(currentQuestion.otherField, e.target.value)}
            />
          )}
        </div>

        {/* Next Button */}
        <button
          className="next-button"
          onClick={handleNext}
          disabled={!isStepValid() || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : (currentStep === activeQuestions.length - 1 ? 'Submit' : 'Next →')}
        </button>
      </div>
    </div>
  )
}

export default MultiStepForm
