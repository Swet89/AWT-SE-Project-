import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { signOutSession } from '../lib/authRefresh.js'

const API = 'http://localhost:5000/api'

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export default function MyJourneys() {
  const [user, setUser] = useState(null)
  const [profileName, setProfileName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [favorites, setFavorites] = useState([])
  const [bookings, setBookings] = useState([])
  const [expandedBookingId, setExpandedBookingId] = useState('')
  const [bookingSearch, setBookingSearch] = useState('')
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all')
  const [cancellingBookingId, setCancellingBookingId] = useState('')
  const [itineraries, setItineraries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState('')
  const [removingItineraryId, setRemovingItineraryId] = useState('')
  const [expandedItineraryId, setExpandedItineraryId] = useState('')
  const [printingItineraryId, setPrintingItineraryId] = useState('')
  const [itinerarySearch, setItinerarySearch] = useState('')
  const navigate = useNavigate()

  const searchTerm = itinerarySearch.trim().toLowerCase()
  const filteredItineraries = itineraries.filter((itinerary) =>
    [itinerary.title, itinerary.destinationName, itinerary.summary]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm),
  )
  const bookingSearchTerm = bookingSearch.trim().toLowerCase()
  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus = bookingStatusFilter === 'all' || booking.status === bookingStatusFilter
    const searchableText = [
      booking.optionSnapshot?.name,
      booking.optionSnapshot?.destination,
      booking.optionSnapshot?.origin,
      booking.status?.replaceAll('_', ' '),
      booking.traveler?.name,
    ].filter(Boolean).join(' ').toLowerCase()
    return matchesStatus && searchableText.includes(bookingSearchTerm)
  })

  useEffect(() => {
    if (!printingItineraryId) return undefined

    const printTimer = window.setTimeout(() => window.print(), 150)
    const finishPrinting = () => setPrintingItineraryId('')

    window.addEventListener('afterprint', finishPrinting)

    return () => {
      window.clearTimeout(printTimer)
      window.removeEventListener('afterprint', finishPrinting)
    }
  }, [printingItineraryId])

  useEffect(() => {
    const controller = new AbortController()

    async function loadAccount() {
      const token = sessionStorage.getItem('odysseyAccessToken')

      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      }

      try {
        const [
          profileResponse,
          favoritesResponse,
          bookingsResponse,
          itinerariesResponse,
        ] = await Promise.all([
            axios.get(`${API}/auth/me`, config),
            axios.get(`${API}/favorites`, config),
            axios.get(`${API}/bookings/my`, config),
            axios.get(`${API}/itineraries`, config),
          ])

        setUser(profileResponse.data.user)
        setProfileName(profileResponse.data.user.name)
        setProfileEmail(profileResponse.data.user.email)
        setFavorites(favoritesResponse.data)
        setBookings(bookingsResponse.data)
        setItineraries(itinerariesResponse.data)
      } catch (requestError) {
        if (controller.signal.aborted) return

        if (requestError.response?.status === 401) {
          sessionStorage.removeItem('odysseyAccessToken')
          sessionStorage.removeItem('odysseyUser')
          window.dispatchEvent(new Event('odyssey-auth-change'))
          navigate('/login', { replace: true })
          return
        }

        setError(
          requestError.response?.data?.message ||
            'Could not load your trips. Check that the backend is running.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadAccount()
    return () => controller.abort()
  }, [navigate])

  async function removeFavorite(place) {
    const token = sessionStorage.getItem('odysseyAccessToken')
    setRemovingId(place._id)
    setError('')

    try {
      await axios.delete(`${API}/favorites/${place._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setFavorites((previous) =>
        previous.filter((favorite) => favorite._id !== place._id),
      )
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Could not remove this saved destination.',
      )
    } finally {
      setRemovingId('')
    }
  }

  async function cancelBooking(booking) {
    const confirmed = window.confirm(
      `Cancel the pending booking request for "${booking.optionSnapshot.name}"?`,
    )
    if (!confirmed) return

    const token = sessionStorage.getItem('odysseyAccessToken')
    setCancellingBookingId(booking._id)
    setError('')

    try {
      const response = await axios.patch(
        `${API}/bookings/${booking._id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setBookings((previous) => previous.map((saved) =>
        saved._id === booking._id ? response.data.booking : saved,
      ))
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('odysseyAccessToken')
        sessionStorage.removeItem('odysseyUser')
          window.dispatchEvent(new Event('odyssey-auth-change'))
        navigate('/login', { replace: true })
        return
      }
      setError(requestError.response?.data?.message || 'Could not cancel this booking.')
    } finally {
      setCancellingBookingId('')
    }
  }

  async function removeItinerary(itinerary) {
    const confirmed = window.confirm(
      'Delete the saved itinerary "' + itinerary.title + '"? This cannot be undone.',
    )

    if (!confirmed) return

    const token = sessionStorage.getItem('odysseyAccessToken')
    setRemovingItineraryId(itinerary._id)
    setError('')

    try {
      await axios.delete(`${API}/itineraries/${itinerary._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setItineraries((previous) =>
        previous.filter((saved) => saved._id !== itinerary._id),
      )
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Could not delete this saved itinerary.',
      )
    } finally {
      setRemovingItineraryId('')
    }
  }

  async function saveProfile(event) {
    event.preventDefault()
    const token = sessionStorage.getItem('odysseyAccessToken')
    setSavingProfile(true)
    setError('')
    setProfileMessage('')

    try {
      const response = await axios.patch(
        `${API}/auth/me`,
        { name: profileName, email: profileEmail },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      setUser(response.data.user)
      setProfileName(response.data.user.name)
      setProfileEmail(response.data.user.email)
      sessionStorage.setItem('odysseyUser', JSON.stringify(response.data.user))
      setEditingProfile(false)
      setProfileMessage('Profile updated successfully.')
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('odysseyAccessToken')
        sessionStorage.removeItem('odysseyUser')
          window.dispatchEvent(new Event('odyssey-auth-change'))
        navigate('/login', { replace: true })
        return
      }

      setError(
        requestError.response?.data?.message || 'Could not update your profile.',
      )
    } finally {
      setSavingProfile(false)
    }
  }

  async function changePassword(event) {
    event.preventDefault()
    const token = sessionStorage.getItem('odysseyAccessToken')
    setSavingPassword(true)
    setError('')
    setPasswordMessage('')

    try {
      const response = await axios.patch(
        `${API}/auth/password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setCurrentPassword('')
      setNewPassword('')
      setChangingPassword(false)
      setPasswordMessage(response.data.message)
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('odysseyAccessToken')
        sessionStorage.removeItem('odysseyUser')
          window.dispatchEvent(new Event('odyssey-auth-change'))
        navigate('/login', { replace: true })
        return
      }
      setError(requestError.response?.data?.message || 'Could not change your password.')
    } finally {
      setSavingPassword(false)
    }
  }

  async function signOut() {
    await signOutSession()
    navigate('/login', { replace: true })
  }

  return (
    <main className="journeys-page">
      <section className="journeys-panel">
        <p className="eyebrow dark">YOUR PERSONAL LOGBOOK</p>
        <h1>My Journeys</h1>

        {loading && <p className="page-message">Loading your trips…</p>}

        {!loading && error && (
          <p className="page-message error-message" role="alert">{error}</p>
        )}

        {!loading && user && (
          <>
            <div className="profile-summary">
              <div>
                <p className="journeys-welcome">Welcome, {user.name}.</p>
                <p className="journeys-email">{user.email}</p>
              </div>
              {!editingProfile && (
                <button
                  className="edit-profile-button"
                  type="button"
                  onClick={() => {
                    setProfileName(user.name)
                    setProfileEmail(user.email)
                    setProfileMessage('')
                    setEditingProfile(true)
                  }}
                >
                  Edit profile
                </button>
              )}
            </div>

            {editingProfile && (
              <form className="profile-edit-form" onSubmit={saveProfile}>
                <label>
                  Name
                  <input
                    type="text"
                    minLength="2"
                    maxLength="80"
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    maxLength="254"
                    value={profileEmail}
                    onChange={(event) => setProfileEmail(event.target.value)}
                    required
                  />
                </label>
                <div className="profile-edit-actions">
                  <button type="submit" disabled={savingProfile}>
                    {savingProfile ? 'Saving…' : 'Save profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileName(user.name)
                      setProfileEmail(user.email)
                      setEditingProfile(false)
                      setError('')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {profileMessage && (
              <p className="wayfinder-message" role="status">
                {profileMessage}
              </p>
            )}

            {!changingPassword ? (
              <button
                className="edit-profile-button password-change-toggle"
                type="button"
                onClick={() => {
                  setPasswordMessage('')
                  setChangingPassword(true)
                }}
              >
                Change password
              </button>
            ) : (
              <form className="profile-edit-form password-edit-form" onSubmit={changePassword}>
                <h2>Change password</h2>
                <label>
                  Current password
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                  />
                </label>
                <label>
                  New password (8–128 characters)
                  <input
                    type="password"
                    minLength="8"
                    maxLength="128"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                  />
                </label>
                <div className="profile-edit-actions">
                  <button type="submit" disabled={savingPassword}>
                    {savingPassword ? 'Saving…' : 'Update password'}
                  </button>
                  <button type="button" onClick={() => setChangingPassword(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {passwordMessage && (
              <p className="wayfinder-message" role="status">{passwordMessage}</p>
            )}

            <section className="saved-section">
              <h2>Booking requests</h2>

              {bookings.length > 0 && (
                <div className="booking-filters">
                  <label>
                    Search bookings
                    <input
                      type="search"
                      value={bookingSearch}
                      onChange={(event) => setBookingSearch(event.target.value)}
                      placeholder="Search by travel option, destination, or traveler"
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={bookingStatusFilter}
                      onChange={(event) => setBookingStatusFilter(event.target.value)}
                    >
                      <option value="all">All bookings</option>
                      <option value="pending_payment">Pending payment</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>
                </div>
              )}

              {bookings.length === 0 ? (
                <div className="journeys-empty">
                  <p>You don’t have any booking requests yet.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/search/flights')}
                  >
                    Search travel options
                  </button>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="journeys-empty booking-no-results">
                  <p>No booking requests match those filters.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingSearch('')
                      setBookingStatusFilter('all')
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="booking-history">
                  {filteredBookings.map((booking) => (
                    <article className="history-card" key={booking._id}>
                      <div className="booking-history-main">
                        <div>
                        <span className={`estimated-badge booking-status-${booking.status}`}>
                          {booking.status.replaceAll('_', ' ')}
                        </span>
                        <h3>{booking.optionSnapshot.name}</h3>
                        <p>
                          {booking.optionSnapshot.origin
                            ? `${booking.optionSnapshot.origin} → `
                            : ''}
                          {booking.optionSnapshot.destination}
                        </p>
                        <p>
                          {booking.optionSnapshot.kind} · {booking.quantity}{' '}
                          {booking.optionSnapshot.kind === 'hotels'
                            ? 'room(s)'
                            : 'traveler(s)'}
                        </p>
                        <p>
                          Requested{' '}
                          {new Date(booking.createdAt).toLocaleDateString('en-IN')}
                        </p>
                        </div>
                      <div className="booking-history-actions">
                        <strong>{inr.format(booking.totalINR)}</strong>
                        <button
                          className="view-itinerary-button"
                          type="button"
                          aria-expanded={expandedBookingId === booking._id}
                          onClick={() => setExpandedBookingId((current) =>
                            current === booking._id ? '' : booking._id,
                          )}
                        >
                          {expandedBookingId === booking._id ? 'Hide details' : 'View details'}
                        </button>
                        {booking.status === 'pending_payment' && (
                          <button
                            className="remove-favorite-button"
                            type="button"
                            disabled={cancellingBookingId === booking._id}
                            onClick={() => cancelBooking(booking)}
                          >
                            {cancellingBookingId === booking._id ? 'Cancelling…' : 'Cancel request'}
                          </button>
                        )}
                      </div>
                      </div>
                      {expandedBookingId === booking._id && (
                        <div className="booking-details">
                          <h4>Traveler details</h4>
                          <p><strong>Name:</strong> {booking.traveler.name}</p>
                          <p><strong>Email:</strong> {booking.traveler.email}</p>
                          <p><strong>Phone:</strong> {booking.traveler.phone}</p>
                          <h4>Price breakdown</h4>
                          <p><span>Price per {booking.optionSnapshot.kind === 'hotels' ? 'room' : 'traveler'}</span><span>{inr.format(booking.optionSnapshot.priceINR)}</span></p>
                          <p><span>Quantity</span><span>{booking.quantity}</span></p>
                          <p><span>Subtotal</span><span>{inr.format(booking.subtotalINR)}</span></p>
                          {booking.couponCode && <p><span>Game coupon ({booking.discountPercent}%)</span><span>−{inr.format(booking.discountINR)}</span></p>}
                          <p><span>Tax ({Math.round(booking.gstRate * 100)}%)</span><span>{inr.format(booking.gstINR)}</span></p>
                          <p className="booking-details-total"><strong>Total</strong><strong>{inr.format(booking.totalINR)}</strong></p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="saved-section">
              <h2>Saved destinations</h2>

              {favorites.length === 0 ? (
                <div className="journeys-empty">
                  <p>You haven’t saved any destinations yet.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/destinations')}
                  >
                    Explore destinations
                  </button>
                </div>
              ) : (
                <div className="destination-grid">
                  {favorites.map((place) => (
                    <article className="destination-card" key={place._id}>
                      <img
                        src={place.imageUrl}
                        alt={`View of ${place.name}`}
                        loading="lazy"
                      />
                      <div className="destination-card-content">
                        <p className="destination-location">
                          {place.state ? `${place.state}, ` : ''}
                          {place.country}
                        </p>
                        <h2>{place.name}</h2>
                        <p className="destination-description">
                          {place.description}
                        </p>
                        <button
                          className="remove-favorite-button"
                          type="button"
                          disabled={removingId === place._id}
                          onClick={() => removeFavorite(place)}
                        >
                          {removingId === place._id
                            ? 'Removing…'
                            : 'Remove saved destination'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="saved-section">
              <h2>Saved itineraries</h2>

              {itineraries.length > 0 && (
                <label className="saved-itinerary-search">
                  Search saved plans
                  <input
                    type="search"
                    value={itinerarySearch}
                    onChange={(event) => setItinerarySearch(event.target.value)}
                    placeholder="Search by title or destination"
                  />
                </label>
              )}

              {filteredItineraries.length === 0 ? (
                <div className="journeys-empty">
                  <p>
                    {itineraries.length === 0
                      ? 'You haven’t saved any itineraries yet.'
                      : 'No saved plans match that search.'}
                  </p>
                  {itineraries.length === 0 ? (
                    <button type="button" onClick={() => navigate('/wayfinder')}>
                      Plan a trip with Wayfinder
                    </button>
                  ) : (
                    <button type="button" onClick={() => setItinerarySearch('')}>
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div className="saved-itinerary-list">
                  {filteredItineraries.map((itinerary) => (
                    <article
                      className={`saved-itinerary-card${printingItineraryId === itinerary._id ? ' print-saved-itinerary' : ''}`}
                      key={itinerary._id}
                    >
                      <div className="saved-itinerary-header">
                        <div>
                          <span className="estimated-badge">Saved plan</span>
                          <h3>{itinerary.title}</h3>
                          <p>
                            {itinerary.destinationName} · {itinerary.days.length}{' '}
                            {itinerary.days.length === 1 ? 'day' : 'days'}
                          </p>
                          <p>{itinerary.summary}</p>
                          <p>
                            Saved{' '}
                            {new Date(itinerary.createdAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <div className="saved-itinerary-actions">
                          <strong>
                            {inr.format(itinerary.totalEstimatedCostINR)}
                          </strong>
                          <button
                            className="view-itinerary-button"
                            type="button"
                            aria-expanded={expandedItineraryId === itinerary._id}
                            onClick={() =>
                              setExpandedItineraryId((current) =>
                                current === itinerary._id ? '' : itinerary._id,
                              )
                            }
                          >
                            {expandedItineraryId === itinerary._id
                              ? 'Hide details'
                              : 'View itinerary'}
                          </button>
                          <button
                            className="view-itinerary-button"
                            type="button"
                            onClick={() => {
                              setExpandedItineraryId(itinerary._id)
                              setPrintingItineraryId(itinerary._id)
                            }}
                          >
                            Export PDF
                          </button>
                          <button
                            className="remove-favorite-button"
                            type="button"
                            disabled={removingItineraryId === itinerary._id}
                            onClick={() => removeItinerary(itinerary)}
                          >
                            {removingItineraryId === itinerary._id
                              ? 'Deleting…'
                              : 'Delete itinerary'}
                          </button>
                        </div>
                      </div>

                      {(expandedItineraryId === itinerary._id ||
                        printingItineraryId === itinerary._id) && (
                        <div className="saved-itinerary-details">
                          {itinerary.days.map((day) => (
                            <section
                              className="saved-itinerary-day"
                              key={day.day}
                            >
                              <h4>
                                Day {day.day}: {day.theme}
                              </h4>
                              {(day.activities || []).map((activity, index) => (
                                <div
                                  className="saved-itinerary-activity"
                                  key={`${day.day}-${index}`}
                                >
                                  <strong>
                                    {activity.time} · {activity.place}
                                  </strong>
                                  <p>{activity.description}</p>
                                  <small>
                                    Estimated cost:{' '}
                                    {inr.format(activity.estimatedCostINR)}
                                  </small>
                                </div>
                              ))}
                            </section>
                          ))}
                          {itinerary.budgetNote && (
                            <p className="saved-itinerary-budget-note">
                              {itinerary.budgetNote}
                            </p>
                          )}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <button className="sign-out-button" type="button" onClick={signOut}>
              Sign out
            </button>
          </>
        )}
      </section>
    </main>
  )
}
