import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Input from '../ui/Input'
import Button from '../ui/Button'
import ThemeToggle from '../ui/ThemeToggle'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema)
  })

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setError(null)

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (resetError) throw resetError

      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <ThemeToggle />
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-[var(--font-title)] font-medium text-[var(--text-primary)] mb-2">
            Reset your password
          </h1>
          <p className="text-[var(--font-body-m)] text-[var(--text-secondary)]">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-[var(--container-subtle)] rounded-2xl p-8 border border-[var(--container-medium)]">
          {success ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-[var(--font-heading-m)] font-medium text-[var(--text-primary)] mb-2">
                Check your email
              </h2>
              <p className="text-[var(--font-body-m)] text-[var(--text-secondary)] mb-6">
                We've sent you a password reset link. Please check your inbox and follow the instructions.
              </p>
              <Link to="/signin">
                <Button variant="primary">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              {/* Email Input */}
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                error={errors.email?.message}
                {...register('email')}
              />

              {/* Submit Button */}
              <Button type="submit" loading={loading} variant="primary">
                Send Reset Link
              </Button>

              {/* Back to Sign In */}
              <div className="text-center">
                <Link
                  to="/signin"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  ← Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
