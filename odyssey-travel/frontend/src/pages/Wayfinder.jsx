import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { showToast } from '../lib/toast.js'
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx'
import { resolveSpotCoordinates } from '../lib/geoUtils.js'
import { API } from '../lib/api.js'

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export default function Wayfinder() {
  const token = sessionStorage.getItem('odysseyAccessToken')
  const navigate = useNavigate()

  const [destinations, setDestinations] = useState(() => {
    try {
      const cached = sessionStorage.getItem('odysseyCachedDestinations')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [savedItineraries, setSavedItineraries] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [destinationId, setDestinationId] = useState('')
  const [days, setDays] = useState(3)
  const [dailyBudgetINR, setDailyBudgetINR] = useState(5000)
  const [travelStyle, setTravelStyle] = useState('Balanced')
  const [request, setRequest] = useState('')
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadPageData() {
      try {
        const destPromise = axios.get(`${API}/destinations`, { signal: controller.signal })
          .then((res) => {
            setDestinations(res.data)
            try {
              sessionStorage.setItem('odysseyCachedDestinations', JSON.stringify(res.data))
            } catch {}
          })
          .catch(() => {
            try {
              const cached = sessionStorage.getItem('odysseyCachedDestinations')
              if (cached) setDestinations(JSON.parse(cached))
            } catch {}
          })

        if (!token) {
          await destPromise
          return
        }

        const authConfig = {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }

        const [_, itineraryResponse, userResponse] = await Promise.all([
          destPromise,
          axios.get(`${API}/itineraries`, authConfig).catch(() => ({ data: [] })),
          axios.get(`${API}/auth/me`, authConfig).catch(() => null),
        ])

        if (itineraryResponse?.data) {
          setSavedItineraries(itineraryResponse.data)
        }

        if (userResponse?.data?.user?.travelProfile) {
          const prof = userResponse.data.user.travelProfile
          setUserProfile(prof)
          if (prof.travelStyle) setTravelStyle(prof.travelStyle)
          if (prof.typicalBudgetPerDayINR) setDailyBudgetINR(prof.typicalBudgetPerDayINR)
        }
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
            'Could not load your travel planner data.',
        )
      }
    }

    loadPageData()
    return () => controller.abort()
  }, [token, navigate])

  async function generateItinerary(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setPlan(null)
    setLoading(true)

    try {
      const response = await axios.post(
        `${API}/chat/itinerary`,
        {
          destinationId,
          days: Number(days),
          dailyBudgetINR: Number(dailyBudgetINR),
          travelStyle,
          request,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setPlan(response.data)
      showToast('Your itinerary is ready.')
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('odysseyAccessToken')
        sessionStorage.removeItem('odysseyUser')
          window.dispatchEvent(new Event('odyssey-auth-change'))
        navigate('/login', { replace: true })
        return
      }

      setError(
        requestError.response?.data?.message ||
          'Could not create an itinerary. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function saveItinerary() {
    if (!plan) return

    setError('')
    setMessage('')
    setSaving(true)

    try {
      const response = await axios.post(
        `${API}/itineraries`,
        { destinationId: plan.destinationId, plan },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setSavedItineraries((previous) => [
        response.data.itinerary,
        ...previous,
      ])
      setMessage('Itinerary saved to My Journeys.')
      showToast('Itinerary saved to My Journeys.')
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('odysseyAccessToken')
        sessionStorage.removeItem('odysseyUser')
          window.dispatchEvent(new Event('odyssey-auth-change'))
        navigate('/login', { replace: true })
        return
      }

      setError(
        requestError.response?.data?.message ||
          'Could not save the itinerary. Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  function exportPdf() {
    window.print()
  }

  const currentDestinationObj = destinations.find(
    (d) => String(d._id) === String(plan?.destinationId || plan?.destination),
  ) || {
    name: plan?.destinationName || 'Destination',
    coordinates: { latitude: 27.1767, longitude: 78.0081 },
  }

  const DAY_PALETTE = ['#d4af37', '#20b2aa', '#e06666', '#9370db', '#e67e22', '#3498db', '#1abc9c']

  const itineraryRoutes = plan?.days ? plan.days.map((day, dIdx) => ({
    id: `day-${day.day}`,
    label: `Day ${day.day}: ${day.theme || `Day ${day.day}`}`,
    color: DAY_PALETTE[dIdx % DAY_PALETTE.length],
    waypoints: (day.activities || []).map((act, aIdx) => {
      const coords = resolveSpotCoordinates(act.place, currentDestinationObj, aIdx)
      return {
        id: `${day.day}-${aIdx}`,
        name: act.place,
        subtitle: act.time,
        description: act.description,
        category: aIdx === 0 ? 'Morning ☀️' : aIdx === 1 ? 'Afternoon 🌤️' : 'Evening 🌙',
        cost: act.estimatedCostINR,
        lat: coords.lat,
        lon: coords.lon,
      }
    }),
  })) : []

  return (
    <main className="wayfinder-page">
      <header className="wayfinder-heading">
        <p className="eyebrow dark">YOUR ODYSSEY, CHARTED</p>
        <h1>Wayfinder</h1>
        <p>
          Tell us what kind of trip you want. Wayfinder will draft a day-by-day
          plan.
        </p>
        {userProfile && (
          <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1.25rem', background: 'var(--bg-muted, #faf8f5)', borderRadius: '999px', border: '1px solid var(--border, #e5ded3)', fontSize: '0.82rem', color: 'var(--text, inherit)' }}>
            <span style={{ color: 'var(--gold, #b58b4a)' }}>✨</span>
            <span>AI Profile Synced: <strong>{userProfile.travelStyle || 'Balanced'}</strong> pace ({userProfile.preferredPace || 'Moderate'}) • <strong>₹{(userProfile.typicalBudgetPerDayINR || 5000).toLocaleString('en-IN')}/day</strong></span>
          </div>
        )}
      </header>

      {!token && (
        <p className="error-message" role="alert">
          Please sign in to use Wayfinder and save itineraries.
        </p>
      )}

      {token && (
        <form className="wayfinder-form" onSubmit={generateItinerary}>
          <label>
            Destination
            <select
              value={destinationId}
              onChange={(event) => setDestinationId(event.target.value)}
              required
            >
              <option value="">Choose a destination</option>
              {destinations.map((place) => (
                <option key={place._id} value={place._id}>
                  {place.name}, {place.country}
                </option>
              ))}
            </select>
          </label>

          <label>
            Days
            <input
              type="number"
              min="1"
              max="10"
              value={days}
              onChange={(event) => setDays(event.target.value)}
              required
            />
          </label>

          <label>
            Daily budget per traveler (₹)
            <input
              type="number"
              min="500"
              max="500000"
              value={dailyBudgetINR}
              onChange={(event) => setDailyBudgetINR(event.target.value)}
              required
            />
          </label>

          <label>
            Travel style
            <select
              value={travelStyle}
              onChange={(event) => setTravelStyle(event.target.value)}
            >
              <option>Balanced</option>
              <option>Culture and history</option>
              <option>Nature and outdoors</option>
              <option>Relaxed</option>
              <option>Food focused</option>
              <option>Family friendly</option>
            </select>
          </label>

          <label className="wayfinder-request">
            What would you like to do?
            <textarea
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              minLength="5"
              maxLength="1000"
              placeholder="For example: include local food, historic places, and a relaxed afternoon."
              required
            />
          </label>

          <button type="submit" disabled={loading || !destinations.length}>
            {loading ? 'Wayfinder is planning…' : 'Create itinerary'}
          </button>
        </form>
      )}

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="wayfinder-message" role="status">
          {message}
        </p>
      )}

      {plan && (
        <article className="itinerary-print-area">
          <div className="itinerary-actions">
            <button type="button" onClick={saveItinerary} disabled={saving}>
              {saving ? 'Saving…' : 'Save itinerary'}
            </button>
            <button type="button" onClick={exportPdf}>
              Export as PDF
            </button>
          </div>

          <p className="eyebrow dark">{plan.destinationName}</p>
          {plan.source && (
            <span style={{
              display: 'inline-block',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '0.3rem 0.85rem',
              borderRadius: '999px',
              background: 'var(--gold, #b58b4a)',
              color: '#10232d',
              marginBottom: '0.75rem'
            }}>
              ✨ {plan.source}
            </span>
          )}
          <h2>{plan.title}</h2>
          <p>{plan.summary}</p>

          {/* Interactive 2D Wayfinder Route Map */}
          {itineraryRoutes.length > 0 && (
            <InteractiveRouteMap
              title={`${plan.destinationName || currentDestinationObj.name} Daily Route Map`}
              subtitle="Interactive 2D topological route map with day-by-day transit sequences, stop metrics, and directions"
              initialCenter={{
                lat: currentDestinationObj.coordinates?.latitude || 27.1767,
                lon: currentDestinationObj.coordinates?.longitude || 78.0081,
              }}
              routes={itineraryRoutes}
              height="480px"
              allowDaySelection={true}
            />
          )}

          {plan.days.map((day) => (
            <section className="itinerary-day" key={day.day}>
              <h3>
                Day {day.day}: {day.theme}
              </h3>
              <div className="itinerary-activities">
                {day.activities.map((activity, index) => (
                  <div
                    className="itinerary-activity"
                    key={`${day.day}-${index}`}
                  >
                    <strong>{activity.time}</strong>
                    <h4>{activity.place}</h4>
                    <p>{activity.description}</p>
                    <small>
                      Estimated cost: {inr.format(activity.estimatedCostINR)}
                    </small>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <p className="itinerary-total">
            Estimated total:{' '}
            <strong>{inr.format(plan.totalEstimatedCostINR)}</strong>
          </p>
          <p>{plan.budgetNote}</p>
          <small>
            Locally generated suggestions and prices are estimates. Check local
            details and current prices before travelling.
          </small>
        </article>
      )}

      <section className="saved-itineraries">
        <h2>Your saved itineraries</h2>

        {savedItineraries.length === 0 ? (
          <p>No saved itineraries yet. Create one and choose Save itinerary.</p>
        ) : (
          savedItineraries.map((itinerary) => (
            <article className="saved-itinerary" key={itinerary._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.35rem' }}>{itinerary.title}</h3>
                  <p style={{ margin: '0 0 0.25rem' }}>
                    {itinerary.destinationName} · {itinerary.days?.length || 0} days
                  </p>
                  <p style={{ margin: 0 }}>
                    Estimated total:{' '}
                    <strong>{inr.format(itinerary.totalEstimatedCostINR)}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPlan(itinerary)
                    window.scrollTo({ top: 380, behavior: 'smooth' })
                    showToast(`Loaded "${itinerary.title}" route map.`)
                  }}
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: '999px',
                    border: '1px solid var(--gold, #b58b4a)',
                    background: 'var(--navy, #10232d)',
                    color: 'var(--gold, #b58b4a)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <span>🗺️</span> View Route Map & Plan
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  )
}
