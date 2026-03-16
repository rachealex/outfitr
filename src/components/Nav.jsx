import React from 'react'

const tabs = [
  { id: 'today', label: 'Today', icon: '✦' },
  { id: 'closet', label: 'Closet', icon: '▦' },
  { id: 'history', label: 'History', icon: '◷' },
  { id: 'gaps', label: 'Gaps', icon: '◈' },
  { id: 'profile', label: 'Profile', icon: '◉' },
  { id: 'analyze', label: 'Analyze', icon: '◎' },
  { id: 'fitcheck', label: 'Fit Check', icon: '◐' },
]

export default function Nav({ activeTab, onTabChange, onSettingsOpen }) {
  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-charcoal border-b border-white/10 h-14 items-center px-6 justify-between">
        <div className="flex items-center gap-1">
          <span className="font-serif text-gold text-xl mr-6 tracking-wide">Outfitr</span>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-gold border-b-2 border-gold'
                  : 'text-muted hover:text-ivory'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onSettingsOpen}
          className="text-muted hover:text-ivory transition-colors duration-200 text-xl p-2"
          title="Settings"
        >
          ⚙
        </button>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-charcoal border-t border-white/10">
        <div className="flex items-stretch h-16">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-all duration-200 relative ${
                activeTab === tab.id ? 'text-gold' : 'text-muted'
              }`}
            >
              {activeTab === tab.id && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gold rounded-full" />
              )}
              <span className="text-base leading-none">{tab.icon}</span>
              <span className="leading-none" style={{ fontSize: '9px' }}>{tab.label}</span>
            </button>
          ))}
          <button
            onClick={onSettingsOpen}
            className="flex-none flex flex-col items-center justify-center px-3 text-xs text-muted hover:text-ivory transition-colors duration-200 gap-0.5"
          >
            <span className="text-base leading-none">⚙</span>
            <span className="leading-none" style={{ fontSize: '9px' }}>Settings</span>
          </button>
        </div>
      </nav>
    </>
  )
}
