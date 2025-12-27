import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const Navbar = ({ isOpen, toggleNav }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([]) // TODO: Fetch from Supabase
  const [archivedProjects, setArchivedProjects] = useState([]) // TODO: Fetch from Supabase

  // Get user info
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/signin')
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleNav}
        />
      )}

      {/* Navbar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen
          bg-[var(--container-subtle)] border-r border-[var(--container-medium)]
          transition-all duration-300 z-50
          flex flex-col
          ${isOpen ? 'w-[85%] md:w-[24%]' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-16'}
        `}
      >
        {/* Logo & Toggle */}
        <div className={`border-b border-[var(--container-medium)] h-16 ${isOpen ? 'px-6' : ''} ${isOpen ? 'flex items-center justify-between' : 'flex items-center justify-center'}`}>
          {isOpen ? (
            <>
              <img
                src="/logo.png"
                alt="Sensei"
                className="h-8 w-auto"
              />
              {/* Close/Collapse Button */}
              <button
                onClick={toggleNav}
                className="p-2 -mr-2 rounded-lg hover:bg-[var(--container-medium)] transition-colors"
                aria-label="Collapse navigation"
              >
                <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            /* Hamburger Menu Button when collapsed - centered */
            <button
              onClick={toggleNav}
              className="p-2 rounded-lg hover:bg-[var(--container-medium)] transition-colors hidden lg:block"
              aria-label="Expand navigation"
            >
              <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Content - Top Section */}
        <nav className="flex-1 overflow-y-auto py-6">
          {isOpen && (
            <>
              {/* Home Section */}
              <div className="px-4 mb-6">
                <Link
                  to="/dashboard"
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-200
                    ${isActive('/dashboard')
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'text-[var(--text-primary)] hover:bg-[var(--container-medium)]'
                    }
                  `}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>
              </div>

              {/* Divider */}
              <div className="border-t border-[var(--container-medium)] my-4" />

              {/* All Projects Section */}
              <div className="px-4 mb-6">
                <h3 className="text-xs font-medium text-[var(--text-secondary)] uppercase mb-3 px-4">
                  All Projects
                </h3>
                {projects.length === 0 ? (
                  <button
                    onClick={() => navigate('/create-project')}
                    className="
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg
                      text-[var(--accent-primary)] hover:bg-[var(--container-medium)]
                      transition-colors duration-200
                    "
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm font-medium">Add Project</span>
                  </button>
                ) : (
                  <div className="space-y-1">
                    {projects.map((project) => (
                      <Link
                        key={project.id}
                        to={`/project/${project.id}`}
                        className="
                          flex items-center gap-3 px-4 py-3 rounded-lg
                          text-[var(--text-primary)] hover:bg-[var(--container-medium)]
                          transition-colors duration-200
                        "
                      >
                        <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
                        <span className="text-sm">{project.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-[var(--container-medium)] my-4" />

              {/* Archived Projects Section */}
              {archivedProjects.length > 0 && (
                <>
                  <div className="px-4 mb-6">
                    <h3 className="text-xs font-medium text-[var(--text-secondary)] uppercase mb-3 px-4">
                      Archived Projects
                    </h3>
                    <div className="space-y-1">
                      {archivedProjects.map((project) => (
                        <Link
                          key={project.id}
                          to={`/project/${project.id}`}
                          className="
                            flex items-center gap-3 px-4 py-3 rounded-lg
                            text-[var(--text-secondary)] hover:bg-[var(--container-medium)]
                            transition-colors duration-200
                          "
                        >
                          <div className="w-2 h-2 rounded-full bg-[var(--text-secondary)]" />
                          <span className="text-sm">{project.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-[var(--container-medium)] my-4" />
                </>
              )}
            </>
          )}
        </nav>

        {/* Bottom Section */}
        {isOpen && (
          <div className="border-t border-[var(--container-medium)]">
            {/* Profile */}
            <Link
              to="/profile"
              className="
                flex items-center gap-3 px-8 py-4
                text-[var(--text-primary)] hover:bg-[var(--container-medium)]
                transition-colors duration-200
              "
            >
              <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-sm font-medium">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium truncate">
                {user?.email?.split('@')[0] || 'User'}
              </span>
            </Link>

            {/* Divider */}
            <div className="border-t border-[var(--container-medium)]" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="
                w-full flex items-center gap-3 px-8 py-4
                text-[var(--text-primary)] hover:bg-[var(--container-medium)]
                transition-colors duration-200
              "
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium">Log Out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

export default Navbar
