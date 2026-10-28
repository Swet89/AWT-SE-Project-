import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import WeatherWidget from '../components/WeatherWidget.jsx'
import { DestinationSkeleton } from '../components/SkeletonCard.jsx'
import { showToast } from '../lib/toast.js'
import { API } from '../lib/api.js'

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function DestinationSearchForm({ initialValue }) {
  const [searchText, setSearchText] = useState(initialValue)
  const navigate = useNavigate()

  function handleSearch(event) {
    event.preventDefault()
    const term = searchText.trim()
    navigate(`/destinations${term ? `?q=${encodeURIComponent(term)}` : ''}`)
  }

  return (
    <form className="destination-search" onSubmit={handleSearch}>
      <label className="sr-only" htmlFor="destination-search">
        Search destinations
      </label>
      <input
        id="destination-search"
        type="search"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        placeholder="Search destinations e.g. 'Beach trip under ₹40,000 in December' or 'Jaipur'…"
      />
      <button type="submit" aria-label="Search destinations with AI">
        AI Search <span aria-hidden="true">✦</span>
      </button>
    </form>
  )
}

function DestinationCard({ place, isSaved, busyId, toggleFavorite, inr }) {
  const spots = place.famousSpots && place.famousSpots.length > 0
    ? place.famousSpots
    : (place.attractions || []).map((name) => ({ name, imageUrl: place.imageUrl }))

  const [activeSpotIndex, setActiveSpotIndex] = useState(0)
  const currentSpot = spots[activeSpotIndex] || { name: place.name, imageUrl: place.imageUrl }
  const displayImage = currentSpot.imageUrl || place.imageUrl

  const prevSpot = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveSpotIndex((curr) => (curr - 1 + spots.length) % spots.length)
  }

  const nextSpot = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveSpotIndex((curr) => (curr + 1) % spots.length)
  }

  return (
    <article className="destination-card" key={place._id}>
      <div className="destination-card-media">
        <img
          src={displayImage}
          alt={`${currentSpot.name || place.name} in ${place.name}`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Spot Tag Badge */}
        {spots.length > 0 && (
          <span className="destination-spot-badge">
            📍 {currentSpot.name || place.name}
          </span>
        )}

        {/* Spot navigation arrows if multiple spots exist */}
        {spots.length > 1 && (
          <>
            <button
              type="button"
              className="spot-arrow-btn spot-prev"
              onClick={prevSpot}
              aria-label="Previous famous spot"
            >
              ‹
            </button>
            <button
              type="button"
              className="spot-arrow-btn spot-next"
              onClick={nextSpot}
              aria-label="Next famous spot"
            >
              ›
            </button>
            <div className="spot-dot-nav">
              {spots.map((spot, idx) => (
                <button
                  type="button"
                  key={idx}
                  className={`spot-dot ${idx === activeSpotIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setActiveSpotIndex(idx)
                  }}
                  aria-label={`View spot ${idx + 1}: ${spot.name}`}
                  title={spot.name}
                />
              ))}
            </div>
          </>
        )}

        <button
          className={`favorite-button${isSaved ? ' is-saved' : ''}`}
          type="button"
          onClick={() => toggleFavorite(place)}
          disabled={busyId === place._id}
          aria-label={
            isSaved
              ? `Remove ${place.name} from saved destinations`
              : `Save ${place.name}`
          }
          aria-pressed={isSaved}
          title={isSaved ? 'Remove saved destination' : 'Save destination'}
        >
          {busyId === place._id ? '…' : isSaved ? '♥' : '♡'}
        </button>
      </div>

      <div className="destination-card-content">
        <div className="destination-card-header">
          <p className="destination-location">
            {place.state ? `${place.state}, ` : ''}
            {place.country}
          </p>

          <Link className="destination-rating" to={`/destinations/${place._id}#reviews`}>
            {place.reviewCount
              ? `★ ${place.averageRating} · ${place.reviewCount} review${place.reviewCount === 1 ? '' : 's'}`
              : '☆ No reviews yet'}
          </Link>

          <h2>
            <Link to={`/destinations/${place._id}`}>
              {place.name}
            </Link>
          </h2>
        </div>

        <div className="destination-card-body">
          <p className="destination-description">{place.description}</p>
        </div>

        <div className="destination-card-meta">
          <p className="destination-budget">
            From {inr.format(place.averageDailyBudgetINR)} / day
          </p>
          <p className="destination-season">
            Best time: {place.bestTimeToVisit}
          </p>

          {/* Famous Spots Interactive Chips */}
          {spots.length > 0 && (
            <div className="destination-spots-interactive">
              <span className="destination-spots-label">
                Famous Spots ({spots.length}):
              </span>
              <div className="destination-spots-pill-list">
                {spots.map((spot, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className={`destination-spot-pill ${idx === activeSpotIndex ? 'active' : ''}`}
                    onClick={() => setActiveSpotIndex(idx)}
                    title={spot.description || spot.name}
                  >
                    <span className="spot-bullet">✦</span>
                    {spot.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {place.matchReasons?.length > 0 && (
            <div className="destination-match-reasons">
              {place.matchReasons.map((reason, rIdx) => (
                <span key={rIdx} className="match-reason-badge">
                  ✓ {reason}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="destination-card-actions">
          <WeatherWidget destination={place} />
        </div>
      </div>
    </article>
  )
}

export default function Destinations() {
  const [destinations, setDestinations] = useState([])
  const [smartSearchResults, setSmartSearchResults] = useState(null)
  const [smartSearchIntent, setSmartSearchIntent] = useState(null)
  const [isSmartSearching, setIsSmartSearching] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState(() => new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favoriteError, setFavoriteError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [sortOrder, setSortOrder] = useState('name')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const currentQuery = searchParams.get('q') || ''
  const searchTerm = currentQuery.trim().toLowerCase()

  useEffect(() => {
    const controller = new AbortController()

    async function loadDestinations() {
      try {
        const response = await axios.get(`${API}/destinations`, {
          signal: controller.signal,
        })
        setDestinations(response.data)
      } catch {
        if (!controller.signal.aborted) {
          setError('Could not load destinations. Check that the backend is running.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadDestinations()
    return () => controller.abort()
  }, [])

  // Execute AI Smart Search when query looks like a natural language prompt (has spaces or keywords like 'under', 'in', 'trip')
  useEffect(() => {
    if (!currentQuery.trim()) {
      setSmartSearchResults(null)
      setSmartSearchIntent(null)
      return
    }

    const isNaturalLanguage =
      currentQuery.trim().split(/\s+/).length >= 2 ||
      /under|below|trip|beach|mountain|fort|december|january|october|budget|kerala|heritage/i.test(currentQuery)

    if (isNaturalLanguage) {
      const controller = new AbortController()
      setIsSmartSearching(true)

      axios
        .post(
          `${API}/destinations/smart-search`,
          { query: currentQuery },
          { signal: controller.signal }
        )
        .then((res) => {
          if (res.data.results && res.data.results.length > 0) {
            setSmartSearchResults(res.data.results)
            setSmartSearchIntent(res.data.parsedIntent)
          } else {
            setSmartSearchResults(null)
            setSmartSearchIntent(null)
          }
        })
        .catch(() => {
          // Fall back gracefully to client text match
          setSmartSearchResults(null)
          setSmartSearchIntent(null)
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSmartSearching(false)
        })

      return () => controller.abort()
    } else {
      setSmartSearchResults(null)
      setSmartSearchIntent(null)
    }
  }, [currentQuery])

  useEffect(() => {
    const token = sessionStorage.getItem('odysseyAccessToken')
    if (!token) return undefined

    const controller = new AbortController()

    async function loadFavorites() {
      try {
        const response = await axios.get(`${API}/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        setFavoriteIds(new Set(response.data.map((place) => String(place._id))))
      } catch {
        // Destination browsing still works if favorites cannot be loaded.
      }
    }

    loadFavorites()
    return () => controller.abort()
  }, [])

  const baseDestinations = smartSearchResults ? smartSearchResults : destinations
  const filteredDestinations = smartSearchResults
    ? smartSearchResults
    : destinations.filter((place) =>
        `${place.name} ${place.state || ''} ${place.country}`
          .toLowerCase()
          .includes(searchTerm),
      )
  const displayedDestinations = [...(smartSearchResults || filteredDestinations)].sort((first, second) => {
    switch (sortOrder) {
      case 'nameDesc':
        return second.name.localeCompare(first.name)
      case 'rating':
        return (
          (second.averageRating || 0) - (first.averageRating || 0) ||
          (second.reviewCount || 0) - (first.reviewCount || 0) ||
          first.name.localeCompare(second.name)
        )
      case 'budgetLow':
        return (
          (first.averageDailyBudgetINR || 0) - (second.averageDailyBudgetINR || 0) ||
          first.name.localeCompare(second.name)
        )
      case 'budgetHigh':
        return (
          (second.averageDailyBudgetINR || 0) - (first.averageDailyBudgetINR || 0) ||
          first.name.localeCompare(second.name)
        )
      case 'reviews':
        return (
          (second.reviewCount || 0) - (first.reviewCount || 0) ||
          (second.averageRating || 0) - (first.averageRating || 0) ||
          first.name.localeCompare(second.name)
        )
      case 'country':
        return (
          (first.country || '').localeCompare(second.country || '') ||
          (first.state || '').localeCompare(second.state || '') ||
          first.name.localeCompare(second.name)
        )
      case 'attractions':
        return (
          ((second.attractions?.length || 0) + (second.famousSpots?.length || 0)) -
          ((first.attractions?.length || 0) + (first.famousSpots?.length || 0)) ||
          first.name.localeCompare(second.name)
        )
      case 'newest':
        return (
          new Date(second.createdAt || 0) - new Date(first.createdAt || 0) ||
          first.name.localeCompare(second.name)
        )
      case 'name':
      default:
        return first.name.localeCompare(second.name)
    }
  })

  async function toggleFavorite(place) {
    const token = sessionStorage.getItem('odysseyAccessToken')

    if (!token) {
      navigate('/login')
      return
    }

    setFavoriteError('')
    setBusyId(place._id)

    try {
      const isSaved = favoriteIds.has(String(place._id))
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      }

      if (isSaved) {
        await axios.delete(`${API}/favorites/${place._id}`, config)
        setFavoriteIds((previous) => {
          const updated = new Set(previous)
          updated.delete(String(place._id))
          return updated
        })
        showToast(`${place.name} removed from saved destinations.`, 'info')
      } else {
        await axios.post(
          `${API}/favorites`,
          { destinationId: place._id },
          config,
        )
        setFavoriteIds((previous) => new Set(previous).add(String(place._id)))
        showToast(`${place.name} saved to your journeys.`)
      }
    } catch (requestError) {
      setFavoriteError(
        requestError.response?.data?.message ||
          'Could not update saved destinations. Please try again.',
      )
    } finally {
      setBusyId('')
    }
  }

  return (
    <main className="destinations-page">
      <header className="destinations-heading">
        <p className="eyebrow dark">CHOOSE YOUR NEXT CHAPTER</p>
        <h1>{searchTerm ? 'Search results' : 'Explore destinations'}</h1>
        <p>Find a place for your next great journey.</p>

        <DestinationSearchForm
          key={currentQuery}
          initialValue={currentQuery}
        />
        <label className="destination-sort-control">
          Sort by
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
            <option value="name">Name (A – Z)</option>
            <option value="nameDesc">Name (Z – A)</option>
            <option value="rating">Top rated</option>
            <option value="budgetLow">Budget: Low to High</option>
            <option value="budgetHigh">Budget: High to Low</option>
            <option value="reviews">Most reviewed</option>
            <option value="country">Country & Region</option>
            <option value="attractions">Most attractions & spots</option>
            <option value="newest">Newly added</option>
          </select>
        </label>

        {isSmartSearching && (
          <p style={{ marginTop: '0.75rem', fontStyle: 'italic', color: 'var(--gold, #b58b4a)' }}>
            ✨ Parsing intent and matching seasonal & budget filters…
          </p>
        )}

        {smartSearchIntent && (
          <div
            style={{
              margin: '1.25rem auto 0',
              maxWidth: '680px',
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              background: 'var(--bg-muted, #faf8f5)',
              border: '1px solid var(--border, #e5ded3)',
              fontSize: '0.85rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--gold, #b58b4a)' }}>✨ AI FILTER PARSED:</span>
            {smartSearchIntent.tags?.length > 0 && (
              <span>Theme: <strong>{smartSearchIntent.tags.join(', ')}</strong></span>
            )}
            {smartSearchIntent.maxBudget && (
              <span>Target Budget: <strong>≤ ₹{smartSearchIntent.maxBudget.toLocaleString('en-IN')}</strong></span>
            )}
            {smartSearchIntent.targetMonth && (
              <span>Season: <strong>{smartSearchIntent.targetMonth.toUpperCase()}</strong></span>
            )}
            <button
              type="button"
              onClick={() => navigate('/destinations')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #777)',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </header>

      {loading && (
        <section className="destination-grid" aria-label="Loading destinations" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => <DestinationSkeleton key={index} />)}
        </section>
      )}

      {!loading && error && (
        <p className="page-message error-message" role="alert">
          {error}
        </p>
      )}

      {favoriteError && (
        <p className="page-message error-message" role="alert">
          {favoriteError}
        </p>
      )}

      {!loading && !error && filteredDestinations.length === 0 && (
        <p className="page-message">
          {searchTerm
            ? `No destinations found for “${currentQuery}”.`
            : 'No destinations yet.'}
        </p>
      )}

      {!loading && !error && filteredDestinations.length > 0 && (
        <section className="destination-grid" aria-label="Destinations">
          {displayedDestinations.map((place) => (
            <DestinationCard
              key={place._id}
              place={place}
              isSaved={favoriteIds.has(String(place._id))}
              busyId={busyId}
              toggleFavorite={toggleFavorite}
              inr={inr}
            />
          ))}
        </section>
      )}
    </main>
  )
}
