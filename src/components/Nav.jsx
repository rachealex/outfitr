import React, { useState, useEffect } from 'react'

const mainTabs = [
  { id: 'today',    label: 'Today',       emoji: '☀️' },
  { id: 'closet',   label: 'Closet',      emoji: '🧥' },
  { id: 'history',  label: 'History',     emoji: '📅' },
  { id: 'gaps',     label: 'Gaps',        emoji: '🔍' },
  { id: 'analyze',  label: 'Analyze',     emoji: '📸' },
  { id: 'fitcheck', label: 'Fit Check',   emoji: '🪞' },
]

const desktopTabs = [
  ...mainTabs,
  { id: 'profile',  label: 'Profile',     emoji: '◉' },
]

export default function Nav({ activeTab, onTabChange, onSettingsOpen }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer on outside tap / scroll
  useEffect(() => {
    if (!drawerOpen) return
    function handleKey(e) { if (e.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [drawerOpen])

  // Prevent body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  function navigate(tabId) {
    onTabChange(tabId)
    setDrawerOpen(false)
  }

  function openSettings() {
    setDrawerOpen(false)
    onSettingsOpen()
  }

  return (
    <>
      {/* ── DESKTOP top nav ── */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-charcoal border-b border-white/10 h-14 items-center px-6 justify-between">
        <div className="flex items-center gap-1">
          <span className="font-serif text-gold text-xl mr-6 tracking-wide">Outfitr</span>
          {desktopTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-gold border-b-2 border-gold'
                  : 'text-muted hover:text-ivory'
              }`}
            >
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

      {/* ── MOBILE top header ── */}
      {/* paddingTop = safe-area-inset-top (status bar) + 14px content padding */}
      {/* height is auto so it grows with the safe area on notched iPhones     */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50 bg-charcoal border-b border-white/10 flex items-center justify-between px-5"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 0.875rem)',
          paddingBottom: '0.875rem',
        }}
      >
        <span className="font-serif text-gold text-2xl tracking-wide">Outfitr</span>
        <button
          onClick={() => setDrawerOpen(true)}
          className="text-ivory text-2xl w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
          aria-label="Open menu"
        >
          ☰
        </button>
      </header>

      {/* Spacer — matches header height: safe-area-inset-top + 3.5rem (56px) */}
      <div className="md:hidden" style={{ height: 'calc(env(safe-area-inset-top) + 3.5rem)' }} />

      {/* ── DRAWER backdrop ── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── DRAWER panel ── */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-72 z-60 bg-charcoal border-l border-white/10 flex flex-col transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ zIndex: 60 }}
      >
        {/* Drawer header — same safe-area padding as the main header */}
        <div
          className="flex items-center justify-between px-5 border-b border-white/8 shrink-0"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top) + 0.875rem)',
            paddingBottom: '0.875rem',
          }}
        >
          <span className="font-serif text-gold text-xl tracking-wide">Menu</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-muted hover:text-ivory text-xl w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Main nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {mainTabs.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl mb-1 transition-all duration-200 ${
                  isActive
                    ? 'bg-gold text-white'
                    : 'text-ivory hover:bg-white/5'
                }`}
              >
                <span className="text-2xl leading-none w-8 text-center">{tab.emoji}</span>
                <span className="text-base font-medium">{tab.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Bottom section — Style Profile + Settings */}
        <div className="shrink-0 border-t border-white/8 px-3 py-3">
          <button
            onClick={() => navigate('profile')}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl mb-1 transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-gold text-white'
                : 'text-ivory hover:bg-white/5'
            }`}
          >
            <span className="text-2xl leading-none w-8 text-center">✨</span>
            <span className="text-base font-medium">Style Profile</span>
          </button>

          <button
            onClick={openSettings}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 text-ivory hover:bg-white/5"
          >
            <span className="text-2xl leading-none w-8 text-center">⚙️</span>
            <span className="text-base font-medium">Settings</span>
          </button>
        </div>
      </div>
    </>
  )
}
