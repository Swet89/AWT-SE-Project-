import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import WeatherWidget from '../components/WeatherWidget.jsx'
import { DestinationSkeleton } from '../components/SkeletonCard.jsx'
import { showToast } from '../lib/toast.js'

const API = 'http://localhost:5000/api'

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
        placeholder="Search destinations"
      />
      <button type="submit">Search</button>
    </form>
  )
}

export default function Destinations() {
  const [destinations, setDestinations] = useState([])
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

  const filteredDestinations = destinations.filter((place) =>
    `${place.name} ${place.state || ''} ${place.country}`
      .toLowerCase()
      .includes(searchTerm),
  )
  const displayedDestinations = [...filteredDestinations].sort((first, second) => {
    if (sortOrder === 'rating') {
      return (second.averageRating || 0) - (first.averageRating || 0) ||
        (second.reviewCount || 0) - (first.reviewCount || 0) ||
        first.name.localeCompare(second.name)
    }
    return first.name.localeCompare(second.name)
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
            <option value="name">Name</option>
            <option value="rating">Top rated</option>
          </select>
        </label>
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
          {displayedDestinations.map((place) => {
            const isSaved = favoriteIds.has(String(place._id))

            return (
              <article className="destination-card" data-reveal key={place._id}>
                <img
                  src={place.imageUrl}
                  alt={`View of ${place.name}`}
                  loading="lazy"
                />

                <div className="destination-card-content">
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

                  <p className="destination-description">{place.description}</p>
                  <p className="destination-budget">
                    From {inr.format(place.averageDailyBudgetINR)} / day
                  </p>
                  <p className="destination-season">
                    Best time: {place.bestTimeToVisit}
                  </p>

                  {place.attractions?.length > 0 && (
                    <p className="destination-season">
                      Top attractions: {place.attractions.join(', ')}
                    </p>
                  )}

                  <WeatherWidget destination={place} />
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
