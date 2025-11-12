import { useState, useRef, useEffect } from 'react'
import { runRecipe } from '../api/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  files?: string[]
  codeBlocks?: Array<{language: string, code: string}>
}

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'chat' | 'code'>('chat')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [showFileBrowser, setShowFileBrowser] = useState(false)
  const [fileStructure, setFileStructure] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadFileStructure = async () => {
    try {
      const response = await runRecipe('code_assistant', {
        message: '',
        operation: 'list'
      })
      setFileStructure(response.structure || response.response)
    } catch (error) {
      console.error('Failed to load file structure:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
      files: mode === 'code' ? selectedFiles : undefined
    }

    setMessages([...messages, userMessage])
    setInput('')
    setLoading(true)

    try {
      let response

      if (mode === 'code') {
        response = await runRecipe('code_assistant', {
          message: input,
          files: selectedFiles,
          operation: selectedFiles.length > 0 ? 'read' : 'list'
        })
      } else {
        response = await runRecipe('chat_assistant', { message: input })
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response || 'No response received.',
        timestamp: new Date(),
        codeBlocks: response.code_blocks
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error?.message || String(error)}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (filePath: string) => {
    if (selectedFiles.includes(filePath)) {
      setSelectedFiles(selectedFiles.filter(f => f !== filePath))
    } else {
      setSelectedFiles([...selectedFiles, filePath])
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 flex items-center justify-center text-white text-2xl z-50"
        title="Open AI Assistant"
      >
        ◉
      </button>
    )
  }

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 bg-[#0a0e1a] border border-cyan-400/30 rounded-lg p-4 shadow-lg cursor-pointer hover:border-cyan-400/50 transition-colors z-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
          <span className="text-cyan-400 font-mono text-sm">AI ASSISTANT</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
            className="text-cyan-400/60 hover:text-cyan-400 ml-2"
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-[500px] h-[600px] bg-[#0a0e1a] border border-cyan-400/30 rounded-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-400/20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
          <span className="text-cyan-400 font-mono text-sm font-bold">AI ASSISTANT</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <div className="flex gap-1 bg-cyan-500/10 rounded p-1">
            <button
              onClick={() => setMode('chat')}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                mode === 'chat'
                  ? 'bg-cyan-500/30 text-cyan-300'
                  : 'text-cyan-400/60 hover:text-cyan-400'
              }`}
            >
              CHAT
            </button>
            <button
              onClick={() => {
                setMode('code')
                loadFileStructure()
              }}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                mode === 'code'
                  ? 'bg-purple-500/30 text-purple-300'
                  : 'text-cyan-400/60 hover:text-cyan-400'
              }`}
            >
              CODE
            </button>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-cyan-400/60 hover:text-cyan-400 text-sm"
          >
            −
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-cyan-400/60 hover:text-cyan-400 text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      {/* File Browser (Code Mode) */}
      {mode === 'code' && showFileBrowser && (
        <div className="p-3 border-b border-cyan-400/20 bg-cyan-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-cyan-400/60 font-mono">FILE BROWSER</span>
            <button
              onClick={() => setShowFileBrowser(false)}
              className="text-xs text-cyan-400/60 hover:text-cyan-400"
            >
              HIDE
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto text-xs font-mono">
            <pre className="text-cyan-300/60 whitespace-pre-wrap">{fileStructure}</pre>
          </div>
        </div>
      )}

      {/* Selected Files */}
      {mode === 'code' && selectedFiles.length > 0 && (
        <div className="p-2 border-b border-cyan-400/20 bg-purple-500/5">
          <div className="text-xs text-purple-400/60 font-mono mb-1">CONTEXT FILES:</div>
          <div className="flex flex-wrap gap-1">
            {selectedFiles.map(file => (
              <div
                key={file}
                className="px-2 py-1 bg-purple-500/20 border border-purple-400/30 rounded text-xs font-mono text-purple-300 flex items-center gap-2"
              >
                {file.split('/').pop()}
                <button
                  onClick={() => handleFileSelect(file)}
                  className="text-purple-400/60 hover:text-purple-300"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-cyan-400/40 text-sm mt-8">
            <div className="text-4xl mb-2">◉</div>
            <p className="font-mono">
              {mode === 'chat' ? 'HOW CAN I HELP?' : 'READY TO CODE'}
            </p>
          </div>
        )}

        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-cyan-500/20 border border-cyan-400/30 text-cyan-100'
                  : 'bg-purple-500/10 border border-purple-400/20 text-purple-100'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              {message.codeBlocks && message.codeBlocks.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.codeBlocks.map((block, i) => (
                    <div key={i} className="bg-black/30 rounded p-2 overflow-x-auto">
                      <div className="text-xs text-cyan-400/60 mb-1">{block.language}</div>
                      <pre className="text-xs text-green-300 font-mono">{block.code}</pre>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-xs mt-1 opacity-60 font-mono">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-purple-500/10 border border-purple-400/20 rounded px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="animate-pulse text-cyan-400">◌</div>
                <span className="text-sm text-purple-200/60">Processing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-cyan-400/20">
        {mode === 'code' && (
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setShowFileBrowser(!showFileBrowser)}
              className="px-2 py-1 text-xs font-mono bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 rounded hover:bg-cyan-500/20"
            >
              {showFileBrowser ? 'HIDE' : 'BROWSE'}
            </button>
            <input
              type="text"
              placeholder="File path (e.g., apps/desktop/src/App.tsx)"
              className="flex-1 px-2 py-1 text-xs bg-cyan-500/5 border border-cyan-400/20 rounded text-cyan-300 placeholder-cyan-400/40 focus:outline-none focus:border-cyan-400/40 font-mono"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  handleFileSelect(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            placeholder={mode === 'chat' ? 'Ask me anything...' : 'Describe what you want to code...'}
            className="flex-1 px-3 py-2 bg-cyan-500/5 border border-cyan-400/20 rounded text-cyan-300 text-sm placeholder-cyan-400/40 focus:outline-none focus:border-cyan-400/40"
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-sm font-mono rounded hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ▸
          </button>
        </div>
      </div>
    </div>
  )
}
