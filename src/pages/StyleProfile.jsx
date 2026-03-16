import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SECTIONS = ['Overview', 'Fit Rules', 'Palette', 'Fabrics', 'Brands', 'Wish List']

const PALETTE = [
  { name: 'Burnt Rust', hex: '#8B3A2A' },
  { name: 'Deep Burgundy', hex: '#5C1A2E' },
  { name: 'Forest Green', hex: '#2D4A2D' },
  { name: 'Caramel Brown', hex: '#8B5E3C' },
  { name: 'Warm Olive', hex: '#5C5A2E' },
  { name: 'Charcoal Black', hex: '#1A1A1A' },
  { name: 'Dark Plum', hex: '#3D1A3D' },
  { name: 'Deep Teal', hex: '#1A3D4A' },
]

const BRANDS = [
  {
    name: 'ASOS Petite/Curve',
    desc: 'Wide size range with dedicated petite line. Affordable dark and edgy pieces. Good for basics and trend pieces.',
  },
  {
    name: 'Free People',
    desc: 'Bohemian-dark textures and silhouettes. Rich fabrics and moody colour palettes. Great for feminine edge.',
  },
  {
    name: "Altar'd State",
    desc: 'Dark romantic aesthetic. Good fits for petite frames. Unique, artisan-adjacent pieces.',
  },
  {
    name: 'Torrid',
    desc: 'Size-inclusive with a strong goth and punk range. Great for alt staples and statement pieces.',
  },
  {
    name: 'Hot Topic',
    desc: 'Alt staples and accessories. Fishnet, patches, platform shoes. Budget-friendly edge.',
  },
  {
    name: 'Nasty Gal',
    desc: 'Edgy elevated pieces. Good sale section. Strong boots and outerwear selection.',
  },
  {
    name: 'AllSaints',
    desc: 'Quality dark leather and moody pieces. Investment-worthy. Known for excellent leather jackets.',
  },
  {
    name: '& Other Stories',
    desc: 'Sophisticated dark pieces with excellent quality. Good for elevated Corporate Goth looks.',
  },
]

const FIT_PROBLEMS = [
  { problem: 'Pants too long', solution: 'Hem or fold, wear with heels' },
  { problem: 'Tops too wide at shoulders', solution: 'Look for XS/petite cuts, get tailored' },
  { problem: 'Waist lost in oversized', solution: 'Always define waist with belt or tuck' },
  { problem: 'Dresses hit wrong length', solution: 'Aim for above-knee or midi, avoid knee' },
  { problem: 'Skirts too long', solution: 'Aim for midi or mini — knee length shortens legs' },
]

const CHECKLIST_ITEMS = [
  'Does the waist sit at my natural waist (not hips)?',
  'Can I define my waist by tucking or belting?',
  'Does the length hit above-knee or midi (not knee)?',
  'Are the shoulders fitted or alterable?',
  'Does the colour work with my Deep Autumn palette?',
]

const PRIORITY_STYLES = {
  High: 'bg-rust/30 text-rust border-rust/30',
  Medium: 'bg-gold/20 text-gold border-gold/30',
  Low: 'bg-muted/20 text-muted border-muted/30',
}

