import { useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Button from '../components/ui/Button'
import { supabase } from '../lib/supabase'

const TestGemini = () => {
  const [simpleLoading, setSimpleLoading] = useState(false)
  const [parseLoading, setParseLoading] = useState(false)
  const [simpleResult, setSimpleResult] = useState(null)
  const [parseResult, setParseResult] = useState(null)
  const [simpleError, setSimpleError] = useState(null)
  const [parseError, setParseError] = useState(null)

  const testSimpleCall = async () => {
    setSimpleLoading(true)
    setSimpleError(null)
    setSimpleResult(null)

    try {
      const { data, error } = await supabase.functions.invoke('test-gemini', {
        body: { prompt: 'Say hello and confirm you are working properly!' }
      })

      if (error) throw error

      setSimpleResult(data)
    } catch (err) {
      setSimpleError(err.message || 'An error occurred')
    } finally {
      setSimpleLoading(false)
    }
  }

  const testParseFunction = async () => {
    setParseLoading(true)
    setParseError(null)
    setParseResult(null)

    try {
      // TODO: Replace with actual parse function when created
      const { data, error } = await supabase.functions.invoke('parse-tasks', {
        body: {
          input: 'Work on landing page design for 2 hours, fix bugs in authentication for 1 hour'
        }
      })

      if (error) throw error

      setParseResult(data)
    } catch (err) {
      setParseError(err.message || 'Parse function not yet created')
    } finally {
      setParseLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-[60%] mx-auto py-12">
        <h1 className="text-2xl font-medium text-[var(--text-primary)] mb-8">
          Test Gemini AI Functions
        </h1>

        {/* Test Simple Call Section */}
        <div className="mb-12 p-6 rounded-lg bg-[var(--container-subtle)]">
          <h2 className="text-xl font-medium text-[var(--text-primary)] mb-4">
            Simple Call Test
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Tests basic Gemini API connection with a simple prompt
          </p>

          <div className="max-w-xs mb-6">
            <Button
              onClick={testSimpleCall}
              loading={simpleLoading}
              variant="primary"
            >
              Test Simple Call
            </Button>
          </div>

          {/* Success Message */}
          {simpleResult && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-green-500 mb-2">
                    Success!
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mb-2">
                    <strong>Prompt:</strong> {simpleResult.prompt}
                  </p>
                  <p className="text-xs text-[var(--text-primary)] font-medium">
                    <strong>Response:</strong> {simpleResult.response}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {simpleError && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-500 mb-1">
                    Error
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {simpleError}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Parse Function Section */}
        <div className="p-6 rounded-lg bg-[var(--container-subtle)]">
          <h2 className="text-xl font-medium text-[var(--text-primary)] mb-4">
            Parse Function Test
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Tests task parsing from unstructured text (Not yet implemented)
          </p>

          <div className="max-w-xs mb-6">
            <Button
              onClick={testParseFunction}
              loading={parseLoading}
              variant="secondary"
            >
              Test Parse Function
            </Button>
          </div>

          {/* Success Message */}
          {parseResult && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-green-500 mb-2">
                    Success!
                  </h3>
                  <pre className="text-xs text-[var(--text-primary)] bg-[var(--container-medium)] p-3 rounded overflow-auto">
                    {JSON.stringify(parseResult, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {parseError && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-500 mb-1">
                    Error
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {parseError}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default TestGemini
