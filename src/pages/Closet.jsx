import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/imageUtils'

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

const SEASONS = ['All', 'Spring/Summer', 'Fall/Winter']
const OCCASIONS = ['Everyday', 'Work', 'Going Out', 'Special']

const EMPTY_FORM = {
  name: '',
  category: 'Tops',
  color: '',
  season: 'All',
  occasion: 'Everyday',
  photo_url: '',
}

function CategoryPill({ name, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
        active
          ? 'bg-gold text-white border-gold'
          : 'border-white/10 text-muted hover:text-ivory hover:border-white/30'
      }`}
    >
      {name} <span className="ml-1 opacity-70">{count}</span>
    </button>
  )
}

function ClothingCard({ item, onDelete, onPhotoUpdate }) {
  const fileInputRef = useRef()
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const filename = `${item.id}-${Date.now()}.jpg`
      const { data, error } = await supabase.storage
        .from('clothing-photos')
        .upload(filename, compressed, { upsert: true, contentType: 'image/jpeg' })
      if (error) throw error
      const { data: urlData } = supabase.storage
        .from('clothing-photos')
        .getPublicUrl(filename)
      const publicUrl = urlData.publicUrl
      await supabase.from('clothes').update({ photo_url: publicUrl }).eq('id', item.id)
      onPhotoUpdate(item.id, publicUrl)
    } catch (e) {
      console.error('Upload error:', e)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-charcoal rounded-xl overflow-hidden border border-white/5 group">
      {/* Photo area */}
      <div
        className="aspect-[3/4] bg-ink/60 relative flex items-center justify-center cursor-pointer overflow-hidden"
        onClick={() => fileInputRef.current?.click()}
        title="Click to upload photo"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="spinner" />
            <span className="text-muted text-xs">Uploading…</span>
          </div>
        ) : item.photo_url ? (
          <>
            <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-ivory text-xs">Change Photo</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-70 transition-opacity">
            <span className="text-3xl font-serif text-gold">
              {item.category?.charAt(0) || '?'}
            </span>
            <span className="text-muted text-xs">Add photo</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-1 mb-2">
          <div className="text-ivory text-sm font-medium leading-tight">{item.name}</div>
          <button
            onClick={() => onDelete(item.id)}
            className="text-muted hover:text-rust transition-colors shrink-0 text-xs mt-0.5"
            title="Delete item"
          >
            ✕
          </button>
        </div>
        {item.color && (
          <div className="text-xs text-muted mb-1">{item.color}</div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs px-2 py-0.5 rounded-full bg-rust/40 text-ivory/80">
            {item.category}
          </span>
          <span className="text-xs text-muted">
            worn {item.times_worn || 0}×
          </span>
        </div>
      </div>
    </div>
  )
}

function AddItemModal({ onClose, onAdded }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Write --vh = window.innerHeight * 0.01 so all modal sizing uses the
  // real visible height instead of Safari's inconsistent 100vh.
  useEffect(() => {
    function setVh() {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
    }
    setVh()
    window.addEventListener('resize', setVh)
    window.addEventListener('scroll', setVh)
    return () => {
      window.removeEventListener('resize', setVh)
      window.removeEventListener('scroll', setVh)
    }
  }, [])

  // Lock background scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    setError(null)
    try {
      let photoUrl = ''
      if (photoFile) {
        const compressed = await compressImage(photoFile)
        const filename = `item-${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('clothing-photos')
          .upload(filename, compressed, { upsert: true, contentType: 'image/jpeg' })
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('clothing-photos')
            .getPublicUrl(filename)
          photoUrl = urlData.publicUrl
        }
      }
      const { data, error: insertError } = await supabase.from('clothes').insert([{
        name: form.name.trim(),
        category: form.category,
        color: form.color.trim(),
        season: form.season,
        occasion: form.occasion,
        photo_url: photoUrl,
        times_worn: 0,
      }]).select().single()
      if (insertError) throw insertError
      onAdded(data)
      onClose()
    } catch (e) {
      setError('Error saving item. Check your Supabase setup.')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <>
      {/* Backdrop — sized with --vh so it covers exactly the visible viewport */}
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-black/70"
        style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
        onClick={onClose}
      />

      {/* Sheet — position:fixed bottom:0 so it anchors to the visible bottom edge.
          translateY animation slides it up from off-screen. */}
      <div
        className="slide-up bg-charcoal rounded-t-2xl border-t border-x border-white/10 flex flex-col z-50"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: 'calc(var(--vh, 1vh) * 90)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
          <h2 className="font-serif text-xl text-ivory">Add Item</h2>
          <button onClick={onClose} className="text-muted hover:text-ivory text-lg leading-none">✕</button>
        </div>

        {/* Scrollable form body */}
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 overflow-y-auto pb-safe"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Photo upload */}
          <div>
            <label className="block text-muted text-sm mb-2">Photo</label>
            {photoPreview ? (
              <div className="relative aspect-[3/2] rounded-xl overflow-hidden bg-ink">
                <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                  className="absolute top-2 right-2 bg-black/60 text-ivory text-xs px-2 py-1 rounded-lg"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 border-2 border-dashed border-white/10 rounded-xl p-6 cursor-pointer hover:border-gold/40 transition-colors">
                <span className="text-2xl">📷</span>
                <span className="text-muted text-sm">Tap to upload photo</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
              </label>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-muted text-sm mb-1">Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Black Fitted Blazer"
              autoComplete="off"
              className="w-full bg-ink border border-white/10 rounded-xl px-4 py-2.5 text-ivory text-sm placeholder-muted focus:outline-none focus:border-gold/50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-muted text-sm mb-1">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full bg-ink border border-white/10 rounded-xl px-4 py-2.5 text-ivory text-sm focus:outline-none focus:border-gold/50"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-muted text-sm mb-1">Color</label>
            <input
              type="text"
              name="color"
              value={form.color}
              onChange={handleChange}
              placeholder="e.g. Deep burgundy"
              autoComplete="off"
              className="w-full bg-ink border border-white/10 rounded-xl px-4 py-2.5 text-ivory text-sm placeholder-muted focus:outline-none focus:border-gold/50"
            />
          </div>

          {/* Season */}
          <div>
            <label className="block text-muted text-sm mb-1">Season</label>
            <select
              name="season"
              value={form.season}
              onChange={handleChange}
              className="w-full bg-ink border border-white/10 rounded-xl px-4 py-2.5 text-ivory text-sm focus:outline-none focus:border-gold/50"
            >
              {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Occasion */}
          <div>
            <label className="block text-muted text-sm mb-1">Occasion</label>
            <select
              name="occasion"
              value={form.occasion}
              onChange={handleChange}
              className="w-full bg-ink border border-white/10 rounded-xl px-4 py-2.5 text-ivory text-sm focus:outline-none focus:border-gold/50"
            >
              {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {error && <p className="text-rust text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gold text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:bg-gold/90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add to Closet'}
          </button>
        </form>
      </div>
    </>,
    document.body
  )
}

export default function Closet() {
  const [clothes, setClothes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchClothes()
  }, [])

  async function fetchClothes() {
    setLoading(true)
    const { data } = await supabase.from('clothes').select('*').order('created_at', { ascending: false })
    setClothes(data || [])
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this item?')) return
    await supabase.from('clothes').delete().eq('id', id)
    setClothes(c => c.filter(item => item.id !== id))
  }

  function handlePhotoUpdate(id, url) {
    setClothes(c => c.map(item => item.id === id ? { ...item, photo_url: url } : item))
  }

  function handleAdded(newItem) {
    setClothes(c => [newItem, ...c])
  }

  function openAddModal() {
    setShowAddModal(true)
  }

  // Category counts
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = clothes.filter(c => c.category === cat).length
    return acc
  }, {})
  const totalCount = clothes.length

  const filtered = activeCategory === 'All'
    ? clothes
    : clothes.filter(c => c.category === activeCategory)

  // Group by category for display
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(c => c.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-ink text-ivory px-4 pt-6 pb-28 md:pt-20 md:pb-10">
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleAdded}
        />
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-serif text-3xl text-ivory">My Closet</h1>
            <p className="text-muted text-sm mt-0.5">{totalCount} items</p>
          </div>
          <button
            onClick={() => openAddModal()}
            className="bg-gold text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gold/90 transition-all duration-200"
          >
            + Add Item
          </button>
        </div>

        {/* Category count pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <CategoryPill
            name="All"
            count={totalCount}
            active={activeCategory === 'All'}
            onClick={() => setActiveCategory('All')}
          />
          {CATEGORIES.map(cat => (
            categoryCounts[cat] > 0 && (
              <CategoryPill
                key={cat}
                name={cat}
                count={categoryCounts[cat]}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
              />
            )
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">▦</div>
            <p className="text-muted">
              {activeCategory === 'All'
                ? 'Your closet is empty. Add your first item!'
                : `No ${activeCategory} yet. Add some!`}
            </p>
            <button
              onClick={() => openAddModal()}
              className="mt-4 text-gold text-sm underline"
            >
              Add Item
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-8">
              <h2 className="font-serif text-lg text-gold mb-3 flex items-center gap-2">
                {cat}
                <span className="text-sm text-muted font-sans font-normal">({items.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map(item => (
                  <ClothingCard
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    onPhotoUpdate={handlePhotoUpdate}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
