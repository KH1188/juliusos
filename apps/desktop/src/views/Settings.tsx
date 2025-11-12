import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSettings } from '../api/client'
import { useState, useEffect } from 'react'

export default function Settings() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    ollama_model: 'llama3:8b',
    ollama_url: 'http://localhost:11434',
    theme: 'system',
    first_day_of_week: 0,
  })

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings(),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      alert('Settings saved successfully!')
    },
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        ollama_model: settings.ollama_model || 'llama3:8b',
        ollama_url: settings.ollama_url || 'http://localhost:11434',
        theme: settings.theme || 'system',
        first_day_of_week: settings.first_day_of_week || 0,
      })
    }
  }, [settings])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Ollama Configuration</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ollama URL
              </label>
              <input
                type="text"
                value={formData.ollama_url}
                onChange={(e) =>
                  setFormData({ ...formData, ollama_url: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Model
              </label>
              <select
                value={formData.ollama_model}
                onChange={(e) =>
                  setFormData({ ...formData, ollama_model: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="llama3:8b">llama3:8b</option>
                <option value="mistral">mistral</option>
                <option value="llama2">llama2</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Appearance</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={formData.theme}
                onChange={(e) =>
                  setFormData({ ...formData, theme: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Day of Week
              </label>
              <select
                value={formData.first_day_of_week}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    first_day_of_week: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
