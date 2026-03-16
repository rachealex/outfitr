import React, { useState, useEffect } from 'react'
import Nav from './components/Nav'
import Today from './pages/Today'
import Closet from './pages/Closet'
import History from './pages/History'
import Gaps from './pages/Gaps'
import StyleProfile from './pages/StyleProfile'
import Analyze from './pages/Analyze'
import FitCheck from './pages/FitCheck'

function SettingsModal({ onClose }) {
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('anthropic_api_key') || ''
    setApiKey(stored)
  }, [])

  function handleSave() {
    localStorage.setItem('anthropic_api_key', apiKey)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-charcoal rounded-xl w-full max-w-sm border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="font-serif text-xl text-ivory">Settings</h2>
          <button onClick={onClose} className="text-muted hover:text-ivory text-lg">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-muted text-sm mb-1">Anthropic API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-ink border border-white/10 rounded-xl px-4 py-2.5 text-ivory text-sm placeholder-muted focus:outline-none focus:border-gold/50 font-mono"
            />
          </div>
          <p className="text-muted text-xs leading-relaxed">
            Required for Outfit Analyzer and Fit Check features. Your key is stored locally in your browser and never sent to any server other than Anthropic's API directly.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-gold text-ink font-semibold py-2.5 rounded-xl text-sm hover:bg-gold/90 transition-all"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-white/10 text-muted py-2.5 rounded-xl text-sm hover:text-ivory transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const PAGES = {
  today: Today,
  closet: Closet,
  history: History,
  gaps: Gaps,
  profile: StyleProfile,
  analyze: Analyze,
  fitcheck: FitCheck,
}

export default function App() {
  const [activeTab, setActiveTab] = useState('today')
  const [showSettings, setShowSettings] = useState(false)

  function handleTabChange(tab) {
    setActiveTab(tab)
  }

  const PageComponent = PAGES[activeTab] || Today

  return (
    <div className="bg-ink min-h-screen text-ivory">
      <Nav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSettingsOpen={() => setShowSettings(true)}
      />

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      <div key={activeTab} className="fade-up">
        <PageComponent />
      </div>
    </div>
  )
}
