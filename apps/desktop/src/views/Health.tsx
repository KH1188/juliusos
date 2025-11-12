import { useQuery } from '@tanstack/react-query'
import { getMeals, getSleepLogs, runRecipe } from '../api/client'
import { useState } from 'react'

export default function Health() {
  const [macroCoachResult, setMacroCoachResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const { data: meals = [] } = useQuery({
    queryKey: ['meals'],
    queryFn: () => getMeals(),
  })

  const { data: sleepLogs = [] } = useQuery({
    queryKey: ['sleep'],
    queryFn: () => getSleepLogs(),
  })

  const handleMacroCoach = async () => {
    setLoading(true)
    try {
      const result = await runRecipe('macro_coach', {
        targets: { protein_g: 150, calories: 2500 }
      })
      setMacroCoachResult(result)
    } catch (error) {
      console.error('Failed to run macro coach:', error)
      alert('Failed to run macro coach. Make sure services are running.')
    } finally {
      setLoading(false)
    }
  }

  // Calculate today's macros
  const today = new Date().toISOString().split('T')[0]
  const todayMeals = meals.filter((m: any) =>
    m.dt && m.dt.startsWith(today)
  )

  const macros = todayMeals.reduce(
    (acc: any, meal: any) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein_g || 0),
      carbs: acc.carbs + (meal.carbs_g || 0),
      fat: acc.fat + (meal.fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Health</h1>
        <button
          onClick={handleMacroCoach}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Get Macro Coaching'}
        </button>
      </div>

      {/* Macro Coach Results */}
      {macroCoachResult && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Macro Coach Suggestions</h2>
          {macroCoachResult.protein_gap_g > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 rounded">
              <strong>Protein Gap:</strong> {macroCoachResult.protein_gap_g}g
            </div>
          )}
          {macroCoachResult.suggestions && macroCoachResult.suggestions.length > 0 && (
            <div className="space-y-3">
              {macroCoachResult.suggestions.map((suggestion: any, i: number) => (
                <div key={i} className="p-4 border rounded">
                  <div className="font-medium text-lg">{suggestion.meal_name}</div>
                  <div className="text-sm text-gray-600 mb-2">{suggestion.recipe_hint}</div>
                  <div className="text-sm">
                    <strong>Protein:</strong> {suggestion.macro_estimate.protein_g}g,
                    <strong> Calories:</strong> {suggestion.macro_estimate.calories}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Today's Macros */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <MacroCard title="Calories" value={macros.calories} unit="kcal" color="blue" />
        <MacroCard title="Protein" value={macros.protein} unit="g" color="green" />
        <MacroCard title="Carbs" value={macros.carbs} unit="g" color="yellow" />
        <MacroCard title="Fat" value={macros.fat} unit="g" color="purple" />
      </div>

      {/* Meals List */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Recent Meals</h2>
        <div className="space-y-3">
          {meals.slice(0, 10).map((meal: any) => (
            <div key={meal.id} className="flex justify-between items-center p-3 border rounded">
              <div>
                <div className="font-medium">{meal.name}</div>
                <div className="text-sm text-gray-600">
                  {new Date(meal.dt).toLocaleString()}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {meal.calories}kcal | {meal.protein_g}g protein
              </div>
            </div>
          ))}
          {meals.length === 0 && (
            <div className="text-center text-gray-500 py-8">No meals logged</div>
          )}
        </div>
      </div>

      {/* Sleep */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Sleep Log</h2>
        <div className="space-y-3">
          {sleepLogs.slice(0, 7).map((log: any) => (
            <div key={log.id} className="flex justify-between items-center p-3 border rounded">
              <div className="font-medium">
                {new Date(log.date).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600">
                {(log.duration_min / 60).toFixed(1)}h | Quality: {log.quality}/5
              </div>
            </div>
          ))}
          {sleepLogs.length === 0 && (
            <div className="text-center text-gray-500 py-8">No sleep logs</div>
          )}
        </div>
      </div>
    </div>
  )
}

function MacroCard({ title, value, unit, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-800',
    green: 'bg-green-50 text-green-800',
    yellow: 'bg-yellow-50 text-yellow-800',
    purple: 'bg-purple-50 text-purple-800',
  }

  return (
    <div className={`${colors[color]} rounded-lg p-6`}>
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm mt-1">{unit}</div>
    </div>
  )
}
