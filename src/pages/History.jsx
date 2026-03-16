import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function MoodBadge({ mood }) {
  const colors = {
    'Corporate Goth': 'bg-charcoal border border-gold/40 text-gold',
    'Emo/Punk': 'bg-charcoal border border-rust/40 text-rust',
    'Casual Dark': 'bg-charcoal border border-muted/40 text-muted',
    'Surprise Me': 'bg-charcoal border border-moss/40 text-green-400',
  }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full ${colors[mood] || 'bg-charcoal text-muted border border-white/10'}`}>
      {mood}
    </span>
  )
}

export default function History() {
  const [entries, setEntries] = useState([])
  const [clothes, setClothes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: history }, { data: clothesData }] = await Promise.all([
      supabase.from('outfit_history').select('*').order('date', { ascending: false }),
      supabase.from('clothes').select('*').order('times_worn', { ascending: false }),
    ])
    setEntries(history || [])
    setClothes(clothesData || [])
    setLoading(false)
  }

  function resolveItems(outfitItems) {
    if (!outfitItems || !Array.isArray(outfitItems)) return []
    return outfitItems.map(oi => {
      if (oi.id) {
        const found = clothes.find(c => c.id === oi.id)
        return found || oi
      }
      if (oi.name) {
        const found = clothes.find(c => c.name === oi.name)
        return found || oi
      }
      return oi
    }).filter(Boolean)
  }

  const topWorn = [...clothes]
    .filter(c => (c.times_worn || 0) > 0)
    .sort((a, b) => (b.times_worn || 0) - (a.times_worn || 0))
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-ink text-ivory px-4 pt-6 pb-28 md:pt-20 md:pb-10 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ivory">Outfit History</h1>
        <p className="text-muted text-sm mt-0.5">{entries.length} recorded outfit{entries.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="spinner" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">◷</div>
          <p className="text-muted">No outfit history yet.</p>
          <p className="text-muted text-sm mt-1">Generate and wear an outfit from the Today tab to start tracking.</p>
        </div>
      ) : (
        <div className="space-y-4 mb-10 fade-up">
          {entries.map((entry) => {
            const items = resolveItems(entry.outfit_items)
            return (
              <div key={entry.id} className="bg-charcoal rounded-xl p-4 border border-white/5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-ivory font-medium text-sm">{formatDate(entry.date)}</div>
                    {entry.weather_temp && (
                      <div className="text-muted text-xs mt-0.5">
                        {entry.weather_temp}°F · {entry.weather_condition || 'Unknown conditions'}
                      </div>
                    )}
                  </div>
                  {entry.mood && <MoodBadge mood={entry.mood} />}
                </div>

                {/* Outfit item thumbnails */}
                {items.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {items.map((item, i) => (
                      <div key={item.id || i} className="flex flex-col items-center gap-1">
                        <div className="w-12 h-16 bg-ink/60 rounded-lg overflow-hidden flex items-center justify-center border border-white/5">
                          {item.photo_url ? (
                            <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gold/40 text-lg font-serif">
                              {item.category?.charAt(0) || item.name?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                        <span className="text-muted text-xs text-center leading-tight max-w-[52px] truncate">
                          {item.name || 'Item'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Most Worn Items */}
      {topWorn.length > 0 && (
        <div className="border-t border-white/5 pt-6">
          <h2 className="font-serif text-xl text-gold mb-4">Most Worn Items</h2>
          <div className="space-y-3">
            {topWorn.map((item, i) => (
              <div key={item.id} className="flex items-center gap-3 bg-charcoal rounded-xl p-3 border border-white/5">
                <div className="text-muted text-sm font-medium w-5 shrink-0">#{i + 1}</div>
                <div className="w-10 h-14 bg-ink/60 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-white/5">
                  {item.photo_url ? (
                    <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gold/40 font-serif">{item.category?.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-ivory text-sm font-medium truncate">{item.name}</div>
                  <div className="text-muted text-xs">{item.category}</div>
                </div>
                <div className="text-gold text-sm font-medium shrink-0">
                  {item.times_worn}×
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
