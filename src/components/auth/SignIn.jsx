import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Input from '../ui/Input'
import Button from '../ui/Button'
import OnboardingModal from '../ui/OnboardingModal'
import ThemeToggle from '../ui/ThemeToggle'

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

const SignIn = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(signInSchema)
  })

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setError(null)

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (authError) throw authError

      // Check if user has completed onboarding
      const onboardingCompleted = authData.user?.user_metadata?.onboarding_completed

      if (onboardingCompleted === false || onboardingCompleted === undefined) {
        // Show onboarding if not completed
        setShowOnboarding(true)
      } else {
        // Go directly to dashboard if onboarding is completed
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleOnboardingComplete = async () => {
    try {
      // Mark onboarding as completed in user metadata
      const { error } = await supabase.auth.updateUser({
        data: { onboarding_completed: true }
      })

      if (error) throw error

      setShowOnboarding(false)
      navigate('/dashboard')
    } catch (err) {
      console.error('Error updating onboarding status:', err)
      // Still navigate even if update fails
      setShowOnboarding(false)
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <ThemeToggle />
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-[var(--font-title)] font-medium text-[var(--text-primary)] mb-2">
            Welcome back
          </h1>
          <p className="text-[var(--font-body-m)] text-[var(--text-secondary)]">
            Sign in to continue to Sensei
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-[var(--container-subtle)] rounded-2xl p-8 border border-[var(--container-medium)]">
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

            {/* Password Input */}
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Submit Button */}
            <Button type="submit" loading={loading} variant="primary">
              Sign In
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-[var(--accent-primary)] hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-[var(--accent-primary)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </div>
  )
}

export default SignIn
