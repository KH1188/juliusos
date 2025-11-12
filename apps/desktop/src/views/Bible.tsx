import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBiblePlans, getBibleReadings, runRecipe } from '../api/client'
import { useState } from 'react'

export default function Bible() {
  const queryClient = useQueryClient()
  const [passage, setPassage] = useState('')
  const [reflection, setReflection] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const { data: plans = [] } = useQuery({
    queryKey: ['bible-plans'],
    queryFn: () => getBiblePlans(),
  })

  const { data: readings = [] } = useQuery({
    queryKey: ['bible-readings'],
    queryFn: () => getBibleReadings(),
  })

  const handleReflect = async () => {
    if (!passage.trim()) {
      alert('Please enter a passage reference')
      return
    }

    setLoading(true)
    try {
      const result = await runRecipe('bible_reflector', { passage })
      setReflection(result)
    } catch (error) {
      console.error('Failed to generate reflection:', error)
      alert('Failed to generate reflection. Make sure services are running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Bible Study</h1>

      {/* Bible Reflector */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Reflection Generator</h2>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={passage}
            onChange={(e) => setPassage(e.target.value)}
            placeholder="Enter passage (e.g., John 3:1-21)"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleReflect}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Reflection'}
          </button>
        </div>

        {reflection && (
          <div className="mt-6 space-y-4">
            {reflection.summary && (
              <div className="p-4 bg-blue-50 rounded">
                <h3 className="font-semibold mb-2">Summary</h3>
                <p>{reflection.summary}</p>
              </div>
            )}

            {reflection.three_questions && reflection.three_questions.length > 0 && (
              <div className="p-4 bg-green-50 rounded">
                <h3 className="font-semibold mb-2">Reflection Questions</h3>
                <ol className="list-decimal list-inside space-y-2">
                  {reflection.three_questions.map((q: string, i: number) => (
                    <li key={i}>{q}</li>
                  ))}
                </ol>
              </div>
            )}

            {reflection.prayer_points && reflection.prayer_points.length > 0 && (
              <div className="p-4 bg-yellow-50 rounded">
                <h3 className="font-semibold mb-2">Prayer Points</h3>
                <ul className="list-disc list-inside space-y-1">
                  {reflection.prayer_points.map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reading Plans */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Reading Plans</h2>
          <div className="space-y-3">
            {plans.map((plan: any) => (
              <div key={plan.id} className="p-3 border rounded">
                <div className="font-medium">{plan.name}</div>
              </div>
            ))}
            {plans.length === 0 && (
              <div className="text-center text-gray-500 py-8">No reading plans</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Readings</h2>
          <div className="space-y-3">
            {readings.slice(0, 10).map((reading: any) => (
              <div key={reading.id} className="p-3 border rounded">
                <div className="font-medium">
                  {reading.book} {reading.chapter}
                  {reading.verse_start && `:${reading.verse_start}`}
                  {reading.verse_end && `-${reading.verse_end}`}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(reading.dt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {readings.length === 0 && (
              <div className="text-center text-gray-500 py-8">No readings logged</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
