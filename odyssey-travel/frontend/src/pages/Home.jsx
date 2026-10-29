import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { DestinationSkeleton } from '../components/SkeletonCard.jsx'
import { API } from '../lib/api.js'
import DestinationPreviewCard from '../components/DestinationPreviewCard.jsx'

const Interactive3DEarth = lazy(() => import('../components/Interactive3DEarth.jsx'))

export default function Home() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const [destinations, setDestinations] = useState(() => {
    try {
      const cached = sessionStorage.getItem('odysseyCachedDestinations')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [destinationsLoading, setDestinationsLoading] = useState(() => {
    try {
      const cached = sessionStorage.getItem('odysseyCachedDestinations')
      return !cached || JSON.parse(cached).length === 0
    } catch {
      return true
    }
  })
  const [destinationsError, setDestinationsError] = useState('')
  const [selectedDestination, setSelectedDestination] = useState(null)
  const destinationRailRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const controller = new AbortController()

    axios.get(`${API}/destinations`, { signal: controller.signal })
      .then((response) => {
        setDestinations(response.data)
        setDestinationsError('')
        try {
          sessionStorage.setItem('odysseyCachedDestinations', JSON.stringify(response.data))
        } catch {}
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          try {
            const cached = sessionStorage.getItem('odysseyCachedDestinations')
            if (cached && JSON.parse(cached).length > 0) {
              setDestinations(JSON.parse(cached))
              setDestinationsError('')
              return
            }
          } catch {}
          setDestinationsError('Destinations are temporarily unavailable.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDestinationsLoading(false)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const counters = document.querySelectorAll('[data-count-to]')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const element = entry.target
        const target = Number(element.dataset.countTo)
        if (reducedMotion) {
          element.textContent = String(target)
        } else {
          const start = performance.now()
          const duration = 950
          const animate = (now) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - ((1 - progress) ** 3)
            element.textContent = String(Math.round(target * eased))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
        observer.unobserve(element)
      })
    }, { threshold: 0.5 })

    counters.forEach((counter) => observer.observe(counter))
    return () => observer.disconnect()
  }, [destinations.length])

  useEffect(() => {
    const searchTerm = query.trim()

    if (searchTerm.length < 2) {
      return undefined
    }

    const controller = new AbortController()

    const timer = setTimeout(async () => {
      setSearching(true)

      try {
        const response = await axios.get(
          `${API}/places/autocomplete`,
          {
            params: { q: searchTerm },
            signal: controller.signal,
          },
        )

        setSuggestions(response.data)
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false)
        }
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  function openResults(searchText = query) {
    const term = searchText.trim()
    navigate(`/destinations${term ? `?q=${encodeURIComponent(term)}` : ''}`)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const activeSuggestion = suggestionsOpen ? suggestions[activeSuggestionIndex] : null
    openResults(activeSuggestion?.name || query)
    setSuggestionsOpen(false)
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'Escape') {
      setSuggestionsOpen(false)
      return
    }

    if (!suggestionsOpen || suggestions.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveSuggestionIndex((current) => (current + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveSuggestionIndex((current) => (current - 1 + suggestions.length) % suggestions.length)
    }
  }

  function moveDestinationRail(direction) {
    destinationRailRef.current?.scrollBy({
      left: direction * 360,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }

  return (
    <main className="home-page">
      <section className="home-hero" aria-label="Plan your next journey">
      <video
        className="home-wave-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=2200&q=85"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source
          src="https://videos.pexels.com/video-files/10512909/10512909-hd_1280_720_30fps.mp4"
          type="video/mp4"
        />
      </video>
      <div className="home-hero-overlay" aria-hidden="true" />

      {/* 3D Interactive Earth Stage */}
      <div
        className={`home-hero-globe-zone ${selectedDestination ? 'has-card-open' : ''}`}
        data-lenis-prevent="true"
      >
        <Suspense fallback={<div className="hero-globe-fallback" aria-hidden="true" />}>
          <Interactive3DEarth
            onSelectDestination={(dest) => setSelectedDestination(dest)}
            selectedDestinationId={selectedDestination?.id}
            isCardOpen={Boolean(selectedDestination)}
          />
        </Suspense>
      </div>

      <div className={`home-content ${selectedDestination ? 'has-card-open' : ''}`}>
        <p className="eyebrow" data-reveal>
          <span /> YOUR NEXT GREAT STORY BEGINS HERE
        </p>

        <h1 data-reveal>
          Find your way
          <br />
          <em>to wonder.</em>
        </h1>

        <p className="home-intro" data-reveal>
          Discover remarkable places and start planning a journey of your own.
        </p>

        <form className="home-search" data-reveal onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="place-search">
            Search destinations
          </label>

          <input
            id="place-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setSuggestions([])
              setSearching(false)
              setSuggestionsOpen(true)
              setActiveSuggestionIndex(0)
            }}
            onKeyDown={handleSearchKeyDown}
            aria-autocomplete="list"
            aria-controls="home-place-suggestions"
            aria-expanded={suggestionsOpen && query.trim().length >= 2}
            aria-activedescendant={suggestionsOpen && suggestions.length
              ? `place-suggestion-${activeSuggestionIndex}`
              : undefined}
            placeholder="Ask AI e.g. 'Beach trip under ₹40,000 in December' or search places…"
            autoComplete="off"
          />

          <button type="submit">
            Explore <span aria-hidden="true">→</span>
          </button>
        </form>

        {suggestionsOpen && query.trim().length >= 2 && (
          <div
            id="home-place-suggestions"
            className="search-suggestions"
            role="listbox"
            aria-label="Place suggestions"
            aria-live="polite"
          >
            {searching && <p className="suggestion-status">Searching…</p>}

            {!searching && suggestions.length === 0 && (
              <p className="suggestion-status">No matching destinations found.</p>
            )}

            {!searching &&
              suggestions.map((place, index) => (
                <button
                  type="button"
                  key={place._id}
                  id={`place-suggestion-${index}`}
                  role="option"
                  aria-selected={index === activeSuggestionIndex}
                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                  onClick={() => {
                    setSuggestionsOpen(false)
                    openResults(place.name)
                  }}
                >
                  <span>{place.name}</span>
                  <span>{place.state || place.country}</span>
                </button>
              ))}
          </div>
        )}

        <div className="hot-suggestions" data-reveal>
          <span>AI DISCOVERY PROMPTS</span>
          {['Beach trip under ₹40,000 in December', 'Mountain retreat under ₹25,000', 'Cultural heritage in Rajasthan', 'Monsoon escapes in Kerala'].map((prompt) => (
            <button
              type="button"
              key={prompt}
              onClick={() => openResults(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="hero-cta-actions" data-reveal>
          <Link to="/destinations" className="hero-cta-pill primary">
            Explore All Destinations <span aria-hidden="true">→</span>
          </Link>
          <Link to="/wayfinder" className="hero-cta-pill secondary">
            Plan with Wayfinder AI ✦
          </Link>
        </div>
      </div>

      {/* Destination Preview Card Overlay (Rendered as hero overlay to eliminate stacking collisions) */}
      {selectedDestination && (
        <DestinationPreviewCard
          destination={selectedDestination}
          onClose={() => setSelectedDestination(null)}
        />
      )}
      </section>

      <div className="travel-marquee" aria-label="Explore India and the world">
        <div className="travel-marquee-track" aria-hidden="true">
          <span>GOA ✦ ATHENS ✦ JAIPUR ✦ SANTORINI ✦ MUNNAR ✦ BALI ✦</span>
          <span>GOA ✦ ATHENS ✦ JAIPUR ✦ SANTORINI ✦ MUNNAR ✦ BALI ✦</span>
        </div>
      </div>

      <section className="home-discover-section" aria-labelledby="home-discover-title">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow dark">A WORLD OF POSSIBILITIES</p>
            <h2 id="home-discover-title">Find your next chapter</h2>
            <p>Handpicked places to begin a journey worth remembering.</p>
          </div>
          <div className="home-section-actions">
            <button type="button" onClick={() => moveDestinationRail(-1)} aria-label="Scroll destinations left">←</button>
            <button type="button" onClick={() => moveDestinationRail(1)} aria-label="Scroll destinations right">→</button>
            <Link to="/destinations">All destinations <span aria-hidden="true">↗</span></Link>
          </div>
        </div>

        {destinationsLoading && (
          <div className="home-destination-rail" aria-label="Loading featured destinations" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => <DestinationSkeleton key={index} />)}
          </div>
        )}
        {!destinationsLoading && destinationsError && <p className="home-section-status" role="status">{destinationsError} You can still explore the full collection.</p>}
        {!destinationsLoading && !destinationsError && destinations.length === 0 && (
          <p className="home-section-status">No destinations are available yet. Visit Explore destinations to check again.</p>
        )}
        {destinations.length > 0 && (
          <div className="home-destination-rail" ref={destinationRailRef} role="region" aria-label="Featured destinations" tabIndex={0}>
            {destinations.slice(0, 10).map((place) => (
              <Link className="home-destination-card" key={place._id} to={`/destinations/${place._id}`}>
                <img src={place.imageUrl} alt={`View of ${place.name}`} loading="lazy" referrerPolicy="no-referrer" />
                <span className="home-destination-location">{place.state || place.country}</span>
                <h3>{place.name}</h3>
                <span className="home-destination-budget">
                  From ₹{new Intl.NumberFormat('en-IN').format(place.averageDailyBudgetINR || 0)} / day
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="home-features-section" aria-labelledby="home-features-title">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow dark">EVERYTHING IN ONE ODYSSEY</p>
            <h2 id="home-features-title">Plan with confidence</h2>
          </div>
        </div>
        <div className="home-feature-bento">
          <Link className="home-feature-card feature-search" data-reveal to="/search/flights">
            <span>01 / Compare</span>
            <h3>Find the way there</h3>
            <p>Compare flights, trains, buses, stays, and more with prices in rupees.</p>
            <b aria-hidden="true">↗</b>
          </Link>
          <Link className="home-feature-card feature-wayfinder" data-reveal to="/wayfinder">
            <span>02 / Imagine</span>
            <h3>Your days, thoughtfully planned</h3>
            <p>Build a day-by-day itinerary around your pace, budget, and interests.</p>
            <b aria-hidden="true">↗</b>
          </Link>
          <Link className="home-feature-card feature-weather" data-reveal to="/destinations">
            <span>03 / Prepare</span>
            <h3>Know before you go</h3>
            <p>Check local weather and seasonal details before settling on a destination.</p>
            <b aria-hidden="true">↗</b>
          </Link>
          <Link className="home-feature-card feature-journeys" data-reveal to="/journeys">
            <span>04 / Keep</span>
            <h3>All your journeys, together</h3>
            <p>Save places and keep booking requests close at hand.</p>
            <b aria-hidden="true">↗</b>
          </Link>
        </div>
      </section>

      <section className="home-stats-section" aria-label="Odyssey Travel at a glance">
        <div>
          <strong><span data-count-to={destinations.length}>{destinations.length ? 0 : 0}</span><i>+</i></strong>
          <p>destinations to discover</p>
        </div>
        <div>
          <strong><span data-count-to="7">0</span></strong>
          <p>ways to travel and stay</p>
        </div>
        <div>
          <strong><span data-count-to="4">0</span></strong>
          <p>tools for a smoother trip</p>
        </div>
      </section>
    </main>
  )
}
