import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSkinProducts,
  getSkinRoutines,
  getSkinLogs,
  createSkinProduct,
  createSkinLog,
  runRecipe,
} from '../api/client'
import { useState } from 'react'

export default function Skin() {
  const queryClient = useQueryClient()
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showLogEntry, setShowLogEntry] = useState(false)
  const [coachAdvice, setCoachAdvice] = useState<any>(null)
  const [loadingCoach, setLoadingCoach] = useState(false)

  const { data: products = [] } = useQuery({
    queryKey: ['skinProducts'],
    queryFn: getSkinProducts,
  })

  const { data: routines = [] } = useQuery({
    queryKey: ['skinRoutines'],
    queryFn: getSkinRoutines,
  })

  const { data: logs = [] } = useQuery({
    queryKey: ['skinLogs'],
    queryFn: () => getSkinLogs(),
  })

  const addProductMutation = useMutation({
    mutationFn: createSkinProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skinProducts'] })
      setShowAddProduct(false)
    },
  })

  const addLogMutation = useMutation({
    mutationFn: createSkinLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skinLogs'] })
      setShowLogEntry(false)
    },
  })

  const handleGetSkinCoach = async () => {
    setLoadingCoach(true)
    try {
      const result = await runRecipe('skin_coach', {})
      setCoachAdvice(result)
    } catch (error) {
      console.error('Failed to get skin coach advice:', error)
      alert('Failed to get skin coach advice. Make sure Ollama is running.')
    } finally {
      setLoadingCoach(false)
    }
  }

  const activeProducts = products.filter((p: any) => p.is_active)
  const recentLogs = logs.slice(0, 7)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Skin & Hygiene</h1>
          <p className="text-gray-600 mt-1">Track your skincare routine and skin health</p>
        </div>
        <button
          onClick={handleGetSkinCoach}
          disabled={loadingCoach}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loadingCoach ? 'Analyzing...' : '🧴 Get Skin Coach Advice'}
        </button>
      </div>

      {/* Skin Coach Advice */}
      {coachAdvice && (
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90 mb-2">
                Skin Coach Recommendation
              </h3>
              <p className="text-lg mb-2">{coachAdvice.suggestion || coachAdvice.message}</p>
              {coachAdvice.concern && (
                <p className="text-purple-100 text-sm">{coachAdvice.concern}</p>
              )}
            </div>
            <button
              onClick={() => setCoachAdvice(null)}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded p-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Active Products</h2>
            <button
              onClick={() => setShowAddProduct(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              + Add Product
            </button>
          </div>

          <div className="space-y-3">
            {activeProducts.map((product: any) => (
              <div key={product.id} className="border rounded p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{product.step}</div>
                    {product.notes && (
                      <div className="text-sm text-gray-600 mt-1">{product.notes}</div>
                    )}
                  </div>
                  {product.pao_months && product.opened_at && (
                    <div className="text-xs text-gray-500 bg-yellow-50 px-2 py-1 rounded">
                      Expires:{' '}
                      {new Date(
                        new Date(product.opened_at).setMonth(
                          new Date(product.opened_at).getMonth() + product.pao_months
                        )
                      ).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {activeProducts.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No active products. Add your first product!
              </div>
            )}
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Logs</h2>
            <button
              onClick={() => setShowLogEntry(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              + Log Entry
            </button>
          </div>

          <div className="space-y-3">
            {recentLogs.map((log: any) => (
              <div key={log.id} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-500">
                    {new Date(log.log_date).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    {log.irritation_level > 0 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        Irritation: {log.irritation_level}
                      </span>
                    )}
                    {log.dryness_level > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Dryness: {log.dryness_level}
                      </span>
                    )}
                    {log.oiliness_level > 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                        Oil: {log.oiliness_level}
                      </span>
                    )}
                  </div>
                </div>
                {log.notes && <div className="text-sm text-gray-700">{log.notes}</div>}
              </div>
            ))}
            {recentLogs.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No logs yet. Start tracking your skin health!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Routines */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">My Routines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {routines.map((routine: any) => (
            <div key={routine.id} className="border rounded p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="font-medium capitalize">{routine.time_of_day}</div>
                <div className="text-sm text-gray-500">
                  {routine.product_ids?.length || 0} products
                </div>
              </div>
              {routine.notes && <div className="text-sm text-gray-600">{routine.notes}</div>}
            </div>
          ))}
          {routines.length === 0 && (
            <div className="col-span-2 text-center text-gray-500 py-8">
              No routines set up yet.
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Product</h3>
            <form
              onSubmit={e => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                addProductMutation.mutate({
                  name: formData.get('name'),
                  step: formData.get('step'),
                  notes: formData.get('notes'),
                  is_active: true,
                })
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Product Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded"
                    placeholder="CeraVe Moisturizer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Step</label>
                  <select name="step" required className="w-full px-3 py-2 border rounded">
                    <option value="cleanser">Cleanser</option>
                    <option value="treat">Treatment</option>
                    <option value="moisturizer">Moisturizer</option>
                    <option value="spf">SPF</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    name="notes"
                    className="w-full px-3 py-2 border rounded"
                    rows={2}
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Log Modal */}
      {showLogEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Log Skin Entry</h3>
            <form
              onSubmit={e => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                addLogMutation.mutate({
                  log_date: new Date().toISOString().split('T')[0],
                  irritation_level: parseInt(formData.get('irritation') as string) || 0,
                  dryness_level: parseInt(formData.get('dryness') as string) || 0,
                  oiliness_level: parseInt(formData.get('oiliness') as string) || 0,
                  notes: formData.get('notes'),
                })
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Irritation (0-10)
                  </label>
                  <input
                    name="irritation"
                    type="number"
                    min="0"
                    max="10"
                    defaultValue="0"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dryness (0-10)</label>
                  <input
                    name="dryness"
                    type="number"
                    min="0"
                    max="10"
                    defaultValue="0"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Oiliness (0-10)</label>
                  <input
                    name="oiliness"
                    type="number"
                    min="0"
                    max="10"
                    defaultValue="0"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    name="notes"
                    className="w-full px-3 py-2 border rounded"
                    rows={2}
                    placeholder="How's your skin feeling today?"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowLogEntry(false)}
                  className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
