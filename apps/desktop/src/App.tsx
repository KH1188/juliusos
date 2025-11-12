import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './views/Dashboard'
import Assistant from './views/Assistant'
import Plan from './views/Plan'
import Health from './views/Health'
import Skin from './views/Skin'
import Relationships from './views/Relationships'
import Bible from './views/Bible'
import Settings from './views/Settings'
import FloatingAssistant from './components/FloatingAssistant'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex h-screen bg-[#0a0e1a]">
        {/* Cyberpunk Sidebar */}
        <aside className="relative w-64 bg-gradient-to-b from-[#0a0e1a] to-[#0f1419] border-r border-cyan-400/20 p-4 overflow-hidden">
          {/* Scan line effect */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>

          {/* Logo */}
          <div className="mb-8 pb-4 border-b border-cyan-400/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight">
                JULI<span className="text-purple-400">OS</span>
              </h1>
            </div>
            <p className="text-cyan-300/40 text-xs font-mono">{'>'} v2.0 NEURAL</p>
          </div>

          <nav className="space-y-1">
            <NavLink to="/" label="Dashboard" icon="▣" />
            <NavLink to="/assistant" label="AI Core" icon="◉" />
            <NavLink to="/plan" label="Objectives" icon="◈" />
            <NavLink to="/health" label="Vitals" icon="◆" />
            <NavLink to="/skin" label="Skincare" icon="◇" />
            <NavLink to="/relationships" label="Network" icon="◐" />
            <NavLink to="/bible" label="Scripture" icon="◉" />
            <NavLink to="/settings" label="Config" icon="◎" />
          </nav>

          {/* System Status */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="p-3 bg-cyan-900/20 border border-cyan-400/20 rounded text-xs font-mono">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400">ONLINE</span>
              </div>
              <div className="text-cyan-300/40">AI: ACTIVE</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/health" element={<Health />} />
            <Route path="/skin" element={<Skin />} />
            <Route path="/relationships" element={<Relationships />} />
            <Route path="/bible" element={<Bible />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        {/* Global Floating Assistant */}
        <FloatingAssistant />
      </div>
    </BrowserRouter>
    </QueryClientProvider>
  )
}

function NavLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <Link
      to={to}
      className="group relative flex items-center space-x-3 px-4 py-2.5 rounded hover:bg-cyan-900/20 border border-transparent hover:border-cyan-400/30 transition-all duration-200"
    >
      {/* Active indicator */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-gradient-to-b from-cyan-400 to-purple-400 group-hover:h-full transition-all duration-300"></div>

      <span className="text-cyan-400 text-sm font-mono">{icon}</span>
      <span className="text-cyan-100/80 group-hover:text-cyan-100 font-mono text-sm tracking-wide transition-colors">{label}</span>

      {/* Corner accent on hover */}
      <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-cyan-400/0 group-hover:border-cyan-400/50 transition-all"></div>
    </Link>
  )
}

export default App
