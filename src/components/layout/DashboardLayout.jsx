import { useState } from 'react'
import Navbar from './Navbar'
import ThemeToggle from '../ui/ThemeToggle'

const DashboardLayout = ({ children, title, headerRight }) => {
  const [navOpen, setNavOpen] = useState(true)

  const toggleNav = () => setNavOpen(!navOpen)

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Navbar */}
      <Navbar isOpen={navOpen} toggleNav={toggleNav} />

      {/* Main Content Area */}
      <main
        className={`
          min-h-screen transition-all duration-300
          ${navOpen ? 'lg:ml-[24%]' : 'lg:ml-16'}
        `}
      >
        {/* Header with Mobile Menu and Theme */}
        <header className="sticky top-0 z-30 bg-[var(--bg)] border-b border-[var(--container-medium)] px-6 h-16 flex items-center">
          <div className="w-full flex items-center justify-between">
            {/* Left side: Mobile Menu + Page Title */}
            <div className="flex items-center gap-3">
              {/* Mobile Burger Menu (only on mobile) */}
              <button
                onClick={toggleNav}
                className="lg:hidden p-2 rounded-lg hover:bg-[var(--container-medium)] transition-colors"
                aria-label="Toggle navigation"
              >
                <svg className="w-6 h-6 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Page Title */}
              {title && (
                <h1 className="text-[20px] font-medium text-[var(--text-primary)]">
                  {title}
                </h1>
              )}
            </div>

            {/* Right side content */}
            <div className="flex items-center gap-4">
              {headerRight}
              <ThemeToggle fixed={false} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
