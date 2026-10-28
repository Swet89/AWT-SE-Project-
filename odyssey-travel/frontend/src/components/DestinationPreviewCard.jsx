import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function DestinationPreviewCard({
  destination,
  onClose,
}) {
  const cardRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    function handleClickOutside(event) {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        // Do not close if clicking directly on the 3D globe to select another marker
        if (event.target.closest('.interactive-earth-canvas')) {
          return
        }
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    // Small timeout so initial click on marker doesn't immediately trigger outside click
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside)
    }, 100)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handleClickOutside)
      clearTimeout(timer)
    }
  }, [onClose])

  if (!destination) return null

  const formatPrice = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0)

  const handleImageError = (e) => {
    // Fallback if image fails to load
    e.currentTarget.src =
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'
  }

  const destinationSlug = destination.id || encodeURIComponent(destination.name)

  return (
    <aside
      ref={cardRef}
      className="destination-preview-card"
      role="dialog"
      aria-modal="false"
      aria-labelledby="preview-dest-title"
      tabIndex={-1}
    >
      {/* Close button */}
      <button
        type="button"
        className="preview-card-close"
        onClick={onClose}
        aria-label={`Close preview for ${destination.name}`}
      >
        ✕
      </button>

      {/* Hero Image & Tags */}
      <div className="preview-card-image-wrap">
        <img
          src={destination.imageUrl}
          alt={`Scenic view of ${destination.name}`}
          className="preview-card-image"
          onError={handleImageError}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="preview-card-img-gradient" />
        <span className="preview-category-badge">{destination.category || 'Featured'}</span>
        {destination.rating && (
          <div className="preview-rating-pill" aria-label={`Rating ${destination.rating} out of 5`}>
            <span className="star-icon" aria-hidden="true">★</span>
            <strong>{destination.rating}</strong>
            {destination.reviewCount && <span className="review-count">({destination.reviewCount})</span>}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="preview-card-body">
        <div className="preview-card-header">
          <p className="preview-location-crumb">
            {destination.state ? `${destination.state}, ` : ''}{destination.country}
          </p>
          <h3 id="preview-dest-title" className="preview-destination-title">
            {destination.name}
          </h3>
        </div>

        <p className="preview-description">{destination.description}</p>

        {/* Highlights & Metadata Grid */}
        <div className="preview-meta-grid">
          <div className="preview-meta-item">
            <span className="meta-label">DAILY BUDGET</span>
            <span className="meta-value budget-highlight">
              {formatPrice(destination.budgetPerDayINR)} <small>/ day</small>
            </span>
          </div>

          <div className="preview-meta-item">
            <span className="meta-label">BEST TIME</span>
            <span className="meta-value">{destination.bestTime || 'Year-round'}</span>
          </div>
        </div>

        {/* Attractions list */}
        {destination.attractions && destination.attractions.length > 0 && (
          <div className="preview-attractions">
            <span className="attractions-heading">TOP ATTRACTIONS</span>
            <div className="attraction-chips">
              {destination.attractions.map((attraction) => (
                <span key={attraction} className="attraction-chip">
                  {attraction}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="preview-card-actions">
          <Link
            to={`/destinations/${destinationSlug}`}
            className="preview-btn-primary"
            onClick={onClose}
          >
            <span>View Destination</span>
            <span aria-hidden="true">↗</span>
          </Link>
          <Link
            to={`/wayfinder?destination=${encodeURIComponent(destination.name)}`}
            className="preview-btn-secondary"
            onClick={onClose}
          >
            Plan Trip
          </Link>
        </div>
      </div>
    </aside>
  )
}
