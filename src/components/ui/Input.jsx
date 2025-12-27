import React from 'react'

const Input = React.forwardRef(({
  label,
  error,
  type = 'text',
  placeholder,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-normal mb-2 text-inherit">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        className={`
          w-full px-4 py-3 rounded-lg
          bg-[var(--container-subtle)]
          text-[var(--text-primary)]
          border border-[var(--container-medium)]
          placeholder:text-[var(--text-secondary)]
          focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]
          transition-all duration-200
          font-['EB_Garamond'] text-sm
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500 font-['EB_Garamond']">
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
