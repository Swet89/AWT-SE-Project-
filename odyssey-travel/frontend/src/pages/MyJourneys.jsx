import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { signOutSession } from '../lib/authRefresh.js'
import { API } from '../lib/api.js'

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
  const [travelProfile, setTravelProfile] = useState({
    travelStyle: 'Balanced',
    interests: [],
    dietaryPreference: 'None',
    typicalBudgetPerDayINR: 5000,
    preferredPace: 'Moderate',
    pastTrips: [],
  })
  const [editingTravelProfile, setEditingTravelProfile] = useState(false)
  const [savingTravelProfile, setSavingTravelProfile] = useState(false)
  const [travelProfileMessage, setTravelProfileMessage] = useState('')
  const [newTripDestination, setNewTripDestination] = useState('')
  const [newTripYear, setNewTripYear] = useState(new Date().getFullYear())
  const [newTripHighlights, setNewTripHighlights] = useState('')
  const [newTripRating, setNewTripRating] = useState(5)
  const [interestInput, setInterestInput] = useState('')
  const [favorites, setFavorites] = useState([])
  const [bookings, setBookings] = useState([])
  const [expandedBookingId, setExpandedBookingId] = useState('')
  const [bookingSearch, setBookingSearch] = useState('')
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all')
  const [cancellingBookingId, setCancellingBookingId] = useState('')
  const [payingBookingId, setPayingBookingId] = useState('')
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
        if (profileResponse.data.user.travelProfile) {
          setTravelProfile(profileResponse.data.user.travelProfile)
        }
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

  async function payPendingBooking(booking) {
    const token = sessionStorage.getItem('odysseyAccessToken')
    if (!token) {
      navigate('/login')
      return
    }

    setPayingBookingId(booking._id)
    setError('')
    try {
      const response = await axios.post(
        `${API}/bookings/${booking._id}/payment/simulate`,
        { paymentMethod: 'Instant Sandbox Payment (UPI/Card)' },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setBookings((previous) =>
        previous.map((saved) => (saved._id === booking._id ? response.data.booking : saved)),
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete simulated payment.')
    } finally {
      setPayingBookingId('')
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

  async function saveTravelProfile(event) {
    if (event) event.preventDefault()
    const token = sessionStorage.getItem('odysseyAccessToken')
    setSavingTravelProfile(true)
    setError('')
    setTravelProfileMessage('')

    try {
      const response = await axios.patch(
        `${API}/auth/travel-profile`,
        travelProfile,
        { headers: { Authorization: `Bearer ${token}` } },
      )

      setTravelProfile(response.data.travelProfile)
      setEditingTravelProfile(false)
      setTravelProfileMessage('AI Travel Profile updated successfully!')
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('odysseyAccessToken')
        sessionStorage.removeItem('odysseyUser')
        window.dispatchEvent(new Event('odyssey-auth-change'))
        navigate('/login', { replace: true })
        return
      }
      setError(requestError.response?.data?.message || 'Could not update travel profile.')
    } finally {
      setSavingTravelProfile(false)
    }
  }

  function addPastTrip() {
    if (!newTripDestination.trim()) return
    const newTrip = {
      destination: newTripDestination.trim(),
      year: Number(newTripYear) || new Date().getFullYear(),
      highlights: newTripHighlights.trim(),
      rating: Number(newTripRating) || 5,
    }
    setTravelProfile((prev) => ({
      ...prev,
      pastTrips: [...(prev.pastTrips || []), newTrip],
    }))
    setNewTripDestination('')
    setNewTripHighlights('')
  }

  function removePastTrip(index) {
    setTravelProfile((prev) => ({
      ...prev,
      pastTrips: (prev.pastTrips || []).filter((_, i) => i !== index),
    }))
  }

  function addInterest() {
    const val = interestInput.trim()
    if (!val || (travelProfile.interests || []).includes(val)) return
    setTravelProfile((prev) => ({
      ...prev,
      interests: [...(prev.interests || []), val],
    }))
    setInterestInput('')
  }

  function removeInterest(item) {
    setTravelProfile((prev) => ({
      ...prev,
      interests: (prev.interests || []).filter((i) => i !== item),
    }))
  }

  async function signOut() {
    await signOutSession()
    navigate('/login', { replace: true })
  }

  return (
    <main className="journeys-page">
      <section className="journeys-panel">
        <header className="journeys-heading">
          <p className="eyebrow dark">YOUR PERSONAL LOGBOOK</p>
          <h1>My Journeys</h1>
          <p className="journeys-subtitle">
            Manage your booked voyages, saved itineraries, and AI profile preferences.
          </p>
        </header>

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

            {/* AI Travel Profiling Section */}
            <section
              className="travel-profile-section"
              style={{
                margin: '2rem 0',
                padding: '2rem',
                borderRadius: '20px',
                background: 'var(--surface, #ffffff)',
                border: '1px solid var(--border, #e5ded3)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🧠</span>
                    <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.4rem' }}>
                      AI Travel Persona & Preferences
                    </h2>
                  </div>
                  <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted, #666)', fontSize: '0.9rem' }}>
                    Personalizes your Wayfinder AI itinerary curation, AI Concierge replies, and travel budget forecasts.
                  </p>
                </div>
                {!editingTravelProfile && (
                  <button
                    className="edit-profile-button"
                    type="button"
                    onClick={() => {
                      setTravelProfileMessage('')
                      setEditingTravelProfile(true)
                    }}
                  >
                    Customize AI Profile
                  </button>
                )}
              </div>

              {travelProfileMessage && (
                <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(46, 125, 50, 0.12)', color: '#4caf50', border: '1px solid rgba(76, 175, 80, 0.3)', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  {travelProfileMessage}
                </div>
              )}

              {!editingTravelProfile ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  <div style={{ padding: '1.25rem', background: 'var(--bg-muted, #faf8f5)', borderRadius: '12px', border: '1px solid var(--border, #eee)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gold, #b58b4a)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Travel Style</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 600, marginTop: '0.4rem', color: 'var(--text, inherit)' }}>{travelProfile.travelStyle || 'Balanced'}</div>
                  </div>

                  <div style={{ padding: '1.25rem', background: 'var(--bg-muted, #faf8f5)', borderRadius: '12px', border: '1px solid var(--border, #eee)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gold, #b58b4a)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pace & Tempo</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 600, marginTop: '0.4rem', color: 'var(--text, inherit)' }}>{travelProfile.preferredPace || 'Moderate'}</div>
                  </div>

                  <div style={{ padding: '1.25rem', background: 'var(--bg-muted, #faf8f5)', borderRadius: '12px', border: '1px solid var(--border, #eee)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gold, #b58b4a)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Typical Daily Budget</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 600, marginTop: '0.4rem', color: 'var(--text, inherit)' }}>{inr.format(travelProfile.typicalBudgetPerDayINR || 5000)} / day</div>
                  </div>

                  <div style={{ padding: '1.25rem', background: 'var(--bg-muted, #faf8f5)', borderRadius: '12px', border: '1px solid var(--border, #eee)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gold, #b58b4a)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dietary Profile</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 600, marginTop: '0.4rem', color: 'var(--text, inherit)' }}>{travelProfile.dietaryPreference || 'None'}</div>
                  </div>

                  <div style={{ gridColumn: '1 / -1', padding: '1.25rem', background: 'var(--bg-muted, #faf8f5)', borderRadius: '12px', border: '1px solid var(--border, #eee)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gold, #b58b4a)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>Interests & Themes</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {travelProfile.interests?.length > 0 ? (
                        travelProfile.interests.map((interest) => (
                          <span key={interest} style={{ padding: '0.35rem 0.85rem', background: 'var(--surface, #fff)', border: '1px solid var(--border, #ddd)', borderRadius: '999px', fontSize: '0.85rem', color: 'var(--text, inherit)' }}>
                            {interest}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #888)', fontStyle: 'italic' }}>No specific interests tagged yet.</span>
                      )}
                    </div>
                  </div>

                  <div style={{ gridColumn: '1 / -1', padding: '1.25rem', background: 'var(--bg-muted, #faf8f5)', borderRadius: '12px', border: '1px solid var(--border, #eee)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gold, #b58b4a)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>Past Voyages & Memory Log</div>
                    {travelProfile.pastTrips?.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                        {travelProfile.pastTrips.map((trip, idx) => (
                          <div key={idx} style={{ padding: '1rem', background: 'var(--surface, #fff)', borderRadius: '10px', border: '1px solid var(--border, #e0e0e0)', fontSize: '0.88rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ color: 'var(--text, inherit)' }}>{trip.destination}</strong>
                              <span style={{ color: 'var(--gold, #b58b4a)' }}>{'★'.repeat(trip.rating || 5)}</span>
                            </div>
                            <div style={{ color: 'var(--text-muted, #777)', fontSize: '0.8rem', marginTop: '4px' }}>Visited in {trip.year}</div>
                            {trip.highlights && <div style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--text, #555)', lineHeight: 1.5 }}>"{trip.highlights}"</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted, #888)', fontStyle: 'italic' }}>
                        No past trips logged yet. Adding past trips helps Odyssey recommend matching off-beat alternatives!
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={saveTravelProfile} style={{ display: 'grid', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <label>
                      Travel Style
                      <select
                        value={travelProfile.travelStyle || 'Balanced'}
                        onChange={(e) => setTravelProfile((prev) => ({ ...prev, travelStyle: e.target.value }))}
                      >
                        <option value="Balanced">Balanced Explorer</option>
                        <option value="Cultural">Cultural & Heritage</option>
                        <option value="Adventure">Adventure & Trekking</option>
                        <option value="Foodie">Gastronomic / Foodie</option>
                        <option value="Relaxed">Relaxed & Wellness</option>
                        <option value="Budget">Smart Backpacker / Budget</option>
                      </select>
                    </label>

                    <label>
                      Preferred Pace
                      <select
                        value={travelProfile.preferredPace || 'Moderate'}
                        onChange={(e) => setTravelProfile((prev) => ({ ...prev, preferredPace: e.target.value }))}
                      >
                        <option value="Moderate">Moderate (2-3 places / day)</option>
                        <option value="Fast-paced">Fast-paced (Action packed)</option>
                        <option value="Slow & leisurely">Slow & Leisurely (Deep rest)</option>
                      </select>
                    </label>

                    <label>
                      Typical Budget / Day (INR)
                      <input
                        type="number"
                        min="500"
                        max="500000"
                        value={travelProfile.typicalBudgetPerDayINR || 5000}
                        onChange={(e) => setTravelProfile((prev) => ({ ...prev, typicalBudgetPerDayINR: Number(e.target.value) }))}
                      />
                    </label>

                    <label>
                      Dietary Preference
                      <select
                        value={travelProfile.dietaryPreference || 'None'}
                        onChange={(e) => setTravelProfile((prev) => ({ ...prev, dietaryPreference: e.target.value }))}
                      >
                        <option value="None">No restrictions</option>
                        <option value="Vegetarian">Pure Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Halal">Halal</option>
                        <option value="Jain">Jain Friendly</option>
                        <option value="Gluten-Free">Gluten-Free</option>
                      </select>
                    </label>
                  </div>

                  {/* Interests tag manager */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Interests & Specific Passions
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="e.g. Photography, Scuba diving, Ancient Temples, Local Wine"
                        value={interestInput}
                        onChange={(e) => setInterestInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addInterest()
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addInterest}
                        style={{ padding: '0 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--navy, #10232d)', color: '#fff', cursor: 'pointer' }}
                      >
                        Add Tag
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {travelProfile.interests?.map((item) => (
                        <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.35rem 0.85rem', background: 'var(--bg-muted, #faf8f5)', border: '1px solid var(--border, #ddd)', borderRadius: '999px', fontSize: '0.82rem', color: 'var(--text, inherit)' }}>
                          {item}
                          <button type="button" onClick={() => removeInterest(item)} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #999)', cursor: 'pointer', padding: 0 }}>✕</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Past trips manager */}
                  <div style={{ borderTop: '1px solid var(--border, #eee)', paddingTop: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      Add Past Journeys
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Destination (e.g. Goa, Paris)"
                        value={newTripDestination}
                        onChange={(e) => setNewTripDestination(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Year"
                        value={newTripYear}
                        onChange={(e) => setNewTripYear(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Highlights (e.g. Sunsets, Scuba)"
                        value={newTripHighlights}
                        onChange={(e) => setNewTripHighlights(e.target.value)}
                      />
                      <select value={newTripRating} onChange={(e) => setNewTripRating(e.target.value)}>
                        <option value="5">★★★★★ (Loved it)</option>
                        <option value="4">★★★★☆ (Great)</option>
                        <option value="3">★★★☆☆ (Average)</option>
                        <option value="2">★★☆☆☆ (Disappointing)</option>
                        <option value="1">★☆☆☆☆ (Never again)</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={addPastTrip}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--gold, #b58b4a)', color: 'var(--gold, #b58b4a)', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      + Add Voyage to History
                    </button>

                    {travelProfile.pastTrips?.length > 0 && (
                      <div style={{ display: 'grid', gap: '0.6rem', marginTop: '1rem' }}>
                        {travelProfile.pastTrips.map((trip, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.95rem', background: 'var(--bg-muted, #faf8f5)', border: '1px solid var(--border, #eee)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text, inherit)' }}>
                            <span><strong>{trip.destination}</strong> ({trip.year}) — {trip.highlights || 'No note'}</span>
                            <button type="button" onClick={() => removePastTrip(idx)} style={{ background: 'none', border: 'none', color: '#e57373', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="profile-edit-actions" style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" disabled={savingTravelProfile}>
                      {savingTravelProfile ? 'Saving Persona…' : 'Save AI Profile'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTravelProfile(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>

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
                          className="view-itinerary-button booking-action-btn"
                          type="button"
                          aria-expanded={expandedBookingId === booking._id}
                          onClick={() => setExpandedBookingId((current) =>
                            current === booking._id ? '' : booking._id,
                          )}
                        >
                          {expandedBookingId === booking._id ? 'Hide details' : 'View details'}
                        </button>
                        {booking.status === 'pending_payment' && (
                          <>
                            <button
                              className="view-itinerary-button booking-action-btn booking-pay-btn"
                              type="button"
                              style={{ background: '#caa459', color: '#0c1c24', fontWeight: 700, borderColor: '#caa459' }}
                              disabled={payingBookingId === booking._id}
                              onClick={() => payPendingBooking(booking)}
                            >
                              {payingBookingId === booking._id ? 'Processing…' : '💳 Pay & Confirm'}
                            </button>
                            <button
                              className="remove-favorite-button"
                              type="button"
                              disabled={cancellingBookingId === booking._id || payingBookingId === booking._id}
                              onClick={() => cancelBooking(booking)}
                            >
                              {cancellingBookingId === booking._id ? 'Cancelling…' : 'Cancel request'}
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            className="view-itinerary-button booking-action-btn print-ticket-btn"
                            type="button"
                            onClick={() => window.print()}
                            title="Print E-Ticket / Receipt"
                          >
                            🖨️ Print Ticket
                          </button>
                        )}
                      </div>
                      </div>
                      {expandedBookingId === booking._id && (
                        <div className="booking-details">
                          <h4>Reservation details</h4>
                          <p><strong>PNR / Ticket:</strong> <span style={{ color: '#caa459', fontWeight: 700 }}>{booking.pnr || `ODY-${booking._id.slice(-6).toUpperCase()}`}</span></p>
                          {booking.paymentId && <p><strong>Payment Reference:</strong> <code>{booking.paymentId}</code></p>}
                          {booking.paymentMethod && <p><strong>Payment Method:</strong> {booking.paymentMethod}</p>}
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
                      <div className="destination-card-media">
                        <img
                          src={place.imageUrl}
                          alt={`View of ${place.name}`}
                          loading="lazy"
                        />
                      </div>
                      <div className="destination-card-content">
                        <div className="destination-card-header">
                          <p className="destination-location">
                            {place.state ? `${place.state}, ` : ''}
                            {place.country}
                          </p>
                          <h2>{place.name}</h2>
                        </div>
                        <div className="destination-card-body">
                          <p className="destination-description">
                            {place.description}
                          </p>
                        </div>
                        <div className="destination-card-actions">
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
