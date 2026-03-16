import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const WEATHER_CODES = {
  0: { label: 'Clear', icon: '☀️' },
  1: { label: 'Mostly Clear', icon: '🌤️' },
  2: { label: 'Partly Cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Icy Fog', icon: '🌫️' },
  51: { label: 'Light Drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy Drizzle', icon: '🌧️' },
  61: { label: 'Light Rain', icon: '🌧️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy Rain', icon: '🌧️' },
  71: { label: 'Light Snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '❄️' },
  75: { label: 'Heavy Snow', icon: '❄️' },
  80: { label: 'Rain Showers', icon: '🌦️' },
  85: { label: 'Snow Showers', icon: '🌨️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
}

function getWeatherInfo(code) {
  return WEATHER_CODES[code] || { label: 'Unknown', icon: '🌡️' }
}

function celsiusToFahrenheit(c) {
  return Math.round(c * 9/5 + 32)
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getWeatherTier(tempF) {
  if (tempF < 40) return 'cold'
  if (tempF < 60) return 'cool'
  if (tempF < 75) return 'warm'
  return 'hot'
}

function formatForecastDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const MOODS = ['Corporate Goth', 'Emo/Punk', 'Casual Dark', 'Surprise Me']

function getStyleTip(tier, mood) {
  const tips = {
    cold: {
      'Corporate Goth': 'Layer structured wool coats over fitted turtlenecks. Add a statement belt to define your waist over bulkier pieces. Dark opaque tights complete the look.',
      'Emo/Punk': 'Fishnet layers under chunky knits add texture. Platform boots add height and warmth. Pin detailing on outerwear elevates the look.',
      'Casual Dark': 'Oversized dark puffer with sleek bottoms for balance. Keep silhouette intentional — bulk on top, slim on bottom.',
      'Surprise Me': 'This is the season for velvet. A deep plum or forest green velvet piece anchored by black basics creates effortless drama.',
    },
    cool: {
      'Corporate Goth': 'A structured blazer in black or charcoal anchors the look. Tuck everything for clean lines — high waisted trousers and a fitted blouse.',
      'Emo/Punk': 'Moto jacket season. Pair with high-waisted jeans, fishnet tights, and ankle boots for the quintessential look.',
      'Casual Dark': 'Dark wash high-waisted jeans, a cropped knit, and block heel boots. Simple and polished.',
      'Surprise Me': 'A longline cardigan in caramel or deep rust over black basics elongates your frame beautifully.',
    },
    warm: {
      'Corporate Goth': 'Fitted midi skirt with a tucked blouse or corset top. Block heels keep the polish. A structured tote completes the office-goth vision.',
      'Emo/Punk': 'Black mini skirt with platform sneakers and a band tee tucked in. Accessories make this look — stack rings, chunky bracelets.',
      'Casual Dark': 'High-waisted shorts or a flowy midi in deep olive or rust. Keep the top fitted and tucked.',
      'Surprise Me': 'A deep burgundy A-line skirt with a fitted crop top in ivory or black. Your hourglass figure shines in this silhouette.',
    },
    hot: {
      'Corporate Goth': 'A sleeveless structured midi dress in black keeps the aesthetic without the heat. Mule heels are chic and comfortable.',
      'Emo/Punk': 'A black lace or mesh overlay top over a bandeau with high-waisted shorts. Platform sandals keep the edge.',
      'Casual Dark': 'A dark linen or cotton dress, loose but belted at the waist. Block heel sandals.',
      'Surprise Me': 'A slip dress in deep jewel tones — emerald, burgundy, or plum. Simple gold jewelry and strappy heels.',
    },
  }
  return tips[tier]?.[mood] || tips[tier]?.['Surprise Me'] || ''
}

function pickOutfit(clothes, tempF, mood) {
  const tier = getWeatherTier(tempF)
  const isWarm = tempF >= 60

  const filter = (cats, preferredSeasons) => {
    return clothes.filter(c => {
      const catMatch = cats.includes(c.category)
      if (!catMatch) return false
      if (preferredSeasons && c.season && c.season !== 'All') {
        return preferredSeasons.includes(c.season)
      }
      return true
    })
  }

  const seasonPref = isWarm ? ['Spring/Summer', 'All'] : ['Fall/Winter', 'All']

  // Try to get category items, fall back to all items in that category if seasonal filter empty
  const getItems = (cats) => {
    const seasonal = filter(cats, seasonPref)
    if (seasonal.length > 0) return seasonal
    return clothes.filter(c => cats.includes(c.category))
  }

  const tops = getItems(['Tops', 'Sweaters'])
  const bottoms = getItems(['Bottoms', 'Skirts'])
  const dresses = getItems(['Dresses/Jumpsuits'])
  const boots = getItems(['Boots'])
  const heels = getItems(['Heels'])
  const sneakers = getItems(['Sneakers'])
  const sandals = getItems(['Sandals'])
  const outerwear = getItems(['Outerwear'])
  const accessories = clothes.filter(c => c.category === 'Accessories')

  const pick = (arr) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null
  const maybe = (arr, chance = 0.6) => Math.random() < chance ? pick(arr) : null

  let selected = []

  // Decide top/bottom or dress
  const useDress = dresses.length > 0 && (tops.length === 0 || Math.random() < 0.3)

  if (useDress) {
    const dress = pick(dresses)
    if (dress) selected.push(dress)
  } else {
    const top = pick(tops)
    if (top) selected.push(top)
    const bottom = pick(bottoms)
    if (bottom) selected.push(bottom)
  }

  // Shoes based on tier
  let shoe = null
  if (tier === 'cold') {
    shoe = pick(boots) || pick(heels) || pick(sneakers)
  } else if (tier === 'cool') {
    shoe = pick([...boots, ...heels]) || pick(sneakers)
  } else if (tier === 'warm') {
    shoe = pick([...heels, ...sneakers]) || pick(boots)
  } else {
    shoe = pick([...sandals, ...heels]) || pick(sneakers)
  }
  if (shoe) selected.push(shoe)

  // Outerwear if cold/cool
  if (tier === 'cold' || tier === 'cool') {
    const outer = maybe(outerwear, tier === 'cold' ? 0.9 : 0.6)
    if (outer) selected.push(outer)
  }

  // Accessory
  const acc = maybe(accessories, 0.5)
  if (acc) selected.push(acc)

  return selected.filter(Boolean)
}

export default function Today() {
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [loadingWeather, setLoadingWeather] = useState(true)
  const [mood, setMood] = useState('Corporate Goth')
  const [outfit, setOutfit] = useState([])
  const [allClothes, setAllClothes] = useState([])
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState(null)
  const [logging, setLogging] = useState(false)

  useEffect(() => {
    fetchWeather()
    fetchClothes()
  }, [])

  async function fetchWeather() {
    try {
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=40.3916&longitude=-111.8508&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=fahrenheit&forecast_days=4&timezone=America%2FDenver'
      )
      const data = await res.json()
      const current = data.current
      const daily = data.daily
      setWeather({
        tempF: Math.round(current.temperature_2m),
        code: current.weather_code,
      })
      const fc = daily.time.map((date, i) => ({
        date,
        highF: Math.round(daily.temperature_2m_max[i]),
        lowF: Math.round(daily.temperature_2m_min[i]),
        code: daily.weather_code[i],
      }))
      setForecast(fc)
    } catch (e) {
      setWeather({ tempF: 65, code: 1 })
    } finally {
      setLoadingWeather(false)
    }
  }

  async function fetchClothes() {
    const { data } = await supabase.from('clothes').select('*')
    setAllClothes(data || [])
  }

  function handleGenerate() {
    setGenerating(true)
    setTimeout(() => {
      const selected = pickOutfit(allClothes, weather?.tempF ?? 65, mood)
      setOutfit(selected)
      setGenerating(false)
    }, 300)
  }

  async function handleWear() {
    if (outfit.length === 0) return
    setLogging(true)
    try {
      const { error } = await supabase.from('outfit_history').insert([{
        date: new Date().toISOString().split('T')[0],
        weather_temp: weather?.tempF,
        weather_condition: getWeatherInfo(weather?.code || 0).label,
        mood,
        outfit_items: outfit.map(item => ({ id: item.id, name: item.name, category: item.category })),
      }])

      if (!error) {
        // Increment wear count for each item
        for (const item of outfit) {
          await supabase
            .from('clothes')
            .update({ times_worn: (item.times_worn || 0) + 1 })
            .eq('id', item.id)
        }
        showToast('Outfit logged! Wear it well. ✨')
      } else {
        showToast('Error logging outfit. Check Supabase tables.')
      }
    } catch (e) {
      showToast('Error logging outfit.')
    } finally {
      setLogging(false)
    }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const tier = getWeatherTier(weather?.tempF ?? 65)
  const weatherInfo = getWeatherInfo(weather?.code ?? 0)
  const styleTip = getStyleTip(tier, mood)

  const tierColors = {
    cold: 'text-blue-300',
    cool: 'text-sky-300',
    warm: 'text-amber-300',
    hot: 'text-orange-400',
  }

  const CATEGORY_COLORS = {
    Tops: 'bg-rust/80',
    Sweaters: 'bg-rust/60',
    Bottoms: 'bg-moss/80',
    Skirts: 'bg-moss/60',
    'Dresses/Jumpsuits': 'bg-rust/70',
    Outerwear: 'bg-muted/60',
    Boots: 'bg-gold/40',
    Heels: 'bg-gold/50',
    Sneakers: 'bg-gold/30',
    Sandals: 'bg-gold/20',
    Accessories: 'bg-muted/40',
  }

  return (
    <div className="min-h-screen bg-ink text-ivory px-4 pt-6 pb-28 md:pt-20 md:pb-10 max-w-2xl mx-auto fade-up">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-charcoal border border-gold/40 text-ivory px-6 py-3 rounded-xl shadow-xl text-sm fade-up">
          {toast}
        </div>
      )}

      {/* Greeting */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ivory mb-1">{getGreeting()}, Rachel</h1>
        <p className="text-muted text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Weather */}
      <div className="bg-charcoal rounded-xl p-4 mb-6 border border-white/5">
        {loadingWeather ? (
          <div className="text-muted text-sm">Loading weather…</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{weatherInfo.icon}</span>
                <div>
                  <div className="text-2xl font-semibold text-ivory">{weather?.tempF}°F</div>
                  <div className={`text-sm font-medium ${tierColors[tier]}`}>
                    {weatherInfo.label} · {tier.charAt(0).toUpperCase() + tier.slice(1)} day
                  </div>
                  <div className="text-xs text-muted">Lehi, Utah</div>
                </div>
              </div>
            </div>
            {/* 4-day forecast */}
            <div className="grid grid-cols-4 gap-2">
              {forecast.slice(0, 4).map((day, i) => {
                const fc = getWeatherInfo(day.code)
                return (
                  <div key={i} className="text-center bg-ink/40 rounded-lg p-2">
                    <div className="text-xs text-muted mb-1">
                      {i === 0 ? 'Today' : new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-xl mb-1">{fc.icon}</div>
                    <div className="text-xs text-ivory">{day.highF}°</div>
                    <div className="text-xs text-muted">{day.lowF}°</div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Mood Selector */}
      <div className="mb-6">
        <h2 className="font-serif text-lg text-ivory mb-3">Today's Mood</h2>
        <div className="flex flex-wrap gap-2">
          {MOODS.map(m => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                mood === m
                  ? 'bg-gold text-white border-gold'
                  : 'border-white/10 text-muted hover:text-ivory hover:border-white/30'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating || loadingWeather}
        className="w-full bg-gold hover:bg-gold/90 text-white font-semibold py-3 rounded-xl mb-6 transition-all duration-200 disabled:opacity-50"
      >
        {generating ? 'Generating…' : '✦ Generate Outfit'}
      </button>

      {/* Outfit Display */}
      {outfit.length > 0 && (
        <div className="fade-up mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-xl text-ivory">Today's Outfit</h2>
            <button
              onClick={handleGenerate}
              className="text-muted hover:text-gold text-sm transition-colors duration-200"
            >
              ↺ Shuffle
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {outfit.map((item, i) => (
              <div key={item.id || i} className="bg-charcoal rounded-xl overflow-hidden border border-white/5">
                <div className="aspect-[3/4] bg-ink/60 relative flex items-center justify-center">
                  {item.photo_url ? (
                    <img
                      src={item.photo_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-serif text-gold/40">
                      {item.category?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-ivory text-sm font-medium leading-tight mb-1">{item.name}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full text-ivory/80 ${CATEGORY_COLORS[item.category] || 'bg-muted/40'}`}>
                    {item.category}
                  </span>
                  {item.color && (
                    <div className="text-muted text-xs mt-1">{item.color}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Why This Works */}
          <div className="bg-charcoal/60 border border-gold/20 rounded-xl p-4 mb-4">
            <h3 className="font-serif text-gold text-base mb-2">Why This Works</h3>
            <p className="text-muted text-sm leading-relaxed">{styleTip}</p>
          </div>

          {/* Wear This Button */}
          <button
            onClick={handleWear}
            disabled={logging}
            className="w-full bg-rust hover:bg-rust/90 text-ivory font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            {logging ? 'Logging…' : '✓ Wear This Outfit'}
          </button>
        </div>
      )}

      {outfit.length === 0 && !generating && allClothes.length === 0 && (
        <div className="text-center text-muted text-sm py-8">
          <p className="mb-2">Your closet is empty.</p>
          <p>Head to the Closet tab to add your clothes.</p>
        </div>
      )}

      {outfit.length === 0 && !generating && allClothes.length > 0 && (
        <div className="text-center text-muted text-sm py-8">
          <p>Choose your mood and hit Generate Outfit.</p>
        </div>
      )}

      {/* Fashion Tips by Tier */}
      <div className="mt-6 border-t border-white/5 pt-6">
        <h3 className="font-serif text-base text-gold mb-3">
          {tier === 'cold' && '❄️ Cold Day Dressing'}
          {tier === 'cool' && '🍂 Cool Day Dressing'}
          {tier === 'warm' && '🌿 Warm Day Dressing'}
          {tier === 'hot' && '☀️ Hot Day Dressing'}
        </h3>
        <div className="space-y-2 text-sm text-muted">
          {tier === 'cold' && (
            <>
              <p>• Layer for warmth without bulk — fitted base layers under structured coats</p>
              <p>• Tall boots keep you warm and elongate your legs beautifully</p>
              <p>• Define your waist with a belt over long cardigans or coats</p>
            </>
          )}
          {tier === 'cool' && (
            <>
              <p>• This is transitional dressing — moto jackets and structured blazers shine</p>
              <p>• Ankle boots are your best friend in this temperature range</p>
              <p>• A cropped top tucked into high-waisted bottoms defines your silhouette</p>
            </>
          )}
          {tier === 'warm' && (
            <>
              <p>• A-line midi skirts or fitted trousers with a tucked blouse is perfect for this temp</p>
              <p>• Block heels offer comfort without sacrificing height</p>
              <p>• Rich jewel tones work year-round for your Deep Autumn coloring</p>
            </>
          )}
          {tier === 'hot' && (
            <>
              <p>• Sleeveless midi dresses keep you cool while maintaining elegance</p>
              <p>• Linen and cotton-modal blends breathe well in heat</p>
              <p>• Simple accessories pop against minimal summer outfits</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
