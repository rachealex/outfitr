import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
  'Tops',
  'Sweaters',
  'Bottoms',
  'Skirts',
  'Dresses/Jumpsuits',
  'Outerwear',
  'Boots',
  'Heels',
  'Sneakers',
  'Sandals',
  'Accessories',
]

const SUGGESTIONS = [
  {
    priority: 'High',
    name: 'Black fitted straight-leg trousers',
    reason: 'The corporate foundation. High-waisted straight-leg is the ideal petite silhouette — elongates without overwhelming.',
  },
  {
    priority: 'High',
    name: 'Structured black blazer',
    reason: 'The cornerstone of Corporate Goth. Look for a fitted waist seam and XS/petite cut to avoid shoulder excess.',
  },
  {
    priority: 'High',
    name: 'Black ankle boots with block heel',
    reason: 'Block heel keeps you stable, ankle height doesn\'t cut your leg line. Non-negotiable for a petite wardrobe.',
  },
  {
    priority: 'Medium',
    name: 'Dark plum/burgundy midi skirt',
    reason: 'Deep Autumn colour that works in all your aesthetics. A-line or fitted — both work for hourglass.',
  },
  {
    priority: 'Medium',
    name: 'Black fitted turtleneck',
    reason: 'Versatile base layer. Pairs with everything from blazers to skirts. Elongates the neck.',
  },
  {
    priority: 'Medium',
    name: 'Fishnet tights',
    reason: 'The quintessential Emo/Punk texture layer. Wear under shorts, skirts, or even ripped jeans for depth.',
  },
  {
    priority: 'Medium',
    name: 'Corset belt / waist cincher',
    reason: 'Transforms any loose piece into a defined silhouette. Your best friend for maintaining the hourglass on casual days.',
  },
  {
    priority: 'Low',
    name: 'Velvet midi dress in deep emerald or burgundy',
    reason: 'The ultimate Deep Autumn statement piece. Rich texture + jewel tone = your season personified.',
  },
  {
    priority: 'Low',
    name: 'Black lace or mesh overlay top',
    reason: 'Adds delicate edge to any look. Wear over a fitted cami for depth without full sheer.',
  },
  {
    priority: 'Low',
    name: 'Platform Mary Janes',
    reason: 'The Emo/Punk shoe upgrade. Adds height, adds edge, works with midi skirts and fitted trousers.',
  },
]

const PRIORITY_STYLES = {
  High: { badge: 'bg-rust/30 text-rust border border-rust/30', label: 'High Priority' },
  Medium: { badge: 'bg-gold/20 text-gold border border-gold/30', label: 'Medium Priority' },
  Low: { badge: 'bg-muted/20 text-muted border border-muted/30', label: 'Low Priority' },
}

