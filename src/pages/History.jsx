import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FEEDBACK_TAGS } from './Today'

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

// Build a stable key from the item IDs in an outfit so we can match
// history entries to their feedback records.
function feedbackKey(items) {
  return (items || []).map(i => i.id).filter(Boolean).sort().join(',')
}

export default function History() {
  const [entries, setEntries] = useState([])
  const [clothes, setClothes] = useState([])
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)

  // Inline feedback-form state
  const [openFeedbackId, setOpenFeedbackId] = useState(null)
  const [quickLiked, setQuickLiked] = useState(null)
  const [quickTags, setQuickTags] = useState([])
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: history }, { data: clothesData }, { data: feedbackData }] = await Promise.all([
      supabase.from('outfit_history').select('*').order('date', { ascending: false }),
      supabase.from('clothes').select('*').order('times_worn', { ascending: false }),
      supabase.from('outfit_feedback').select('*').catch(() => ({ data: [] })),
    ])
    setEntries(history || [])
    setClothes(clothesData || [])
    setFeedback(feedbackData || [])
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

  // Build a lookup: feedbackKey → feedback record
  const feedbackMap = feedback.reduce((map, f) => {
    const key = feedbackKey(f.outfit_items)
    if (key) map[key] = f
    return map
  }, {})

  async function handleSaveQuickFeedback(entry) {
    if (quickLiked === null && quickTags.length === 0) return
    setSavingId(entry.id)
    try {
      const { error } = await supabase.from('outfit_feedback').insert([{
        outfit_items: entry.outfit_items,
        mood: entry.mood,
        weather_tier: null,
        liked: quickLiked,
        tags: quickTags,
        notes: null,
      }])

      if (!error && quickLiked !== null) {
        const delta = quickLiked ? 1 : -1
        for (const item of (entry.outfit_items || [])) {
          if (!item.id) continue
          const { data: existing } = await supabase
            .from('item_scores')
            .select('score')
            .eq('item_id', item.id)
            .maybeSingle()
          const newScore = (existing?.score || 0) + delta
          await supabase.from('item_scores').upsert(
            { item_id: item.id, score: newScore, updated_at: new Date().toISOString() },
            { onConflict: 'item_id' }
          )
        }
      }

      setOpenFeedbackId(null)
      setQuickLiked(null)
      setQuickTags([])
      await fetchAll()
    } catch (e) {
      // silently ignore
    } finally {
      setSavingId(null)
    }
  }

  function openForm(entryId) {
    setOpenFeedbackId(entryId)
    setQuickLiked(null)
    setQuickTags([])
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
            const key = feedbackKey(entry.outfit_items)
            const fb = feedbackMap[key]
            const isFormOpen = openFeedbackId === entry.id

            return (
              <div key={entry.id} className="bg-charcoal rounded-xl p-4 border border-white/5">
                {/* Header */}
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

                {/* Item thumbnails */}
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

                {/* Feedback display or form */}
                {fb ? (
                  // Existing feedback
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center flex-wrap gap-2">
                    {fb.liked === true && <span className="text-base leading-none">👍</span>}
                    {fb.liked === false && <span className="text-base leading-none">👎</span>}
                    {(fb.tags || []).map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold/70 border border-gold/20"
                      >
                        {tag}
                      </span>
                    ))}
                    {fb.notes && (
                      <span className="text-muted text-xs italic">"{fb.notes}"</span>
                    )}
                  </div>
                ) : isFormOpen ? (
                  // Inline mini feedback form
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setQuickLiked(quickLiked === true ? null : true)}
                        className={`flex-1 py-2 rounded-lg border text-sm transition-all duration-200 ${
                          quickLiked === true
                            ? 'border-gold bg-gold/20 text-gold'
                            : 'border-white/10 text-muted hover:border-white/30'
                        }`}
                      >
                        👍 Loved it
                      </button>
                      <button
                        onClick={() => setQuickLiked(quickLiked === false ? null : false)}
                        className={`flex-1 py-2 rounded-lg border text-sm transition-all duration-200 ${
                          quickLiked === false
                            ? 'border-rust bg-rust/20 text-rust'
                            : 'border-white/10 text-muted hover:border-white/30'
                        }`}
                      >
                        👎 Not for me
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {FEEDBACK_TAGS.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setQuickTags(prev =>
                            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                          )}
                          className={`px-2.5 py-1 rounded-full text-xs border transition-all duration-200 ${
                            quickTags.includes(tag)
                              ? 'bg-gold/20 border-gold/50 text-gold'
                              : 'border-white/10 text-muted hover:border-white/20 hover:text-ivory'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => { setOpenFeedbackId(null); setQuickLiked(null); setQuickTags([]) }}
                        className="px-3 py-1.5 text-xs text-muted border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveQuickFeedback(entry)}
                        disabled={savingId === entry.id || (quickLiked === null && quickTags.length === 0)}
                        className="flex-1 py-1.5 text-xs bg-gold hover:bg-gold/90 text-white rounded-lg disabled:opacity-40 transition-all duration-200"
                      >
                        {savingId === entry.id ? 'Saving…' : 'Save Feedback'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // No feedback yet — prompt
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <button
                      onClick={() => openForm(entry.id)}
                      className="text-muted/50 text-xs hover:text-gold transition-colors duration-200"
                    >
                      + Rate this outfit
                    </button>
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
