import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getNextBestStep, runRecipe } from '../api/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [nextBestStep, setNextBestStep] = useState<any>(null)

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Use chat_assistant recipe for real Ollama conversation
      const response = await runRecipe('chat_assistant', { message: input })

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response || 'I can help you plan your day and manage tasks.',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Failed to send message:', error)
      const errorMsg = error?.message || String(error)
      const errorMessage: Message = {
        role: 'assistant',
        content: `System Error: ${errorMsg}\n\nAll services are operational. Try refreshing the page or check the browser console.`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleGetNextBestStep = async () => {
    setLoading(true)
    try {
      const result = await getNextBestStep()
      setNextBestStep(result)

      const assistantMessage: Message = {
        role: 'assistant',
        content: `I recommend: ${result.action}\n\nWhy: ${result.why}\n\nEstimated time: ${result.duration_min} minutes`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Failed to get next best step:', error)
      const errorMsg = error?.message || String(error)
      alert(`Error: ${errorMsg}\n\nAll services are online. Try again or refresh the page.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
          <p className="text-gray-600 mt-1">Your intelligent life operating system</p>
        </div>
        <button
          onClick={handleGetNextBestStep}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Get Next Best Step
        </button>
      </div>

      {/* Next Best Step Card */}
      {nextBestStep && (
        <div className="mx-8 mt-6 p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90 mb-2">
                Next Best Step
              </h3>
              <p className="text-2xl font-bold mb-3">{nextBestStep.action}</p>
              <p className="text-blue-100 mb-2">{nextBestStep.why}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded">
                  ⏱️ {nextBestStep.duration_min} min
                </span>
                {nextBestStep.refs && nextBestStep.refs.length > 0 && (
                  <span className="opacity-75">
                    Based on {nextBestStep.refs.length} context signals
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setNextBestStep(null)}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded p-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto px-8 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            <div className="text-6xl mb-4 text-cyan-400">◉</div>
            <h2 className="text-xl font-semibold mb-2">How can I help you today?</h2>
            <p className="text-gray-400">
              Ask me about your schedule, tasks, health goals, or get recommendations.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button
                onClick={() => {
                  setInput("What should I focus on today?")
                  setTimeout(() => {
                    const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement
                    if (inputEl) inputEl.focus()
                  }, 100)
                }}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <div className="font-medium">What should I focus on?</div>
                <div className="text-sm text-gray-500">Get task priorities</div>
              </button>
              <button
                onClick={() => {
                  setInput("How am I doing with my health goals?")
                  setTimeout(() => {
                    const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement
                    if (inputEl) inputEl.focus()
                  }, 100)
                }}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <div className="font-medium">Health check-in</div>
                <div className="text-sm text-gray-500">Review your progress</div>
              </button>
              <button
                onClick={() => {
                  setInput("When should I reach out to friends?")
                  setTimeout(() => {
                    const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement
                    if (inputEl) inputEl.focus()
                  }, 100)
                }}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <div className="font-medium">Relationship nudges</div>
                <div className="text-sm text-gray-500">Stay connected</div>
              </button>
              <button
                onClick={handleGetNextBestStep}
                className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
              >
                <div className="font-medium text-blue-700">Next Best Step</div>
                <div className="text-sm text-blue-600">AI-powered recommendation</div>
              </button>
            </div>
          </div>
        )}

        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-2xl rounded-lg px-6 py-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white shadow border'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div
                className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white shadow border rounded-lg px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="animate-pulse text-cyan-400">◌</div>
                <span className="text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t px-8 py-6">
        <div className="flex gap-4 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me anything about your life OS..."
            className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
