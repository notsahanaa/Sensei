import { useState, useEffect, useRef } from 'react'
import './App.css'
import MultiStepForm from './MultiStepForm'

// Sensei Logo Component
const SenseiLogo = () => (
  <img src="/logo.png" alt="Sensei" style={{ width: '14px', height: '14px' }} />
)

// X/Twitter Icon Component
const XIcon = ({ color = "#879FC8" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill={color}/>
  </svg>
)

function App() {
  const [email, setEmail] = useState('')
  const [view, setView] = useState('landing') // 'landing', 'form', 'success'
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLockedInSection, setIsLockedInSection] = useState(false)
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const formRef = useRef(null)
  const horizontalScrollRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const wasLockedRef = useRef(false)
  const lastScrollDirectionRef = useRef('down')
  const scrollAccumulatorRef = useRef(0)
  const inEntryPhaseRef = useRef(false)
  const justExitedRef = useRef(false)
  const exitDirectionRef = useRef(null)
  const touchStartYRef = useRef(0)
  const touchStartXRef = useRef(0)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email) {
      setView('form')
    }
  }

  const handleFormComplete = () => {
    setView('success')
  }

  const handleBackToLanding = () => {
    setView('landing')
    setEmail('')
  }

  useEffect(() => {
    const updateSubtitleWidth = () => {
      if (titleRef.current && subtitleRef.current && formRef.current) {
        // Create a temporary element to measure the exact width of "Just Got an Upgrade"
        const tempSpan = document.createElement('span')
        const titleStyles = window.getComputedStyle(titleRef.current)

        // Copy all relevant font styles from the title
        tempSpan.style.fontFamily = titleStyles.fontFamily
        tempSpan.style.fontSize = titleStyles.fontSize
        tempSpan.style.fontWeight = titleStyles.fontWeight
        tempSpan.style.fontStyle = titleStyles.fontStyle
        tempSpan.style.letterSpacing = titleStyles.letterSpacing
        tempSpan.style.wordSpacing = titleStyles.wordSpacing
        tempSpan.style.position = 'absolute'
        tempSpan.style.visibility = 'hidden'
        tempSpan.style.whiteSpace = 'nowrap'
        tempSpan.textContent = 'Just Got an Upgrade'

        document.body.appendChild(tempSpan)
        const width = tempSpan.offsetWidth
        document.body.removeChild(tempSpan)

        // Apply the width to the subtitle (1.1x of the measured width)
        subtitleRef.current.style.maxWidth = `${width * 1.1}px`

        // Constrain the waitlist form to the title's width
        const titleWidth = titleRef.current.offsetWidth
        formRef.current.style.maxWidth = `${titleWidth}px`
      }
    }

    // Update on mount and resize
    updateSubtitleWidth()
    window.addEventListener('resize', updateSubtitleWidth)

    // Delay to ensure fonts are loaded
    const timer = setTimeout(updateSubtitleWidth, 100)

    return () => {
      window.removeEventListener('resize', updateSubtitleWidth)
      clearTimeout(timer)
    }
  }, [])

  // Horizontal scroll effect with wheel control (snap-to-slide)
  useEffect(() => {
    const SCROLL_THRESHOLD = 600 // Pixels of scroll needed to snap to next slide (~3 scrolls)
    const ENTRY_THRESHOLD = 600 // Pixels needed to exit entry phase and start horizontal scroll
    const MAX_SLIDE = 3

    const handleWheel = (e) => {
      if (!scrollContainerRef.current || !horizontalScrollRef.current) return

      const scrollContainer = scrollContainerRef.current
      const containerRect = scrollContainer.getBoundingClientRect()

      const deltaY = e.deltaY
      const deltaX = e.deltaX
      const scrollingDown = deltaY > 0
      const scrollingUp = deltaY < 0
      const scrollingRight = deltaX > 0
      const scrollingLeft = deltaX < 0

      // Track scroll direction (for entry/exit, only vertical matters)
      if (scrollingDown) lastScrollDirectionRef.current = 'down'
      if (scrollingUp) lastScrollDirectionRef.current = 'up'

      // Check if section is approaching or at viewport
      const sectionNearViewport = containerRect.top <= window.innerHeight * 0.8 && containerRect.bottom >= window.innerHeight * 0.2
      const sectionAtTop = containerRect.top <= 5 && containerRect.top >= -5

      // Clear justExited flag if section is completely out of viewport
      const sectionFarFromViewport = containerRect.top > window.innerHeight || containerRect.bottom < 0
      if (sectionFarFromViewport) {
        justExitedRef.current = false
        exitDirectionRef.current = null
      }

      // Clear justExited flag if scrolling in opposite direction of exit
      if (justExitedRef.current && exitDirectionRef.current) {
        if ((exitDirectionRef.current === 'up' && scrollingDown) ||
            (exitDirectionRef.current === 'down' && scrollingUp)) {
          justExitedRef.current = false
          exitDirectionRef.current = null
        }
      }

      // If section is near viewport but not locked, snap it to position (unless we just exited)
      if (sectionNearViewport && !isLockedInSection && !justExitedRef.current) {
        // Snap section to top
        const scrollToPosition = scrollContainer.offsetTop
        window.scrollTo({ top: scrollToPosition, behavior: 'smooth' })

        setIsLockedInSection(true)
        inEntryPhaseRef.current = true
        scrollAccumulatorRef.current = 0

        // Set initial slide based on direction
        if (lastScrollDirectionRef.current === 'down') {
          setCurrentSlide(0)
        } else {
          setCurrentSlide(MAX_SLIDE)
        }
      }

      // Update wasLocked ref
      wasLockedRef.current = isLockedInSection

      // If locked, handle scrolling (entry phase or horizontal slides)
      if (isLockedInSection) {
        e.preventDefault()

        // Accumulate scroll delta (use whichever is larger - vertical or horizontal)
        const dominantDelta = Math.abs(deltaY) > Math.abs(deltaX) ? deltaY : deltaX
        scrollAccumulatorRef.current += Math.abs(dominantDelta)

        // Check if we're in entry phase (must accumulate before horizontal scroll starts)
        if (inEntryPhaseRef.current) {
          if (scrollAccumulatorRef.current >= ENTRY_THRESHOLD) {
            // Exit entry phase, allow horizontal scrolling
            inEntryPhaseRef.current = false
            scrollAccumulatorRef.current = 0
          }
          // Don't do anything else during entry phase, just lock the section
          return
        }

        // Normal horizontal scroll logic (after entry phase)
        // Check if we've accumulated enough scroll to snap to next slide
        if (scrollAccumulatorRef.current >= SCROLL_THRESHOLD) {
          // Reset accumulator
          scrollAccumulatorRef.current = 0

          setCurrentSlide(prevSlide => {
            // Determine navigation direction (vertical down/right OR horizontal right = next)
            const moveNext = scrollingDown || scrollingRight
            const movePrev = scrollingUp || scrollingLeft

            if (moveNext) {
              // If already at last slide, exit to philosophy section (only for vertical scroll)
              if (prevSlide === MAX_SLIDE && scrollingDown) {
                setIsLockedInSection(false)
                inEntryPhaseRef.current = false
                justExitedRef.current = true
                exitDirectionRef.current = 'down'
                setTimeout(() => {
                  window.scrollBy({ top: window.innerHeight * 0.5, behavior: 'smooth' })
                }, 50)
                return MAX_SLIDE
              }

              // Otherwise move to next slide (capped at MAX_SLIDE)
              return Math.min(prevSlide + 1, MAX_SLIDE)
            } else if (movePrev) {
              // If already at first slide, exit to waitlist section (only for vertical scroll)
              if (prevSlide === 0 && scrollingUp) {
                setIsLockedInSection(false)
                inEntryPhaseRef.current = false
                justExitedRef.current = true
                exitDirectionRef.current = 'up'
                setTimeout(() => {
                  window.scrollBy({ top: -window.innerHeight * 0.5, behavior: 'smooth' })
                }, 50)
                return 0
              }

              // Otherwise move to previous slide (capped at 0)
              return Math.max(prevSlide - 1, 0)
            }

            return prevSlide
          })
        }
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [currentSlide, isLockedInSection])

  // Touch support for mobile horizontal scroll
  useEffect(() => {
    const SCROLL_THRESHOLD = 300 // Pixels of vertical swipe needed to snap to next slide
    const ENTRY_THRESHOLD = 200 // Pixels needed to exit entry phase
    const MAX_SLIDE = 3

    const handleTouchStart = (e) => {
      if (!scrollContainerRef.current) return

      const touch = e.touches[0]
      touchStartYRef.current = touch.clientY
      touchStartXRef.current = touch.clientX
    }

    const handleTouchMove = (e) => {
      if (!scrollContainerRef.current || !horizontalScrollRef.current) return
      if (touchStartYRef.current === 0) return

      const scrollContainer = scrollContainerRef.current
      const containerRect = scrollContainer.getBoundingClientRect()

      const touch = e.touches[0]
      const deltaY = touchStartYRef.current - touch.clientY
      const deltaX = touchStartXRef.current - touch.clientX

      // Determine swipe direction
      const scrollingDown = deltaY > 0
      const scrollingUp = deltaY < 0
      const scrollingLeft = deltaX > 0  // Swipe left (touch moves left)
      const scrollingRight = deltaX < 0  // Swipe right (touch moves right)

      // Track scroll direction (for entry/exit, only vertical matters)
      if (scrollingDown) lastScrollDirectionRef.current = 'down'
      if (scrollingUp) lastScrollDirectionRef.current = 'up'

      // Check if section is approaching or at viewport
      const sectionNearViewport = containerRect.top <= window.innerHeight * 0.8 && containerRect.bottom >= window.innerHeight * 0.2

      // Clear justExited flag if section is completely out of viewport
      const sectionFarFromViewport = containerRect.top > window.innerHeight || containerRect.bottom < 0
      if (sectionFarFromViewport) {
        justExitedRef.current = false
        exitDirectionRef.current = null
      }

      // Clear justExited flag if scrolling in opposite direction of exit
      if (justExitedRef.current && exitDirectionRef.current) {
        if ((exitDirectionRef.current === 'up' && scrollingDown) ||
            (exitDirectionRef.current === 'down' && scrollingUp)) {
          justExitedRef.current = false
          exitDirectionRef.current = null
        }
      }

      // If section is near viewport but not locked, snap it to position (unless we just exited)
      // Only trigger on vertical swipes
      if (sectionNearViewport && !isLockedInSection && !justExitedRef.current && Math.abs(deltaY) > Math.abs(deltaX)) {
        e.preventDefault()

        // Snap section to top
        const scrollToPosition = scrollContainer.offsetTop
        window.scrollTo({ top: scrollToPosition, behavior: 'smooth' })

        setIsLockedInSection(true)
        inEntryPhaseRef.current = true
        scrollAccumulatorRef.current = 0

        // Set initial slide based on direction
        if (lastScrollDirectionRef.current === 'down') {
          setCurrentSlide(0)
        } else {
          setCurrentSlide(MAX_SLIDE)
        }
      }

      // If locked, handle scrolling (entry phase or horizontal slides)
      if (isLockedInSection) {
        e.preventDefault()

        // Accumulate scroll delta (use whichever is larger - vertical or horizontal)
        const dominantDelta = Math.abs(deltaY) > Math.abs(deltaX) ? deltaY : deltaX
        scrollAccumulatorRef.current += Math.abs(dominantDelta)

        // Check if we're in entry phase (must accumulate before horizontal scroll starts)
        if (inEntryPhaseRef.current) {
          if (scrollAccumulatorRef.current >= ENTRY_THRESHOLD) {
            // Exit entry phase, allow horizontal scrolling
            inEntryPhaseRef.current = false
            scrollAccumulatorRef.current = 0
          }
          return
        }

        // Normal horizontal scroll logic (after entry phase)
        // Check if we've accumulated enough scroll to snap to next slide
        if (scrollAccumulatorRef.current >= SCROLL_THRESHOLD) {
          // Reset accumulator
          scrollAccumulatorRef.current = 0

          // Reset touch start for next gesture
          touchStartYRef.current = touch.clientY
          touchStartXRef.current = touch.clientX

          setCurrentSlide(prevSlide => {
            // Determine navigation direction (vertical down/left OR horizontal left = next)
            const moveNext = scrollingDown || scrollingLeft
            const movePrev = scrollingUp || scrollingRight

            if (moveNext) {
              // If already at last slide, exit to philosophy section (only for vertical swipe)
              if (prevSlide === MAX_SLIDE && scrollingDown) {
                setIsLockedInSection(false)
                inEntryPhaseRef.current = false
                justExitedRef.current = true
                exitDirectionRef.current = 'down'
                setTimeout(() => {
                  window.scrollBy({ top: window.innerHeight * 0.5, behavior: 'smooth' })
                }, 50)
                return MAX_SLIDE
              }

              // Otherwise move to next slide (capped at MAX_SLIDE)
              return Math.min(prevSlide + 1, MAX_SLIDE)
            } else if (movePrev) {
              // If already at first slide, exit to waitlist section (only for vertical swipe)
              if (prevSlide === 0 && scrollingUp) {
                setIsLockedInSection(false)
                inEntryPhaseRef.current = false
                justExitedRef.current = true
                exitDirectionRef.current = 'up'
                setTimeout(() => {
                  window.scrollBy({ top: -window.innerHeight * 0.5, behavior: 'smooth' })
                }, 50)
                return 0
              }

              // Otherwise move to previous slide (capped at 0)
              return Math.max(prevSlide - 1, 0)
            }

            return prevSlide
          })
        }
      }
    }

    const handleTouchEnd = () => {
      touchStartYRef.current = 0
      touchStartXRef.current = 0
      scrollAccumulatorRef.current = 0
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [currentSlide, isLockedInSection])

  // Update slide position when currentSlide changes
  useEffect(() => {
    if (horizontalScrollRef.current) {
      const translateX = -currentSlide * window.innerWidth
      horizontalScrollRef.current.style.transform = `translateX(${translateX}px)`
      horizontalScrollRef.current.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }, [currentSlide])

  // Show multi-step form
  if (view === 'form') {
    return <MultiStepForm email={email} onBack={handleBackToLanding} onComplete={handleFormComplete} />
  }

  // Show success message
  if (view === 'success') {
    return (
      <div className="app">
        <div className="container">
          <div className="success-message">
            <h1 className="success-title">You're on the list! 🎉</h1>
            <p className="success-text">
              Thank you for joining the Sensei waitlist. We'll be in touch soon with updates about your side hustle productivity companion.
            </p>
            <a
              href="https://x.com/sahananarenx"
              target="_blank"
              rel="noopener noreferrer"
              className="success-link"
            >
              <span>Follow the journey on</span>
              <XIcon color="#FFFFFF" />
            </a>
            <button onClick={handleBackToLanding} className="back-to-landing">
              Back to landing page
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show landing page
  return (
    <div className="app">
      {/* First Section - Original Landing Page */}
      <div className="container">
        {/* Pill with Sensei logo and text */}
        <div className="pill">
          <SenseiLogo />
          <span>Sensei</span>
        </div>

        {/* Divider */}
        <div className="divider"></div>

        {/* Title */}
        <h1 className="title" ref={titleRef}>
          Your Side Hustle To-do List<br />
          Just Got an Upgrade
        </h1>

        {/* Subtitle */}
        <div className="subtitle" ref={subtitleRef}>
          <p>
            The first productivity tool that organises itself around your hustle. <span className="darker">Complete your daily tasks; Sensei will give you insights into your workflow and project progress.</span>
          </p>
        </div>

        {/* Waitlist Form */}
        <form onSubmit={handleSubmit} className="waitlist-form" ref={formRef}>
          <div className="input-wrapper">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@gmail.com"
              className="email-input"
              required
            />
            <button
              type="submit"
              className={`submit-button ${email ? 'active' : ''}`}
            >
              Join the waitlist
            </button>
          </div>
        </form>

        {/* Social Link */}
        <a
          href="https://x.com/sahananarenx"
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
        >
          <span>Connect on</span>
          <XIcon />
        </a>
      </div>

      {/* Second Section - Features with Horizontal Scroll */}
      <div className="features-scroll-container" ref={scrollContainerRef}>
        <div className="features-horizontal-scroll" ref={horizontalScrollRef}>
          {/* Slide 1 - Tasks */}
          <div className="feature-slide">
            <div className="tasks-content">
              <div className="pagination-bar">
                <div className={`pagination-segment ${currentSlide >= 0 ? 'active' : ''}`}></div>
                <div className={`pagination-segment ${currentSlide >= 1 ? 'active' : ''}`}></div>
                <div className={`pagination-segment ${currentSlide >= 2 ? 'active' : ''}`}></div>
                <div className={`pagination-segment ${currentSlide >= 3 ? 'active' : ''}`}></div>
              </div>
              <h2 className="tasks-heading">CONVERT YOUR GOAL INTO DAILY TASKS</h2>
              <p className="tasks-body">
                You sit to work on your project, but you have no clue where to start today. So you end up polishing your draft for the tenth time. Sensei saves you this trouble by suggesting action items based on your project progress.
              </p>
              <picture>
                <source media="(max-width: 768px)" srcSet="/tasks(mob).png" />
                <img src="/tasks(web).png" alt="Tasks Interface" className="tasks-image" />
              </picture>
            </div>
          </div>

          {/* Slide 2 - Productivity */}
          <div className="feature-slide">
            <div className="tasks-content">
              <div className="pagination-bar">
                <div className={`pagination-segment ${currentSlide >= 0 ? 'active' : ''}`}></div>
                <div className={`pagination-segment ${currentSlide >= 1 ? 'active' : ''}`}></div>
                <div className={`pagination-segment ${currentSlide >= 2 ? 'active' : ''}`}></div>
                <div className={`pagination-segment ${currentSlide >= 3 ? 'active' : ''}`}></div>
              </div>
              <h2 className="tasks-heading">SEE WHERE YOUR TIME GOES</h2>
              <p className="tasks-body">
                As a side hustler, you have to balance your life and your passion projects. Sensei helps you track how consistent you are and how much time you spend on your projects.
              </p>
              <picture>
                <source media="(max-width: 768px)" srcSet="/productivity(mob).png" />
                <img src="/productivity(web).png" alt="Productivity Interface" className="tasks-image" />
              </picture>
            </div>
          </div>

          {/* Slide 3 - Progress */}
          <div className="feature-slide">
            <div className="tasks-content">
              <div className="pagination-bar">
                <div className={`pagination-segment ${currentSlide >= 0 ? 'active' : ''}`}></div>
                <div className={`pagination-segment ${currentSlide >= 1 ? 'active' : ''}`}></div>
                <div className={`pagination-segment ${currentSlide >= 2 ? 'active' : ''}`}></div>
                <div className={`pagination-segment ${currentSlide >= 3 ? 'active' : ''}`}></div>
              </div>
              <h2 className="tasks-heading">SEE IF YOUR ACTIONS MOVE THE NEEDLE</h2>
              <p className="tasks-body">
                You're building your project brick by brick. You steal time off of your life to place another "brick" in this tower you're building. But is it shaping up the way you want? Sensei helps you visualize how your project's progress emerges from your daily efforts.
              </p>
              <picture>
                <source media="(max-width: 768px)" srcSet="/progress(mob).png" />
                <img src="/progress(web).png" alt="Progress Interface" className="tasks-image" />
              </picture>
            </div>
          </div>

          {/* Slide 4 - Breaks */}
          <div className="feature-slide">
            <div className="tasks-content">
              <div className="pagination-bar">
                <div className={`pagination-segment ${currentSlide >= 0 ? 'active' : ''}`}></div>
                <div className={`pagination-segment ${currentSlide >= 1 ? 'active' : ''}`}></div>
                <div className={`pagination-segment ${currentSlide >= 2 ? 'active' : ''}`}></div>
                <div className={`pagination-segment ${currentSlide >= 3 ? 'active' : ''}`}></div>
              </div>
              <h2 className="tasks-heading">TOUCH GRASS WITHOUT FEELING GUILTY</h2>
              <p className="tasks-body">
                Taking time off to live your life is as much a part of the building journey as the building itself is. Sensei helps you capture your creative breaks in your timeline so you can look back on how human your journey was and how you've worked despite these commitments.
              </p>
              <picture>
                <source media="(max-width: 768px)" srcSet="/Breaks(mob).png" />
                <img src="/Breaks(web).png" alt="Breaks Interface" className="tasks-image" />
              </picture>
            </div>
          </div>
        </div>
      </div>

      {/* Third Section - Atomic Projects Philosophy */}
      <div className="philosophy-section">
        <div className="philosophy-content">
          {/* Left Column */}
          <div className="philosophy-left">
            <h2 className="philosophy-heading">
              <span className="philosophy-heading-highlight">ATOMIC PROJECTS</span><br />
              THE PHILOSOPHY BEHIND SENSEI
            </h2>
            <p className="philosophy-body">
              Your biggest goals — launching a business, building a brand, becoming a domain expert — don't require massive life overhauls. They're the result of small, intentional steps repeated long enough to compound into something huge. You don't need more time, talent, or perfect conditions — you need consistency at a micro-level, every day, toward one project that matters.
              <br /><br />
              Sensei helps you plan these micro-steps and tracks how they compound
            </p>
          </div>

          {/* Right Column */}
          <div className="philosophy-right">
            <img src="/illustration.png" alt="Atomic Projects Illustration" className="philosophy-image" />
          </div>
        </div>
      </div>

      {/* Fourth Section - Final CTA */}
      <div className="final-cta-section">
        <div className="final-cta-content">
          {/* Heading */}
          <h1 className="final-cta-heading">
            Structure Your Chaotic<br />
            Workflow With Sensei
          </h1>

          {/* Subtitle */}
          <p className="final-cta-subtitle">
            Track your Input, Output & Outcome
          </p>

          {/* Waitlist Form */}
          <form onSubmit={handleSubmit} className="final-cta-form">
            <div className="input-wrapper">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="email-input"
                required
              />
              <button
                type="submit"
                className={`submit-button ${email ? 'active' : ''}`}
              >
                Join the waitlist
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="final-footer">
            <div className="footer-line"></div>
            <div className="footer-content">
              <span className="footer-copyright">© 2025 Sensei. All Rights Reserved.</span>
              <a
                href="https://x.com/sahananarenx"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social"
              >
                <span>Connect on</span>
                <XIcon />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