export default function Gaps() {
  const [clothes, setClothes] = useState([])
  const [loading, setLoading] = useState(true)
  const [wishlistAdded, setWishlistAdded] = useState({})
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchClothes()
  }, [])

  async function fetchClothes() {
    setLoading(true)
    const { data } = await supabase.from('clothes').select('*')
    setClothes(data || [])
    setLoading(false)
  }

  async function addToWishlist(suggestion) {
    try {
      const { error } = await supabase.from('wishlist').insert([{
        name: suggestion.name,
        reason: suggestion.reason,
        priority: suggestion.priority,
      }])
      if (!error) {
        setWishlistAdded(prev => ({ ...prev, [suggestion.name]: true }))
        showToast(`"${suggestion.name}" added to wish list!`)
      } else {
        showToast('Error adding to wish list. Check Supabase tables.')
      }
    } catch {
      showToast('Error adding to wish list.')
    }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = clothes.filter(c => c.category === cat).length
    return acc
  }, {})

  const totalItems = clothes.length
  const categoriesRepresented = Object.values(categoryCounts).filter(c => c > 0).length
  const totalWorn = clothes.reduce((sum, c) => sum + (c.times_worn || 0), 0)

  const strengths = CATEGORIES.filter(cat => categoryCounts[cat] >= 2)
  const missing = CATEGORIES.filter(cat => categoryCounts[cat] === 0)

  return (
    <div className="min-h-screen bg-ink text-ivory px-4 pt-6 pb-28 md:pt-20 md:pb-10 max-w-2xl mx-auto">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-charcoal border border-gold/40 text-ivory px-6 py-3 rounded-xl shadow-xl text-sm fade-up">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ivory">Closet Gaps</h1>
        <p className="text-muted text-sm mt-0.5">What's working and what's missing</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-charcoal rounded-xl p-4 text-center border border-white/5">
          <div className="font-serif text-2xl text-gold">{totalItems}</div>
          <div className="text-muted text-xs mt-1">Total Items</div>
        </div>
        <div className="bg-charcoal rounded-xl p-4 text-center border border-white/5">
          <div className="font-serif text-2xl text-gold">{categoriesRepresented}</div>
          <div className="text-muted text-xs mt-1">Categories</div>
        </div>
        <div className="bg-charcoal rounded-xl p-4 text-center border border-white/5">
          <div className="font-serif text-2xl text-gold">{totalWorn}</div>
          <div className="text-muted text-xs mt-1">Times Worn</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="spinner" />
        </div>
      ) : (
        <>
          {/* Strengths */}
          {strengths.length > 0 && (
            <div className="bg-charcoal rounded-xl p-4 mb-4 border border-white/5">
              <h2 className="font-serif text-lg text-ivory mb-3 flex items-center gap-2">
                <span className="text-green-400">✓</span> Closet Strengths
              </h2>
              <div className="flex flex-wrap gap-2">
                {strengths.map(cat => (
                  <span key={cat} className="px-3 py-1.5 rounded-full text-xs font-medium bg-moss/40 text-green-300 border border-moss/30">
                    {cat} ({categoryCounts[cat]})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing */}
          {missing.length > 0 && (
            <div className="bg-charcoal rounded-xl p-4 mb-6 border border-white/5">
              <h2 className="font-serif text-lg text-ivory mb-3 flex items-center gap-2">
                <span className="text-rust">○</span> Missing Balance
              </h2>
              <div className="flex flex-wrap gap-2">
                {missing.map(cat => (
                  <span key={cat} className="px-3 py-1.5 rounded-full text-xs font-medium bg-ink/60 text-muted border border-white/5">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Additions */}
          <div className="mb-6">
            <h2 className="font-serif text-xl text-ivory mb-1">Suggested Additions</h2>
            <p className="text-muted text-sm mb-4">Tailored to Corporate Goth × Emo/Punk × Casual Dark for petite hourglass Deep Dark Autumn</p>
            <div className="space-y-3">
              {SUGGESTIONS.map((suggestion) => {
                const style = PRIORITY_STYLES[suggestion.priority]
                const added = wishlistAdded[suggestion.name]
                return (
                  <div key={suggestion.name} className="bg-charcoal rounded-xl p-4 border border-white/5">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${style.badge}`}>
                            {style.label}
                          </span>
                        </div>
                        <div className="text-ivory text-sm font-medium mb-1">{suggestion.name}</div>
                        <div className="text-muted text-xs leading-relaxed">{suggestion.reason}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => addToWishlist(suggestion)}
                      disabled={added}
                      className={`mt-3 text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                        added
                          ? 'border-gold/20 text-gold/50 cursor-default'
                          : 'border-gold/40 text-gold hover:bg-gold/10'
                      }`}
                    >
                      {added ? '✓ Added to Wish List' : '+ Add to Wish List'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Style Rules */}
          <div className="border-t border-white/5 pt-6">
            <h2 className="font-serif text-xl text-ivory mb-4">Style Rules</h2>
            <div className="space-y-4">
              <div className="bg-charcoal rounded-xl p-4 border border-white/5">
                <h3 className="font-medium text-gold text-sm mb-2">Petite Proportions</h3>
                <ul className="space-y-1.5 text-muted text-sm">
                  <li className="flex gap-2"><span className="text-gold shrink-0">•</span>Crop tops + high waist creates the illusion of longer legs</li>
                  <li className="flex gap-2"><span className="text-gold shrink-0">•</span>Avoid oversized — it drowns your frame and loses your silhouette</li>
                  <li className="flex gap-2"><span className="text-gold shrink-0">•</span>Vertical lines elongate — seams, column skirts, long necklaces</li>
                  <li className="flex gap-2"><span className="text-gold shrink-0">•</span>Match tights to shoes or hem for an unbroken leg line</li>
                </ul>
              </div>
              <div className="bg-charcoal rounded-xl p-4 border border-white/5">
                <h3 className="font-medium text-gold text-sm mb-2">Deep Autumn Palette</h3>
                <ul className="space-y-1.5 text-muted text-sm">
                  <li className="flex gap-2"><span className="text-rust shrink-0">•</span>Rich earth tones are your power colours: burnt orange, deep rust, forest green</li>
                  <li className="flex gap-2"><span className="text-rust shrink-0">•</span>Avoid cool grays, pastels, and anything that reads as "icy" or "bright"</li>
                  <li className="flex gap-2"><span className="text-rust shrink-0">•</span>Black always works — you have the contrast for it</li>
                  <li className="flex gap-2"><span className="text-rust shrink-0">•</span>Gold jewellery over silver — always</li>
                </ul>
              </div>
              <div className="bg-charcoal rounded-xl p-4 border border-white/5">
                <h3 className="font-medium text-gold text-sm mb-2">Aesthetic Balance</h3>
                <ul className="space-y-1.5 text-muted text-sm">
                  <li className="flex gap-2"><span className="text-muted shrink-0">•</span>Mix dark romance + structure — not all soft, not all hard</li>
                  <li className="flex gap-2"><span className="text-muted shrink-0">•</span>Don't go all-black every day — introduce one colour from your palette</li>
                  <li className="flex gap-2"><span className="text-muted shrink-0">•</span>Add one textured piece per outfit — velvet, lace, leather, knit</li>
                  <li className="flex gap-2"><span className="text-muted shrink-0">•</span>Let one piece lead — the rest should support it</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
