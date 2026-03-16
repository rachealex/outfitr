import React, { useState, useRef } from 'react'
import { compressImage } from '../lib/imageUtils'

const SYSTEM_PROMPT = `You are a fit specialist helping Rachel (petite hourglass 4'9"-5'0" with soft tummy, Deep/Dark Autumn) determine if individual clothing items fit correctly and work for her body type. She is looking for specific, practical feedback about fit — not general style advice. Be direct and honest.`

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function VerdictBadge({ text }) {
  const lower = text.toLowerCase()
  if (lower.includes('keep')) return (
    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-900/40 text-green-400 border border-green-500/30 text-sm font-semibold">
      ✓ Keep
    </span>
  )
  if (lower.includes('alter')) return (
    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold/20 text-gold border border-gold/30 text-sm font-semibold">
      ✂ Alter
    </span>
  )
  if (lower.includes('replace')) return (
    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rust/20 text-rust border border-rust/30 text-sm font-semibold">
      ✕ Replace
    </span>
  )
  return null
}

function FitResult({ text }) {
  // Split on numbered headings like "1. " at start of lines
  const sections = text.split(/\n(?=\d+\.\s)/).filter(Boolean)

  // Try to find verdict
  const verdictMatch = text.match(/verdict[:\s]*\**(keep|alter|replace)\**/i)
  const verdictText = verdictMatch ? verdictMatch[1] : null

  if (sections.length <= 1) {
    return (
      <div>
        {verdictText && (
          <div className="mb-4">
            <VerdictBadge text={verdictText} />
          </div>
        )}
        <div className="text-ivory text-sm leading-relaxed whitespace-pre-wrap">{text}</div>
      </div>
    )
  }

  return (
    <div>
      {verdictText && (
        <div className="mb-4">
          <VerdictBadge text={verdictText} />
        </div>
      )}
      <div className="space-y-3">
        {sections.map((section, i) => {
          const lines = section.split('\n')
          const header = lines[0]
          const body = lines.slice(1).join('\n').trim()
          const isVerdict = header.toLowerCase().includes('verdict')
          return (
            <div key={i} className={`rounded-xl p-4 ${isVerdict ? 'bg-gold/10 border border-gold/20' : 'bg-ink/40'}`}>
              <div className={`font-medium text-sm mb-2 ${isVerdict ? 'text-gold' : 'text-gold'}`}>{header}</div>
              {body && <div className="text-muted text-sm leading-relaxed whitespace-pre-wrap">{body}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function FitCheck() {
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [itemName, setItemName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef()

  function handleFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setResult(null)
    setError(null)
  }

  function handleDrop(e) {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files?.[0])
  }

  async function handleCheck() {
    const apiKey = localStorage.getItem('anthropic_api_key')
    if (!apiKey) {
      setError('Please add your Anthropic API key in Settings (gear icon in nav)')
      return
    }
    if (!imageFile) {
      setError('Please select an image first.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const compressed = await compressImage(imageFile)
      const base64 = await fileToBase64(compressed)
      const mediaType = 'image/jpeg'

      const userText = `Check the fit of this item${itemName ? ` (${itemName})` : ''}. Assess:
1. Proportions for Petite Hourglass
2. Where the garment hits the body
3. Fit issues (too loose, tight, boxy, etc.)
4. Verdict: Keep / Alter / Replace — with specific reason`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-calls': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64,
                  },
                },
                {
                  type: 'text',
                  text: userText,
                },
              ],
            },
          ],
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.error?.message || `API error ${response.status}`)
      }

      const data = await response.json()
      const text = data.content?.[0]?.text || 'No response received.'
      setResult(text)
    } catch (e) {
      setError(e.message || 'Something went wrong. Check your API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setImageFile(null)
    setImagePreview(null)
    setResult(null)
    setError(null)
    setItemName('')
  }

  return (
    <div className="min-h-screen bg-ink text-ivory px-4 pt-6 pb-28 md:pt-20 md:pb-10 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ivory">Fit Check</h1>
        <p className="text-muted text-sm mt-0.5">Check if an item fits and works for your body type</p>
      </div>

      {/* Upload area */}
      {!imagePreview ? (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/10 hover:border-gold/40 rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 mb-4"
        >
          <span className="text-4xl">👗</span>
          <div className="text-center">
            <div className="text-ivory text-sm font-medium">Upload an item photo</div>
            <div className="text-muted text-xs mt-1">Flat lay, on body, or hanger photo works</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => handleFileSelect(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="mb-4">
          {result ? (
            <div className="flex gap-4">
              <div className="w-28 shrink-0">
                <img src={imagePreview} alt="item" className="w-full rounded-xl object-cover aspect-[3/4]" />
              </div>
              <div className="flex-1 min-w-0">
                <FitResult text={result} />
              </div>
            </div>
          ) : (
            <div className="relative">
              <img src={imagePreview} alt="item preview" className="w-full max-h-80 object-contain rounded-xl bg-charcoal" />
              <button
                onClick={reset}
                className="absolute top-2 right-2 bg-black/60 text-ivory text-xs px-2 py-1 rounded-lg"
              >
                Remove
              </button>
            </div>
          )}
          {result && (
            <button onClick={reset} className="mt-3 text-muted hover:text-ivory text-sm underline">
              Check a different item
            </button>
          )}
        </div>
      )}

      {/* Item name */}
      {!result && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Item name (optional) — e.g. 'ASOS blazer' or 'black midi skirt'"
            value={itemName}
            onChange={e => setItemName(e.target.value)}
            className="w-full bg-charcoal border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm placeholder-muted focus:outline-none focus:border-gold/50"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-rust/10 border border-rust/30 rounded-xl p-4 mb-4">
          <p className="text-rust text-sm">{error}</p>
        </div>
      )}

      {/* Check button */}
      {!result && (
        <button
          onClick={handleCheck}
          disabled={loading || !imageFile}
          className="w-full bg-gold hover:bg-gold/90 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
              Checking fit…
            </>
          ) : (
            '◐ Check Fit'
          )}
        </button>
      )}

      {/* Verdict key */}
      <div className="mt-6 bg-charcoal/60 border border-white/5 rounded-xl p-4">
        <p className="text-muted text-xs font-medium mb-2">Verdict Guide</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xs w-14 shrink-0">Keep</span>
            <span className="text-muted text-xs">Fits well as-is. Wear it with confidence.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gold text-xs w-14 shrink-0">Alter</span>
            <span className="text-muted text-xs">Worth fixing — specific alteration will make it work.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-rust text-xs w-14 shrink-0">Replace</span>
            <span className="text-muted text-xs">Doesn't work for your body/aesthetic. Let it go.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
