import React from 'react'

const Button = ({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  const baseStyles = `
    w-full px-6 py-3 rounded-lg
    font-['EB_Garamond'] text-base font-medium
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `

  const variants = {
    primary: `
      bg-[var(--accent-primary)] text-white
      hover:opacity-90
      focus:ring-[var(--accent-primary)]
    `,
    secondary: `
      bg-[var(--container-medium)]
      text-[var(--text-primary)]
      hover:bg-[var(--container-intense)]
      focus:ring-[var(--accent-secondary)]
    `,
    ghost: `
      bg-transparent
      text-[var(--accent-primary)]
      hover:bg-[var(--container-subtle)]
      focus:ring-[var(--accent-primary)]
    `
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  )
}

export default Button
