import { useState } from 'react'
import { useGemini } from '../hooks/useGemini'
import DashboardLayout from '../components/layout/DashboardLayout'
import Button from '../components/ui/Button'

const GeminiTest = () => {
  const { callGemini, parseWithGemini, loading, error } = useGemini()
  const [response, setResponse] = useState('')
  const [testType, setTestType] = useState(null)

  const handleSimpleTest = async () => {
    setTestType('simple')
    setResponse('')

    const result = await callGemini({
      prompt: 'Say "Hello from Gemini!" in exactly 3 words.',
      temperature: 0.7,
    })

    if (result.success) {
      setResponse(result.text)
    }
  }

  const handleParseTest = async () => {
    setTestType('parse')
    setResponse('')

    const result = await parseWithGemini(
      'Work on landing page, debug authentication flow, write blog post about AI',
      `Parse this into a JSON array of tasks. Each task should have:
- name (2-4 words)
- description (brief description)
- estimated_hours (number)

Return ONLY valid JSON, no other text.`
    )

    if (result.success) {
      setResponse(result.text)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-medium text-[var(--text-primary)] mb-6">
          Gemini API Test
        </h1>

        {/* Test Buttons */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={handleSimpleTest}
            disabled={loading}
            variant="primary"
          >
            {loading && testType === 'simple' ? 'Testing...' : 'Test Simple Call'}
          </Button>

          <Button
            onClick={handleParseTest}
            disabled={loading}
            variant="secondary"
          >
            {loading && testType === 'parse' ? 'Testing...' : 'Test Parse Function'}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-500">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Response Display */}
        {response && (
          <div className="p-6 bg-[var(--container-subtle)] border border-[var(--container-medium)] rounded-lg">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
              Response:
            </h3>
            <pre className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-mono">
              {response}
            </pre>
          </div>
        )}

        {/* Instructions */}
        {!response && !error && (
          <div className="p-6 bg-[var(--container-subtle)] border border-[var(--container-medium)] rounded-lg">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
              Instructions:
            </h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-2">
              <li>• <strong>Test Simple Call:</strong> Tests basic Gemini API connection</li>
              <li>• <strong>Test Parse Function:</strong> Tests parsing unstructured text into structured data (like for tasks)</li>
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default GeminiTest
