import React, { useState, useRef } from 'react'
import { compressImage } from '../lib/imageUtils'

const SYSTEM_PROMPT = `You are a personal stylist analyzing outfits for Rachel. She is a petite hourglass figure (4'9"-5'0" with a soft tummy), Deep/Dark Autumn colour season with tan/brown skin. Her aesthetics are Corporate Goth, Emo/Punk, and Casual Dark. Her fit rules: always define the waist, high-waisted bottoms, cropped or tucked tops, avoid oversized, favour vertical lines to elongate. Her colour palette is rich and muted: burnt rust, deep burgundy, forest green, caramel brown, warm olive, charcoal black, dark plum, deep teal. Analyse the outfit and provide specific feedback.`

const USER_MESSAGE = `Please analyze this outfit for Rachel. Cover:
1. Fit & Proportion (how it works for petite hourglass)
2. Colour Harmony (Deep/Dark Autumn compatibility)
3. Aesthetic Match (Corporate Goth/Emo/Punk/Casual Dark)
4. Longevity & Versatility
5. How to Elevate It (specific suggestions)`

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      // Remove data:xxx;base64, prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function AnalysisResult({ text }) {
  // Split on numbered headings like "1. " or "\n1."
  const sections = text.split(/\n(?=\d+\.\s)/).filter(Boolean)

  if (sections.length <= 1) {
    return (
      <div className="text-ivory text-sm leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sections.map((section, i) => {
        const lines = section.split('\n')
        const header = lines[0]
        const body = lines.slice(1).join('\n').trim()
        return (
          <div key={i} className="bg-ink/40 rounded-xl p-4">
            <div className="text-gold font-medium text-sm mb-2">{header}</div>
            <div className="text-muted text-sm leading-relaxed whitespace-pre-wrap">{body}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function Analyze() {
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef()
  const dropRef = useRef()

  function handleFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setResult(null)
    setError(null)
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    handleFileSelect(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  async function handleAnalyze() {
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

      const userContent = [
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
          text: notes
            ? `${USER_MESSAGE}\n\nAdditional notes from Rachel: ${notes}`
            : USER_MESSAGE,
        },
      ]

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
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: userContent,
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

  return (
    <div className="min-h-screen bg-ink text-ivory px-4 pt-6 pb-28 md:pt-20 md:pb-10 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ivory">Outfit Analyzer</h1>
        <p className="text-muted text-sm mt-0.5">AI-powered outfit feedback tailored to your profile</p>
      </div>

      {/* Upload area */}
      {!imagePreview ? (
        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/10 hover:border-gold/40 rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 mb-4"
        >
          <span className="text-4xl">📷</span>
          <div className="text-center">
            <div className="text-ivory text-sm font-medium">Drop an outfit photo here</div>
            <div className="text-muted text-xs mt-1">or click to browse</div>
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
          <div className="relative rounded-xl overflow-hidden">
            {result ? (
              <div className="flex gap-4">
                <div className="w-32 shrink-0">
                  <img src={imagePreview} alt="outfit" className="w-full rounded-xl object-cover aspect-[3/4]" />
                </div>
                <div className="flex-1 min-w-0">
                  <AnalysisResult text={result} />
                </div>
              </div>
            ) : (
              <div className="relative">
                <img src={imagePreview} alt="outfit preview" className="w-full max-h-80 object-contain rounded-xl bg-charcoal" />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(null); setResult(null) }}
                  className="absolute top-2 right-2 bg-black/60 text-ivory text-xs px-2 py-1 rounded-lg"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          {result && (
            <button
              onClick={() => { setImageFile(null); setImagePreview(null); setResult(null); setNotes('') }}
              className="mt-3 text-muted hover:text-ivory text-sm underline"
            >
              Analyze a different outfit
            </button>
          )}
        </div>
      )}

      {/* Notes field */}
      {!result && (
        <div className="mb-4">
          <textarea
            placeholder="Optional notes (e.g. 'this is for a job interview' or 'I'm wearing it to a concert')"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-charcoal border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm placeholder-muted focus:outline-none focus:border-gold/50 resize-none"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-rust/10 border border-rust/30 rounded-xl p-4 mb-4">
          <p className="text-rust text-sm">{error}</p>
        </div>
      )}

      {/* Analyze button */}
      {!result && (
        <button
          onClick={handleAnalyze}
          disabled={loading || !imageFile}
          className="w-full bg-gold hover:bg-gold/90 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
              Analyzing outfit…
            </>
          ) : (
            '◎ Analyze Outfit'
          )}
        </button>
      )}

      {/* Info box */}
      <div className="mt-6 bg-charcoal/60 border border-white/5 rounded-xl p-4">
        <p className="text-muted text-xs leading-relaxed">
          Analysis is tailored to Rachel's profile: petite hourglass, Deep/Dark Autumn colouring, Corporate Goth × Emo/Punk × Casual Dark aesthetic. Requires an Anthropic API key in Settings.
        </p>
      </div>
    </div>
  )
}
