import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import WeatherWidget from '../components/WeatherWidget.jsx'
import AiTravelConcierge from '../components/AiTravelConcierge.jsx'
import { API } from '../lib/api.js'

export default function DestinationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [destination, setDestination] = useState(null)
  const [relatedDestinations, setRelatedDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [favoriteError, setFavoriteError] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [tripDays, setTripDays] = useState(3)
  const [travelers, setTravelers] = useState(1)
  const [reviewData, setReviewData] = useState({ reviews: [], averageRating: null, count: 0 })
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [savingReview, setSavingReview] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')
  const [reviewError, setReviewError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadDestination() {
      try {
        const response = await axios.get(`${API}/destinations/${id}`, {
          signal: controller.signal,
        })
        setDestination(response.data)
      } catch {
        if (!controller.signal.aborted) {
          setError('Could not load this destination.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadDestination()
    return () => controller.abort()
  }, [id])

  useEffect(() => {
    if (!destination) return undefined

    const controller = new AbortController()

    async function loadRelatedDestinations() {
      try {
        const response = await axios.get(`${API}/destinations`, {
          signal: controller.signal,
        })

        const otherDestinations = response.data.filter(
          (place) => String(place._id) !== String(destination._id),
        )

        const sameCountry = otherDestinations.filter(
          (place) => place.country === destination.country,
        )

        setRelatedDestinations(
          (sameCountry.length ? sameCountry : otherDestinations).slice(0, 3),
        )
      } catch {
        // The destination details page still works if related places cannot load.
      }
    }

    loadRelatedDestinations()
    return () => controller.abort()
  }, [destination])

  useEffect(() => {
    const controller = new AbortController()

    async function loadReviews() {
      try {
        const response = await axios.get(`${API}/reviews/${id}`, {
          signal: controller.signal,
        })
        setReviewData(response.data)

        const storedUser = JSON.parse(sessionStorage.getItem('odysseyUser') || 'null')
        const myReview = response.data.reviews.find(
          (review) => String(review.user?._id) === String(storedUser?.id),
        )
        if (myReview) {
          setReviewRating(myReview.rating)
          setReviewComment(myReview.comment)
        }
      } catch {
        // Destination details remain available if the reviews service is unavailable.
      }
    }

    loadReviews()
    return () => controller.abort()
  }, [id])

  useEffect(() => {
    const token = sessionStorage.getItem('odysseyAccessToken')
    if (!token) return undefined

    const controller = new AbortController()

    async function loadSavedStatus() {
      try {
        const response = await axios.get(`${API}/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        setIsSaved(
          response.data.some((place) => String(place._id) === String(id)),
        )
      } catch {
        // The destination page still works if saved status cannot be loaded.
      }
    }

    loadSavedStatus()
    return () => controller.abort()
  }, [id])

  async function toggleSaved() {
    const token = sessionStorage.getItem('odysseyAccessToken')

    if (!token) {
      navigate('/login')
      return
    }

    setFavoriteError('')
    setSaving(true)

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      }

      if (isSaved) {
        await axios.delete(`${API}/favorites/${id}`, config)
        setIsSaved(false)
      } else {
        await axios.post(`${API}/favorites`, { destinationId: id }, config)
        setIsSaved(true)
      }
    } catch (requestError) {
      setFavoriteError(
        requestError.response?.data?.message ||
          'Could not update saved destinations. Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function submitReview(event) {
    event.preventDefault()
    const token = sessionStorage.getItem('odysseyAccessToken')
    if (!token) {
      navigate('/login')
      return
    }

    setSavingReview(true)
    setReviewError('')
    setReviewMessage('')
    try {
      const response = await axios.put(
        `${API}/reviews/${id}`,
        { rating: reviewRating, comment: reviewComment },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setReviewMessage(response.data.message)
      const updated = await axios.get(`${API}/reviews/${id}`)
      setReviewData(updated.data)
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('odysseyAccessToken')
        sessionStorage.removeItem('odysseyUser')
          window.dispatchEvent(new Event('odyssey-auth-change'))
        navigate('/login', { replace: true })
        return
      }
      setReviewError(requestError.response?.data?.message || 'Could not save your review.')
    } finally {
      setSavingReview(false)
    }
  }

  async function shareDestination() {
    setShareMessage('')

    try {
      if (navigator.share) {
        await navigator.share({
          title: destination.name,
          text: `Explore ${destination.name} with Odyssey Travel`,
          url: window.location.href,
        })
        setShareMessage('Destination shared.')
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setShareMessage('Link copied to clipboard.')
      }
    } catch (shareError) {
      if (shareError.name !== 'AbortError') {
        setShareMessage(
          'Could not share. You can copy the page link from your browser address bar.',
        )
      }
    }
  }

  if (loading) {
    return <main className="page-shell">Loading destination…</main>
  }

  if (error) {
    return <main className="page-shell">{error}</main>
  }

  if (!destination) {
    return <main className="page-shell">Destination not found.</main>
  }

  const searchUrl = `/search/flights?to=${encodeURIComponent(destination.name)}`
  const coordinates = destination.coordinates
  const hasCoordinates =
    coordinates?.latitude != null && coordinates?.longitude != null

  const dailyBudget = Number(destination.averageDailyBudgetINR || 0)
  const estimatedTripCost =
    dailyBudget * Number(tripDays) * Number(travelers)

  const formattedTripCost = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(estimatedTripCost)

  return (
    <main className="page-shell destination-details">
      <Link to="/destinations">← Back to destinations</Link>

      <img
        className="destination-details-image"
        src={destination.imageUrl}
        alt={destination.name}
        referrerPolicy="no-referrer"
      />
      {destination.photoCredit && (
        <p className="destination-photo-credit">
          Photo:{' '}
          <a href={destination.photoSourceUrl || destination.wikipediaUrl} target="_blank" rel="noreferrer">
            {destination.photoCredit}
          </a>
        </p>
      )}

      <p className="eyebrow">
        {[destination.state, destination.country].filter(Boolean).join(', ')}
      </p>

      <h1>{destination.name}</h1>
      <p>{destination.description}</p>

      {(destination.nearestAirport || destination.nearestRailwayStation) && (
        <section className="destination-arrival-info">
          <h2>Getting there</h2>
          {destination.nearestAirport && <p><strong>Nearest airport:</strong> {destination.nearestAirport}</p>}
          {destination.nearestRailwayStation && <p><strong>Nearest railway:</strong> {destination.nearestRailwayStation}</p>}
        </section>
      )}

      <section className="destination-reviews" id="reviews">
        <div className="destination-reviews-heading">
          <div>
            <h2>Traveler reviews</h2>
            <p>
              {reviewData.count
                ? `★ ${reviewData.averageRating} average from ${reviewData.count} review${reviewData.count === 1 ? '' : 's'}`
                : 'Be the first to review this destination.'}
            </p>
          </div>
        </div>

        <form className="destination-review-form" onSubmit={submitReview}>
          <label>Your rating</label>
          <div className="review-star-picker" role="group" aria-label="Choose a star rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={star <= reviewRating ? 'review-star selected' : 'review-star'}
                aria-label={`${star} star${star === 1 ? '' : 's'}`}
                aria-pressed={reviewRating === star}
                onClick={() => setReviewRating(star)}
              >
                ★
              </button>
            ))}
          </div>
          <label htmlFor="destination-review-comment">Your review</label>
          <textarea
            id="destination-review-comment"
            minLength="5"
            maxLength="1000"
            rows="4"
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            placeholder="Share what you liked about this place…"
            required
          />
          {reviewError && <p className="error-message" role="alert">{reviewError}</p>}
          {reviewMessage && <p className="wayfinder-message" role="status">{reviewMessage}</p>}
          <button type="submit" disabled={savingReview}>
            {savingReview ? 'Saving…' : 'Save review'}
          </button>
          {!sessionStorage.getItem('odysseyAccessToken') && (
            <small>Sign in to post or update your review.</small>
          )}
        </form>

        <div className="destination-review-list">
          {reviewData.reviews.map((review) => (
            <article className="destination-review-card" key={review._id}>
              <div>
                <strong>{review.user?.name || 'Traveler'}</strong>
                <span className="review-stars" aria-label={`${review.rating} out of 5 stars`}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </span>
              </div>
              <p>{review.comment}</p>
              <small>{new Date(review.createdAt).toLocaleDateString('en-IN')}</small>
            </article>
          ))}
        </div>
      </section>

      <h2>Best time to visit</h2>
      <p>
        {destination.bestTimeToVisit ||
          'Check local conditions before travelling.'}
      </p>

      <h2>Famous spots to explore</h2>
      {destination.famousSpots?.length > 0 ? (
        <div className="destination-spots-gallery">
          {destination.famousSpots.map((spot, idx) => (
            <div key={idx} className="spot-gallery-card">
              <div className="spot-gallery-image-wrap">
                <img src={spot.imageUrl} alt={spot.name} loading="lazy" referrerPolicy="no-referrer" />
                <span className="spot-number-tag">Spot {idx + 1}</span>
              </div>
              <div className="spot-gallery-info">
                <h3>{spot.name}</h3>
                <p>{spot.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="destination-attraction-fallback-list">
          {(destination.attractions || []).map((attraction) => (
            <li key={attraction}>{attraction}</li>
          ))}
        </ul>
      )}

      <p>
        Estimated daily budget: ₹
        {Number(destination.averageDailyBudgetINR || 0).toLocaleString('en-IN')}
      </p>

      <section className="trip-budget-calculator">
        <h2>Estimate your trip budget</h2>

        <div className="trip-budget-fields">
          <label>
            Number of days
            <input
              type="number"
              min="1"
              max="30"
              value={tripDays}
              onChange={(event) => setTripDays(event.target.value)}
            />
          </label>

          <label>
            Number of travelers
            <input
              type="number"
              min="1"
              max="10"
              value={travelers}
              onChange={(event) => setTravelers(event.target.value)}
            />
          </label>
        </div>

        <p>
          Estimated destination budget: <strong>{formattedTripCost}</strong>
        </p>
        <small>
          This estimate uses the destination’s average daily budget. Transport
          and booking costs may be extra.
        </small>
      </section>

      <h2>Weather</h2>
      <WeatherWidget destination={destination} />

      {favoriteError && (
        <p className="error-message" role="alert">
          {favoriteError}
        </p>
      )}

      <div className="destination-details-actions">
        <button
          className="detail-favorite-button"
          type="button"
          onClick={toggleSaved}
          disabled={saving}
          aria-pressed={isSaved}
        >
          {saving ? 'Saving…' : isSaved ? '♥ Saved' : '♡ Save destination'}
        </button>

        <Link className="plan-trip-button" to={searchUrl}>
          Plan this trip
        </Link>

        {hasCoordinates && (
          <a
            className="destination-map-link"
            href={`https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`}
            target="_blank"
            rel="noreferrer"
          >
            View {destination.name} on Google Maps ↗
          </a>
        )}

        <button
          className="detail-share-button"
          type="button"
          onClick={shareDestination}
        >
          Share destination
        </button>
      </div>

      {shareMessage && (
        <p className="share-message" role="status">
          {shareMessage}
        </p>
      )}

      {relatedDestinations.length > 0 && (
        <section className="related-destinations">
          <h2>Explore more destinations</h2>

          <div className="related-destination-grid">
            {relatedDestinations.map((place) => (
              <Link
                className="related-destination-card"
                key={place._id}
                to={`/destinations/${place._id}`}
              >
                <img src={place.imageUrl} alt={place.name} loading="lazy" referrerPolicy="no-referrer" />
                <span>{place.name}</span>
                <small>{place.country}</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      {destination && (
        <AiTravelConcierge
          destinationId={destination._id}
          destinationName={destination.name}
        />
      )}
    </main>
  )
}