export default function StyleProfile() {
  const [activeSection, setActiveSection] = useState('Overview')
  const [checklist, setChecklist] = useState(CHECKLIST_ITEMS.map(() => false))
  const [wishlist, setWishlist] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [newWish, setNewWish] = useState({ name: '', reason: '', priority: 'Medium' })
  const [addingWish, setAddingWish] = useState(false)

  useEffect(() => {
    if (activeSection === 'Wish List') fetchWishlist()
  }, [activeSection])

  async function fetchWishlist() {
    setWishlistLoading(true)
    const { data } = await supabase.from('wishlist').select('*').order('created_at', { ascending: false })
    setWishlist(data || [])
    setWishlistLoading(false)
  }

  async function addWishItem() {
    if (!newWish.name.trim()) return
    setAddingWish(true)
    const { data, error } = await supabase.from('wishlist').insert([{
      name: newWish.name.trim(),
      reason: newWish.reason.trim(),
      priority: newWish.priority,
    }]).select().single()
    if (!error && data) {
      setWishlist(w => [data, ...w])
      setNewWish({ name: '', reason: '', priority: 'Medium' })
    }
    setAddingWish(false)
  }

  async function deleteWishItem(id) {
    await supabase.from('wishlist').delete().eq('id', id)
    setWishlist(w => w.filter(item => item.id !== id))
  }

  function toggleCheck(i) {
    setChecklist(prev => prev.map((v, idx) => idx === i ? !v : v))
  }

  return (
    <div className="min-h-screen bg-ink text-ivory px-4 pt-6 pb-28 md:pt-20 md:pb-10 max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="font-serif text-3xl text-ivory">Style Profile</h1>
        <p className="text-muted text-sm mt-0.5">Rachel's personal style system</p>
      </div>

      {/* Section pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {SECTIONS.map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-200 shrink-0 ${
              activeSection === s
                ? 'bg-gold text-white font-semibold'
                : 'border border-white/10 text-muted hover:text-ivory'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeSection === 'Overview' && (
        <div className="space-y-4 fade-up">
          {/* Aesthetic Identity */}
          <div className="bg-charcoal rounded-xl p-5 border border-white/5">
            <h2 className="font-serif text-lg text-gold mb-3">Aesthetic Identity</h2>
            <p className="text-ivory font-medium mb-2">Corporate Goth × Emo/Punk × Casual Dark</p>
            <p className="text-muted text-sm leading-relaxed">
              A petite hourglass navigating dark romance and structured edge. Your style lives at the intersection of office-ready polish, subcultural depth, and effortless dark cool.
            </p>
          </div>

          {/* Body Profile */}
          <div className="bg-charcoal rounded-xl p-5 border border-white/5">
            <h2 className="font-serif text-lg text-gold mb-3">Body Profile</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-muted text-xs mb-1">Height</div>
                <div className="text-ivory text-sm">4'9" – 5'0"</div>
              </div>
              <div>
                <div className="text-muted text-xs mb-1">Frame</div>
                <div className="text-ivory text-sm">Petite Hourglass</div>
              </div>
              <div>
                <div className="text-muted text-xs mb-1">Notes</div>
                <div className="text-ivory text-sm">Soft tummy</div>
              </div>
              <div>
                <div className="text-muted text-xs mb-1">Skin Tone</div>
                <div className="text-ivory text-sm">Tan / Brown</div>
              </div>
            </div>
          </div>

          {/* Colour Season */}
          <div className="bg-charcoal rounded-xl p-5 border border-white/5">
            <h2 className="font-serif text-lg text-gold mb-3">Colour Season</h2>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full" style={{ background: 'linear-gradient(135deg, #8B3A2A, #5C1A2E, #2D4A2D)' }} />
              <div>
                <div className="text-ivory font-medium">Deep / Dark Autumn</div>
                <div className="text-muted text-xs">Warm undertone · High contrast</div>
              </div>
            </div>
            <p className="text-muted text-sm leading-relaxed">
              Rich, warm, and earthy colours are your best friends. You have enough natural contrast to wear deep darks powerfully. Cool tones wash you out; avoid them.
            </p>
          </div>

          {/* Best Silhouettes */}
          <div className="bg-charcoal rounded-xl p-5 border border-white/5">
            <h2 className="font-serif text-lg text-gold mb-3">Best Silhouettes</h2>
            <ul className="space-y-2 text-sm">
              {[
                'Fitted waist-defining pieces — never shapeless',
                'A-line skirts — flare from the hip, elongate leg',
                'High-waisted bottoms — create leg length',
                'Structured shoulders — balance your proportions',
                'Cropped tops or tucked-in styles — define the waist',
                'Column / midi skirts — vertical line elongates',
              ].map((s, i) => (
                <li key={i} className="flex gap-2 text-muted">
                  <span className="text-gold shrink-0">✦</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Fit Rules */}
      {activeSection === 'Fit Rules' && (
        <div className="space-y-4 fade-up">
          <div className="bg-charcoal rounded-xl p-5 border border-white/5">
            <h2 className="font-serif text-lg text-gold mb-4">Personal Fit Notes</h2>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex gap-2"><span className="text-gold shrink-0">•</span>Always define the waist — belt, tuck, or structural seam</li>
              <li className="flex gap-2"><span className="text-gold shrink-0">•</span>High-waisted everything — creates a longer leg line</li>
              <li className="flex gap-2"><span className="text-gold shrink-0">•</span>Avoid empire waists — sits at wrong place for hourglass</li>
              <li className="flex gap-2"><span className="text-gold shrink-0">•</span>Sleeves: bracelet length over full length (avoids the &quot;drowning&quot; look)</li>
              <li className="flex gap-2"><span className="text-gold shrink-0">•</span>Necklines: V-neck and square neck elongate the neck and torso</li>
              <li className="flex gap-2"><span className="text-gold shrink-0">•</span>Look for petite-specific sizing in trousers — inseam matters</li>
            </ul>
          </div>

          {/* Problem/Solution table */}
          <div className="bg-charcoal rounded-xl overflow-hidden border border-white/5">
            <div className="p-4 border-b border-white/5">
              <h2 className="font-serif text-lg text-gold">Problem / Solution</h2>
            </div>
            <div className="divide-y divide-white/5">
              {FIT_PROBLEMS.map((row, i) => (
                <div key={i} className="grid grid-cols-2 gap-4 p-4">
                  <div>
                    <div className="text-xs text-muted mb-1">Problem</div>
                    <div className="text-ivory text-sm">{row.problem}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted mb-1">Solution</div>
                    <div className="text-ivory text-sm">{row.solution}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Before-you-buy checklist */}
          <div className="bg-charcoal rounded-xl p-5 border border-white/5">
            <h2 className="font-serif text-lg text-gold mb-4">Before-You-Buy Checklist</h2>
            <div className="space-y-3">
              {CHECKLIST_ITEMS.map((item, i) => (
                <label key={i} className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() => toggleCheck(i)}
                    className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all duration-200 ${
                      checklist[i]
                        ? 'bg-gold border-gold'
                        : 'border-white/20 group-hover:border-gold/50'
                    }`}
                  >
                    {checklist[i] && <span className="text-ink text-xs font-bold">✓</span>}
                  </div>
                  <span className={`text-sm leading-relaxed transition-colors ${checklist[i] ? 'text-muted line-through' : 'text-ivory'}`}>
                    {item}
                  </span>
                </label>
              ))}
            </div>
            {checklist.every(Boolean) && (
              <div className="mt-4 text-center text-green-400 text-sm font-medium fade-up">
                ✓ All checks passed — it's a buy!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Palette */}
      {activeSection === 'Palette' && (
        <div className="space-y-4 fade-up">
          <div className="bg-charcoal rounded-xl p-5 border border-white/5">
            <h2 className="font-serif text-lg text-gold mb-4">Your Best Colours</h2>
            <div className="grid grid-cols-4 gap-3">
              {PALETTE.map(colour => (
                <div key={colour.name} className="flex flex-col items-center gap-2">
                  <div
                    className="w-14 h-14 rounded-full border-2 border-white/10 shadow-lg"
                    style={{ backgroundColor: colour.hex }}
                  />
                  <span className="text-muted text-xs text-center leading-tight">{colour.name}</span>
                  <span className="text-muted/50 text-xs">{colour.hex}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-charcoal rounded-xl p-5 border border-white/5">
            <h2 className="font-serif text-base text-ivory mb-3">Colour Principles</h2>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex gap-2"><span className="text-gold shrink-0">✦</span>All your colours are warm and muted — avoid cool or bright versions</li>
              <li className="flex gap-2"><span className="text-gold shrink-0">✦</span>Deep contrast (dark against skin) reads as polished and powerful on you</li>
              <li className="flex gap-2"><span className="text-gold shrink-0">✦</span>You can wear true black — your colouring has the depth for it</li>
              <li className="flex gap-2"><span className="text-gold shrink-0">✦</span>Gold and bronze jewellery. Silver washes out warm undertones.</li>
            </ul>
          </div>

          <div className="bg-rust/10 border border-rust/30 rounded-xl p-4">
            <h3 className="text-rust text-sm font-medium mb-2">Avoid These Colours</h3>
            <div className="flex flex-wrap gap-2">
              {['Pastels', 'Cool Grays', 'Bright White', 'Neon', 'Cool Blues', 'Icy Lavender', 'Hot Pink'].map(c => (
                <span key={c} className="text-xs px-2 py-1 rounded-full bg-rust/10 text-muted border border-rust/20">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fabrics */}
      {activeSection === 'Fabrics' && (
        <div className="space-y-4 fade-up">
          <div className="bg-charcoal rounded-xl p-5 border border-white/5">
            <h2 className="font-serif text-lg text-green-400 mb-4 flex items-center gap-2">
              <span>✓</span> Fabrics You Love
            </h2>
            <div className="space-y-3">
              {[
                { fabric: 'Matte Jersey', why: 'Drapes beautifully, defines curves without cling, easy to wear' },
                { fabric: 'Ponte', why: 'Structured and substantial, holds shape, looks polished' },
                { fabric: 'Velvet', why: 'Luxurious texture, absorbs light, perfect for your Deep Autumn palette' },
                { fabric: 'Faux Leather', why: 'Edge without bulk, excellent for Emo/Punk and Corporate Goth' },
                { fabric: 'Cotton-Modal Blends', why: 'Soft against skin, slight stretch, breathable for everyday wear' },
                { fabric: 'Structured Woven', why: 'For blazers, trousers. Holds shape, reads professional' },
              ].map((f, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-green-400 shrink-0 text-sm mt-0.5">✓</span>
                  <div>
                    <div className="text-ivory text-sm font-medium">{f.fabric}</div>
                    <div className="text-muted text-xs mt-0.5">{f.why}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-rust/10 border border-rust/20 rounded-xl p-5">
            <h2 className="font-serif text-lg text-rust mb-4 flex items-center gap-2">
              <span>✕</span> Fabrics to Avoid
            </h2>
            <div className="space-y-3">
              {[
                { fabric: 'Stiff Denim', why: 'Unflattering at petite scale — adds visual bulk without shape' },
                { fabric: 'Polyester Satin', why: 'Cheap sheen that reads low-quality. Use silk or matte alternatives.' },
                { fabric: 'Sheer Chiffon', why: 'Too delicate for your aesthetic — reads ethereal not dark' },
                { fabric: 'Thick Ribbed Knit', why: 'Adds bulk horizontally — avoid unless fitted and tucked' },
              ].map((f, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-rust shrink-0 text-sm mt-0.5">✕</span>
                  <div>
                    <div className="text-ivory text-sm font-medium">{f.fabric}</div>
                    <div className="text-muted text-xs mt-0.5">{f.why}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Brands */}
      {activeSection === 'Brands' && (
        <div className="space-y-3 fade-up">
          <p className="text-muted text-sm mb-4">Curated for your aesthetic, budget, and fit needs.</p>
          {BRANDS.map((brand) => (
            <div key={brand.name} className="bg-charcoal rounded-xl p-4 border border-white/5">
              <div className="text-ivory font-medium mb-1">{brand.name}</div>
              <div className="text-muted text-sm leading-relaxed">{brand.desc}</div>
            </div>
          ))}
          <div className="bg-gold/10 border border-gold/20 rounded-xl p-4 mt-4">
            <p className="text-gold text-sm font-medium mb-1">Shopping Principle</p>
            <p className="text-muted text-sm leading-relaxed">
              Focus on fit first — if it needs major tailoring to look right, it's not worth it. Invest in quality boots and outerwear. These are the pieces that define the silhouette and last for years.
            </p>
          </div>
        </div>
      )}

      {/* Wish List */}
      {activeSection === 'Wish List' && (
        <div className="fade-up">
          {/* Add new wish */}
          <div className="bg-charcoal rounded-xl p-4 border border-white/5 mb-5">
            <h2 className="font-serif text-base text-ivory mb-3">Add to Wish List</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Item name"
                value={newWish.name}
                onChange={e => setNewWish(w => ({ ...w, name: e.target.value }))}
                className="w-full bg-ink border border-white/10 rounded-xl px-4 py-2.5 text-ivory text-sm placeholder-muted focus:outline-none focus:border-gold/50"
              />
              <input
                type="text"
                placeholder="Why do you want it?"
                value={newWish.reason}
                onChange={e => setNewWish(w => ({ ...w, reason: e.target.value }))}
                className="w-full bg-ink border border-white/10 rounded-xl px-4 py-2.5 text-ivory text-sm placeholder-muted focus:outline-none focus:border-gold/50"
              />
              <div className="flex gap-2">
                {['High', 'Medium', 'Low'].map(p => (
                  <button
                    key={p}
                    onClick={() => setNewWish(w => ({ ...w, priority: p }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                      newWish.priority === p
                        ? p === 'High' ? 'bg-rust/30 border-rust/50 text-rust'
                          : p === 'Medium' ? 'bg-gold/20 border-gold/40 text-gold'
                          : 'bg-muted/20 border-muted/40 text-muted'
                        : 'border-white/10 text-muted'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={addWishItem}
                disabled={addingWish || !newWish.name.trim()}
                className="w-full bg-gold text-white font-semibold py-2.5 rounded-xl text-sm transition-all hover:bg-gold/90 disabled:opacity-50"
              >
                {addingWish ? 'Adding…' : '+ Add to List'}
              </button>
            </div>
          </div>

          {/* Wish list items */}
          {wishlistLoading ? (
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          ) : wishlist.length === 0 ? (
            <div className="text-center py-8 text-muted text-sm">
              <p>Your wish list is empty.</p>
              <p className="mt-1 text-xs">Add items from Gaps or add them above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wishlist.map(item => (
                <div key={item.id} className="bg-charcoal rounded-xl p-4 border border-white/5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.Medium}`}>
                          {item.priority}
                        </span>
                        {item.created_at && (
                          <span className="text-muted text-xs">
                            {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div className="text-ivory text-sm font-medium">{item.name}</div>
                      {item.reason && (
                        <div className="text-muted text-xs mt-1 leading-relaxed">{item.reason}</div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteWishItem(item.id)}
                      className="text-muted hover:text-rust text-xs shrink-0 mt-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 bg-gold/10 border border-gold/20 rounded-xl p-4">
            <p className="text-gold text-sm font-medium mb-1">Shopping Note</p>
            <p className="text-muted text-sm leading-relaxed">
              Focus on fit first — if it needs major tailoring to look right, it's not worth it. Invest in quality boots and outerwear.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
