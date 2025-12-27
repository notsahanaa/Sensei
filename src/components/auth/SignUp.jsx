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

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

const SignUp = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(signUpSchema)
  })

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setError(null)

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            onboarding_completed: false
          }
        }
      })

      if (authError) throw authError

      // Show onboarding for new users
      setShowOnboarding(true)
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.')
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
            Get started with Sensei
          </h1>
          <p className="text-[var(--font-body-m)] text-[var(--text-secondary)]">
            Create your account to start building consistently
          </p>
        </div>

        {/* Sign Up Form */}
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
                placeholder="Create a password"
                error={errors.password?.message}
                {...register('password')}
              />

              {/* Confirm Password Input */}
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

            {/* Submit Button */}
            <Button type="submit" loading={loading} variant="primary">
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Already have an account?{' '}
              <Link
                to="/signin"
                className="text-[var(--accent-primary)] hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
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

export default SignUp
