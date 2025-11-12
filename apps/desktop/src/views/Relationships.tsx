import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getContacts,
  getNurtureCycles,
  createContact,
  createNurtureCycle,
} from '../api/client'
import { useState } from 'react'

export default function Relationships() {
  const queryClient = useQueryClient()
  const [showAddContact, setShowAddContact] = useState(false)

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
  })

  const { data: nurtureCycles = [] } = useQuery({
    queryKey: ['nurtureCycles'],
    queryFn: getNurtureCycles,
  })

  const addContactMutation = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setShowAddContact(false)
    },
  })

  const addNurtureCycleMutation = useMutation({
    mutationFn: createNurtureCycle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurtureCycles'] })
    },
  })

  // Build a map of contact_id -> nurture cycle
  const nurtureCycleMap = new Map()
  nurtureCycles.forEach((cycle: any) => {
    nurtureCycleMap.set(cycle.contact_id, cycle)
  })

  // Calculate days since last contact
  const getContactStatus = (cycle: any) => {
    if (!cycle || !cycle.last_contact_dt) return { status: 'unknown', days: null }

    const lastContact = new Date(cycle.last_contact_dt)
    const now = new Date()
    const daysSince = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSince > cycle.cadence_days) {
      return { status: 'overdue', days: daysSince }
    } else if (daysSince > cycle.cadence_days * 0.8) {
      return { status: 'due_soon', days: daysSince }
    } else {
      return { status: 'good', days: daysSince }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-700'
      case 'due_soon':
        return 'bg-yellow-100 text-yellow-700'
      case 'good':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getTieStrengthEmoji = (strength: string) => {
    switch (strength) {
      case 'strong':
        return '💪'
      case 'medium':
        return '👋'
      case 'light':
        return '🤝'
      default:
        return '👤'
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relationships</h1>
          <p className="text-gray-600 mt-1">Nurture your connections with those who matter</p>
        </div>
        <button
          onClick={() => setShowAddContact(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Contact
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Contacts"
          value={contacts.length}
          icon="👥"
          color="bg-blue-50"
        />
        <StatCard
          title="Active Cycles"
          value={nurtureCycles.length}
          icon="🔄"
          color="bg-purple-50"
        />
        <StatCard
          title="Due Soon"
          value={
            nurtureCycles.filter((c: any) => getContactStatus(c).status === 'due_soon').length
          }
          icon="⏰"
          color="bg-yellow-50"
        />
        <StatCard
          title="Overdue"
          value={
            nurtureCycles.filter((c: any) => getContactStatus(c).status === 'overdue').length
          }
          icon="🚨"
          color="bg-red-50"
        />
      </div>

      {/* Contacts with Nurture Cycles */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">My Contacts</h2>
        </div>
        <div className="divide-y">
          {contacts.map((contact: any) => {
            const cycle = nurtureCycleMap.get(contact.id)
            const status = getContactStatus(cycle)

            return (
              <div key={contact.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {getTieStrengthEmoji(cycle?.tie_strength || 'medium')}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold">{contact.name}</h3>
                        {contact.relationship && (
                          <p className="text-sm text-gray-500">{contact.relationship}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4 text-sm text-gray-600 ml-11">
                      {contact.email && <span>📧 {contact.email}</span>}
                      {contact.phone && <span>📱 {contact.phone}</span>}
                    </div>

                    {contact.birthday && (
                      <div className="text-sm text-gray-500 ml-11 mt-1">
                        🎂 Birthday: {new Date(contact.birthday).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {cycle ? (
                      <>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            status.status
                          )}`}
                        >
                          {status.status === 'overdue' && `Overdue by ${status.days - cycle.cadence_days} days`}
                          {status.status === 'due_soon' && `Check in soon`}
                          {status.status === 'good' && `All good`}
                          {status.status === 'unknown' && `No contact yet`}
                        </span>
                        <div className="text-xs text-gray-500">
                          Every {cycle.cadence_days} days
                        </div>
                        {cycle.last_contact_dt && (
                          <div className="text-xs text-gray-400">
                            Last: {new Date(cycle.last_contact_dt).toLocaleDateString()}
                          </div>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          addNurtureCycleMutation.mutate({
                            contact_id: contact.id,
                            tie_strength: 'medium',
                            cadence_days: 14,
                          })
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Add Nurture Cycle
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {contacts.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <div className="text-4xl mb-4">👥</div>
              <p>No contacts yet. Add your first contact to start building your network!</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Contact</h3>
            <form
              onSubmit={e => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const birthday = formData.get('birthday') as string
                addContactMutation.mutate({
                  name: formData.get('name'),
                  email: formData.get('email') || null,
                  phone: formData.get('phone') || null,
                  relationship: formData.get('relationship') || null,
                  birthday: birthday ? new Date(birthday).toISOString() : null,
                })
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Relationship</label>
                  <input
                    name="relationship"
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="Friend, Colleague, Family..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="555-0123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Birthday</label>
                  <input
                    name="birthday"
                    type="date"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className={`${color} rounded-lg p-6`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-600 font-medium">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  )
}
