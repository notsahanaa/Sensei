import { useState } from 'react'
import Button from './Button'

const OnboardingModal = ({ isOpen, onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      heading: 'Feature 1',
      body: 'Coming soon'
    },
    {
      heading: 'Feature 2',
      body: 'Coming soon'
    },
    {
      heading: 'Feature 3',
      body: 'Coming soon'
    }
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      onComplete()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black bg-opacity-50">
      {/* Modal Container - 84% width on desktop, responsive on mobile */}
      <div className="w-full max-w-4xl bg-[var(--container-subtle)] rounded-2xl border border-[var(--container-medium)] overflow-hidden">
        {/* Modal Content */}
        <div className="p-8 md:p-12">
          {/* Heading - Left Aligned */}
          <h2 className="text-[var(--font-heading-l)] font-medium text-[var(--text-primary)] mb-6 text-left">
            {slides[currentSlide].heading}
          </h2>

          {/* Body Content - Left Aligned */}
          <div className="text-[var(--font-body-m)] text-[var(--text-secondary)] mb-12 text-left min-h-[200px] md:min-h-[300px]">
            {slides[currentSlide].body}
          </div>

          {/* Pagination and Button */}
          <div className="flex items-center justify-between">
            {/* Pagination Dots */}
            <div className="flex items-center gap-2">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-8 bg-[var(--accent-primary)]'
                      : 'w-2 bg-[var(--container-intense)]'
                  }`}
                />
              ))}
            </div>

            {/* Next/Get Started Button */}
            <div className="w-32">
              <Button onClick={handleNext} variant="primary">
                {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingModal
