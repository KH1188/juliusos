import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, getEvents, getMeals, getDailyDigest, getNextBestStep, updateTaskStatus, createTask } from '../api/client'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [digestData, setDigestData] = useState<any>(null)
  const [loadingDigest, setLoadingDigest] = useState(false)
  const [nextBestStep, setNextBestStep] = useState<any>(null)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', 'todo'],
    queryFn: () => getTasks('todo'),
  })

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => getEvents(),
  })

  const { data: meals = [] } = useQuery({
    queryKey: ['meals'],
    queryFn: () => getMeals(),
  })

  const handleRunDigest = async () => {
    setLoadingDigest(true)
    try {
      const digest = await getDailyDigest()
      setDigestData(digest)
    } catch (error) {
      console.error('Failed to run daily digest:', error)
      alert('Failed to run daily digest. Make sure Ollama is running.')
    } finally {
      setLoadingDigest(false)
    }
  }

  const handleGetNextBestStep = async () => {
    try {
      const result = await getNextBestStep()
      setNextBestStep(result)
    } catch (error: any) {
      console.error('Failed to get next best step:', error)
      const errorMsg = error?.message || 'Unknown error'
      alert(`Error: ${errorMsg}\n\nOllama Status: Connected\nAPI: Reachable\n\nTry refreshing the page or check the browser console for details.`)
    }
  }

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: number) => updateTaskStatus(taskId, 'done'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const createTaskFromStep = async () => {
    if (!nextBestStep) return
    try {
      await createTask({
        title: nextBestStep.action,
        status: 'todo',
        priority: 5,
      })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      alert('Task created!')
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0a0e1a] p-8">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
          <div className="h-px w-16 bg-cyan-400/50"></div>
        </div>
        <h1 className="text-4xl font-bold text-cyan-400 mb-1 tracking-tight">
          {greeting.toUpperCase()}, OPERATOR
        </h1>
        <p className="text-cyan-400/40 text-xs font-mono">
          SYSTEM ONLINE
        </p>
      </div>

      {/* Next Best Step - Hero Card */}
      {!nextBestStep ? (
        <div
          onClick={handleGetNextBestStep}
          className="mb-8 p-6 bg-cyan-500/5 border border-cyan-400/20 rounded cursor-pointer hover:border-cyan-400/40 transition-colors"
        >
          <div className="text-cyan-400/60 text-xs font-mono mb-2">AI RECOMMENDATION</div>
          <h2 className="text-2xl font-bold text-cyan-400 mb-1">
            WHAT SHOULD I DO NEXT?
          </h2>
          <p className="text-cyan-400/40 text-sm font-mono">Click to analyze</p>
        </div>
      ) : (
        <div className="mb-8 p-6 bg-purple-500/5 border border-purple-400/30 rounded">
          <div className="text-purple-400/60 text-xs font-mono mb-2">RECOMMENDED ACTION</div>
          <h2 className="text-xl font-bold text-purple-300 mb-3">
            {nextBestStep.action.toUpperCase()}
          </h2>
          <p className="text-purple-200/60 mb-4 text-sm border-l-2 border-purple-400/30 pl-3">
            {nextBestStep.why}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-purple-500/10 border border-purple-400/20 rounded text-xs font-mono text-purple-300">
              {nextBestStep.duration_min} MIN
            </span>
            <button
              onClick={createTaskFromStep}
              className="px-4 py-1.5 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-sm font-mono rounded hover:bg-cyan-500/30 transition-colors"
            >
              ADD TO TASKS
            </button>
            <button
              onClick={() => setNextBestStep(null)}
              className="ml-auto text-purple-400/60 hover:text-purple-300 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="relative grid grid-cols-4 gap-4 mb-8">
        <QuickAction
          icon="◉"
          label="AI ASSISTANT"
          onClick={() => navigate('/assistant')}
        />
        <QuickAction
          icon="◈"
          label="DAILY DIGEST"
          onClick={handleRunDigest}
          loading={loadingDigest}
        />
        <QuickAction
          icon="◇"
          label="LOG SKIN"
          onClick={() => navigate('/skin')}
        />
        <QuickAction
          icon="◐"
          label="CONTACTS"
          onClick={() => navigate('/relationships')}
        />
      </div>

      {/* Daily Digest Results */}
      {digestData && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Today's Plan</h2>

          {digestData.plan && digestData.plan.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Priorities</h3>
              <div className="space-y-3">
                {digestData.plan.map((item: any, i: number) => (
                  <div key={i} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-gray-600">{item.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {digestData.health && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Health Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-green-50 rounded">
                  <div className="text-sm text-gray-600">Macros</div>
                  <div className="font-medium">{digestData.health.macro_delta || 'On track'}</div>
                </div>
                <div className="p-3 bg-purple-50 rounded">
                  <div className="text-sm text-gray-600">Workout</div>
                  <div className="font-medium">{digestData.health.workout_suggestion || 'Rest day'}</div>
                </div>
                <div className="p-3 bg-blue-50 rounded">
                  <div className="text-sm text-gray-600">Sleep</div>
                  <div className="font-medium">{digestData.health.sleep_note || 'Good'}</div>
                </div>
              </div>
            </div>
          )}

          {digestData.bible && digestData.bible.next_passage && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Bible Reading</h3>
              <div className="p-3 bg-yellow-50 rounded">
                <div className="font-medium">{digestData.bible.next_passage}</div>
                <div className="text-sm text-gray-600">{digestData.bible.rationale}</div>
              </div>
            </div>
          )}

          {digestData.journal_prompt && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Journaling Prompt</h3>
              <div className="p-3 bg-pink-50 rounded italic">
                {digestData.journal_prompt}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Tasks"
          value={tasks.length}
          subtitle="pending"
          icon="▣"
          trend="+2 this week"
          color="blue"
        />
        <StatCard
          title="Events Today"
          value={events.length}
          subtitle="scheduled"
          icon="◈"
          color="purple"
        />
        <StatCard
          title="Meals Logged"
          value={meals.length}
          subtitle="today"
          icon="◆"
          trend="Track your nutrition"
          color="green"
        />
      </div>

      {/* Recent Tasks */}
      <div className="p-6 bg-cyan-500/5 border border-cyan-400/20 rounded">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-cyan-400">ACTIVE TASKS</h2>
          <button
            onClick={() => navigate('/plan')}
            className="text-xs text-cyan-400/60 hover:text-cyan-400 font-mono"
          >
            VIEW ALL
          </button>
        </div>

        <div className="space-y-2">
          {tasks.slice(0, 5).map((task: any) => (
            <div
              key={task.id}
              className="p-3 bg-cyan-500/5 border border-cyan-400/10 rounded hover:border-cyan-400/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    completeTaskMutation.mutate(task.id)
                  }}
                  className="w-5 h-5 border border-cyan-400/50 rounded hover:border-cyan-400 hover:bg-cyan-400/10 transition-colors flex items-center justify-center"
                >
                  <span className="text-cyan-400 text-xs">{completeTaskMutation.isPending ? '◌' : ''}</span>
                </button>
                <div className="flex-1">
                  <div className="text-sm text-cyan-100">{task.title}</div>
                  {task.due_ts && (
                    <div className="text-xs text-cyan-400/40 font-mono mt-0.5">
                      {new Date(task.due_ts).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {task.priority >= 4 && (
                  <span className="px-2 py-0.5 text-xs font-mono bg-red-500/20 border border-red-400/30 text-red-300 rounded">
                    HIGH
                  </span>
                )}
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-2 text-cyan-400/40">✓</div>
              <p className="text-cyan-400/40 text-sm font-mono mb-3">ALL COMPLETE</p>
              <button
                onClick={() => navigate('/plan')}
                className="px-4 py-2 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-sm font-mono rounded hover:bg-cyan-500/30 transition-colors"
              >
                + NEW TASK
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon, label, onClick, loading }: any) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="p-4 bg-cyan-500/5 border border-cyan-400/20 rounded hover:border-cyan-400/40 transition-colors disabled:opacity-50 text-left"
    >
      <div className="text-2xl mb-2 text-cyan-400">{icon}</div>
      <div className="text-xs font-mono text-cyan-400/60">{loading ? 'LOADING...' : label}</div>
    </button>
  )
}

function StatCard({ title, value, subtitle, icon, trend, color }: any) {
  return (
    <div className="p-4 bg-cyan-500/5 border border-cyan-400/20 rounded">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-cyan-400/60 font-mono text-xs uppercase">{title}</h3>
        <span className="text-xl text-cyan-400/40">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-cyan-400 mb-1">
        {value}
      </div>
      <div className="text-xs text-cyan-400/40 font-mono">{subtitle}</div>
      {trend && (
        <div className="text-xs text-cyan-400/30 mt-2">{trend}</div>
      )}
    </div>
  )
}
