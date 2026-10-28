import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { TravelOptionSkeleton } from '../components/SkeletonCard.jsx'
import { showToast } from '../lib/toast.js'
import { API } from '../lib/api.js'
const kinds = ['flights', 'trains', 'buses', 'cruises', 'hotels', 'rentals', 'hostels']
const accommodationKinds = ['hotels', 'rentals', 'hostels']

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(true)

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

function SearchForm({ kind, paramsKey }) {
  const initialParams = new URLSearchParams(paramsKey)
  const [from, setFrom] = useState(initialParams.get('from') || '')
  const [to, setTo] = useState(initialParams.get('to') || '')
  const [departureDate, setDepartureDate] = useState(initialParams.get('departureDate') || '')
  const [minPrice, setMinPrice] = useState(initialParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(initialParams.get('maxPrice') || '')
  const [minRating, setMinRating] = useState(initialParams.get('minRating') || '')
  const [sort, setSort] = useState(initialParams.get('sort') || 'price')
  const [maxStops, setMaxStops] = useState(initialParams.get('maxStops') || '')
  const [departurePeriod, setDeparturePeriod] = useState(initialParams.get('departurePeriod') || '')
  const [travelClass, setTravelClass] = useState(initialParams.get('travelClass') || '')
  const [limit, setLimit] = useState(initialParams.get('limit') || '10')
  const navigate = useNavigate()

  function submitSearch(event) {
    event.preventDefault()

    const params = new URLSearchParams()
    if (from.trim()) params.set('from', from.trim())
    if (to.trim()) params.set('to', to.trim())
    if (kind === 'flights' && departureDate) params.set('departureDate', departureDate)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (minRating) params.set('minRating', minRating)
    if (maxStops !== '') params.set('maxStops', maxStops)
    if (departurePeriod) params.set('departurePeriod', departurePeriod)
    if (travelClass) params.set('travelClass', travelClass)
    if (sort) params.set('sort', sort)
    if (limit !== '10') params.set('limit', limit)
    params.set('page', '1')

    navigate(`/search/${kind}?${params.toString()}`)
  }

  return (
    <form className="travel-search-form" onSubmit={submitSearch}>
      <label>
        Travel type
        <select
          value={kind}
          onChange={(event) => navigate(`/search/${event.target.value}`)}
        >
          {kinds.map((item) => (
            <option key={item} value={item}>
              {item[0].toUpperCase() + item.slice(1)}
            </option>
          ))}
        </select>
      </label>

      {!accommodationKinds.includes(kind) && (
        <label>
          From
          <input
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            placeholder={kind === 'flights' ? 'DEL' : 'Delhi'}
          />
        </label>
      )}

      <label>
        Destination
        <input
          value={to}
          onChange={(event) => setTo(event.target.value)}
          placeholder={kind === 'flights' ? 'GOI' : 'Jaipur'}
        />
      </label>

      {kind === 'flights' && (
        <label>
          Departure date
          <input
            type="date"
            value={departureDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setDepartureDate(event.target.value)}
          />
        </label>
      )}

      <label>
        Min price (₹)
        <input
          type="number"
          min="0"
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
          placeholder="Any"
        />
      </label>

      <label>
        Max price (₹)
        <input
          type="number"
          min="0"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
          placeholder="Any"
        />
      </label>

      <label>
        Minimum rating
        <select
          value={minRating}
          onChange={(event) => setMinRating(event.target.value)}
        >
          <option value="">Any rating</option>
          <option value="3">3+ stars</option>
          <option value="4">4+ stars</option>
          <option value="4.5">4.5+ stars</option>
        </select>
      </label>

      {!accommodationKinds.includes(kind) && (
        <>
          <label>
            Departure time
            <select value={departurePeriod} onChange={(event) => setDeparturePeriod(event.target.value)}>
              <option value="">Any time</option>
              <option value="morning">Morning (5 AM–12 PM)</option>
              <option value="afternoon">Afternoon (12–5 PM)</option>
              <option value="evening">Evening (5–9 PM)</option>
              <option value="night">Night (9 PM–5 AM)</option>
            </select>
          </label>
          <label>
            Maximum stops
            <select value={maxStops} onChange={(event) => setMaxStops(event.target.value)}>
              <option value="">Any</option>
              <option value="0">Non-stop</option>
              <option value="1">1 or fewer</option>
              <option value="2">2 or fewer</option>
            </select>
          </label>
          <label>
            Class or type
            <select value={travelClass} onChange={(event) => setTravelClass(event.target.value)}>
              <option value="">Any class</option>
              {(kind === 'trains'
                ? ['SL', '3A', '2A', '1A', 'CC']
                : kind === 'buses'
                  ? ['Volvo AC Sleeper', 'Semi-Sleeper']
                  : kind === 'cruises'
                    ? ['Standard Deck', 'Sea View']
                    : ['Economy', 'Business']
              ).map((value) => <option value={value} key={value}>{value}</option>)}
            </select>
          </label>
        </>
      )}

      <label>
        Sort by
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="price">Lowest price</option>
          <option value="priceDesc">Highest price</option>
          <option value="rating">Top rated</option>
          {!accommodationKinds.includes(kind) && <option value="departure">Earliest departure</option>}
        </select>
      </label>

      <label>
        Results per page
        <select value={limit} onChange={(event) => setLimit(event.target.value)}>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </label>

      <button type="submit">Search options</button>
    </form>
  )
}

export default function TravelSearch() {
  const { kind = 'flights' } = useParams()
  const [searchParams] = useSearchParams()
  const paramsKey = searchParams.toString()
  const requestKey = `${kind}?${paramsKey}`
  const navigate = useNavigate()

  const [result, setResult] = useState({
    key: '',
    options: [],
    page: 1,
    limit: 10,
    total: 0,
    error: '',
  })
  const [bookingOption, setBookingOption] = useState(null)
  const [travelerName, setTravelerName] = useState('')
  const [travelerEmail, setTravelerEmail] = useState('')
  const [travelerPhone, setTravelerPhone] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [couponCode, setCouponCode] = useState('')
  const [couponPercent, setCouponPercent] = useState(0)
  const [bookingError, setBookingError] = useState('')
  const [bookingResult, setBookingResult] = useState(null)
  const [submittingBooking, setSubmittingBooking] = useState(false)
  const [paying, setPaying] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('Instant UPI (GooglePay / PhonePe / Paytm)')
  const [paymentError, setPaymentError] = useState('')
  const [paymentMessage, setPaymentMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadOptions() {
      try {
        const response = await axios.get(`${API}/search/${kind}`, {
          params: Object.fromEntries(new URLSearchParams(paramsKey).entries()),
          signal: controller.signal,
        })

        setResult({
          key: requestKey,
          options: response.data.results,
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          error: '',
        })
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            options: [],
            page: 1,
            limit: 10,
            total: 0,
            error:
              requestError.response?.data?.message ||
              'Could not load travel options. Check that the backend is running.',
          })
        }
      }
    }

    loadOptions()
    return () => controller.abort()
  }, [kind, paramsKey, requestKey])

  const isLoading = result.key !== requestKey
  const title = kind[0]?.toUpperCase() + kind.slice(1)

  function changePage(nextPage) {
    const params = new URLSearchParams(paramsKey)
    params.set('page', String(nextPage))
    navigate(`/search/${kind}?${params.toString()}`)
  }

  function openBooking(option) {
    if (!sessionStorage.getItem('odysseyAccessToken')) {
      navigate('/login')
      return
    }

    setBookingError('')
    setBookingResult(null)
    setCouponCode(sessionStorage.getItem('odysseyGameCoupon') || '')
    setCouponPercent(Number(sessionStorage.getItem('odysseyGameDiscountPercent')) || 0)
    setBookingOption(option)
  }

  async function submitBooking(event) {
    event.preventDefault()

    if (!bookingOption) return

    const token = sessionStorage.getItem('odysseyAccessToken')
    setBookingError('')
    setSubmittingBooking(true)

    try {
      const response = await axios.post(
        `${API}/bookings`,
        {
          optionId: bookingOption._id,
          traveler: {
            name: travelerName,
            email: travelerEmail,
            phone: travelerPhone,
          },
          quantity: Number(quantity),
          couponCode: couponCode.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setBookingResult({ ...response.data.booking, paymentEnabled: response.data.paymentEnabled })
      showToast('Booking request saved. You can complete payment from this page.')
      sessionStorage.removeItem('odysseyGameCoupon')
      sessionStorage.removeItem('odysseyGameDiscountPercent')
      setBookingOption(null)
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('odysseyAccessToken')
        sessionStorage.removeItem('odysseyUser')
          window.dispatchEvent(new Event('odyssey-auth-change'))
        navigate('/login', { replace: true })
        return
      }

      setBookingError(
        requestError.response?.data?.message ||
          'Could not save the booking request. Please try again.',
      )
    } finally {
      setSubmittingBooking(false)
    }
  }

  async function simulatePayment(chosenMethod) {
    if (!bookingResult?._id) return

    const token = sessionStorage.getItem('odysseyAccessToken')
    setPaymentError('')
    setPaymentMessage('')
    setPaying(true)

    try {
      const response = await axios.post(
        `${API}/bookings/${bookingResult._id}/payment/simulate`,
        { paymentMethod: chosenMethod || paymentMethod },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      setBookingResult((current) => ({
        ...current,
        ...response.data.booking,
        pnr: response.data.pnr || response.data.booking.pnr,
        paymentEnabled: true,
      }))
      setPaymentMessage('✨ Payment confirmed! Your booking is officially secured.')
      showToast('Payment confirmed! Reservation secured.')
    } catch (err) {
      setPaymentError(
        err.response?.data?.message || 'Could not complete simulated payment. Please try again.',
      )
    } finally {
      setPaying(false)
    }
  }

  async function cancelPendingBooking() {
    if (!bookingResult?._id) return
    const confirmed = window.confirm('Cancel this pending booking request?')
    if (!confirmed) return

    const token = sessionStorage.getItem('odysseyAccessToken')
    setPaying(true)
    try {
      await axios.patch(
        `${API}/bookings/${bookingResult._id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setBookingResult(null)
      showToast('Booking request cancelled.')
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Could not cancel booking.')
    } finally {
      setPaying(false)
    }
  }

  async function payForBooking() {
    if (!bookingResult?._id) return

    const token = sessionStorage.getItem('odysseyAccessToken')
    setPaymentError('')
    setPaymentMessage('')
    setPaying(true)
    let checkoutOpened = false

    try {
      const orderResponse = await axios.post(
        `${API}/bookings/${bookingResult._id}/payment/order`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )

      if (orderResponse.data.simulationMode || !orderResponse.data.keyId) {
        return simulatePayment()
      }

      const checkoutReady = await loadRazorpayCheckout()
      if (!checkoutReady) throw new Error('Could not load Razorpay Checkout. Check your internet connection and try again.')

      const order = orderResponse.data
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Odyssey Travel',
        description: bookingResult.optionSnapshot?.name || 'Travel booking',
        order_id: order.id,
        prefill: {
          name: bookingResult.traveler?.name,
          email: bookingResult.traveler?.email,
          contact: bookingResult.traveler?.phone,
        },
        theme: { color: '#c79a48' },
        handler: async (paymentResponse) => {
          setPaying(true)
          try {
            const verifyResponse = await axios.post(
              `${API}/bookings/${bookingResult._id}/payment/verify`,
              paymentResponse,
              { headers: { Authorization: `Bearer ${token}` } },
            )
            setBookingResult((current) => ({
              ...current,
              ...verifyResponse.data.booking,
              paymentEnabled: true,
            }))
            setPaymentMessage('Payment confirmed. Your booking is confirmed.')
            showToast('Payment confirmed. Your booking is confirmed.')
          } catch (verificationError) {
            setPaymentError(
              verificationError.response?.data?.message ||
                'Payment was received, but confirmation could not be completed. Keep your booking reference and try again.',
            )
          } finally {
            setPaying(false)
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false)
            setPaymentMessage('Checkout closed. Your booking is still pending payment.')
          },
        },
      })
      checkout.on('payment.failed', (failure) => {
        setPaying(false)
        setPaymentError(failure.error?.description || 'Payment failed. Your booking remains pending.')
      })
      checkout.open()
      checkoutOpened = true
    } catch (requestError) {
      setPaymentError(
        requestError.response?.data?.message || requestError.message || 'Could not start payment. Your booking remains pending.',
      )
    } finally {
      if (!checkoutOpened) setPaying(false)
    }
  }

  const quantityNumber = Number(quantity) || 1
  const subtotal = bookingOption
    ? bookingOption.priceINR * quantityNumber
    : 0
  const discount = Math.round(subtotal * couponPercent / 100)
  const taxableAmount = subtotal - discount
  const gstRate = accommodationKinds.includes(bookingOption?.kind) ? 0.12 : 0.05
  const gst = Math.round(taxableAmount * gstRate)
  const total = taxableAmount + gst

  return (
    <main className="travel-search-page">
      <header className="travel-search-heading">
        <p className="eyebrow dark">PLAN YOUR WAY THERE</p>
        <h1>Search {title}</h1>
        <p>Compare estimated prices in Indian rupees.</p>
      </header>

      <SearchForm key={requestKey} kind={kind} paramsKey={paramsKey} />

      {isLoading && (
        <section className="travel-option-list" aria-label="Loading travel options" aria-busy="true" role="status">
          <span className="sr-only">Searching travel options…</span>
          {Array.from({ length: 4 }, (_, index) => <TravelOptionSkeleton key={index} />)}
        </section>
      )}

      {!isLoading && result.error && (
        <p className="page-message error-message" role="alert">
          {result.error}
        </p>
      )}

      {!isLoading && !result.error && result.options.length === 0 && (
        <p className="page-message">No options found. Try another destination.</p>
      )}

      {!isLoading && !result.error && result.options.length > 0 && (
        <>
          <p className="travel-results-summary" role="status">
            Showing {(result.page - 1) * result.limit + 1}–
            {Math.min(result.page * result.limit, result.total)} of {result.total} options
          </p>
          <section className="travel-option-list" aria-label={`${title} search results`}>
            {result.options.map((option) => (
              <article className="travel-option" key={option._id}>
              <div>
                <span className={option.estimated === false ? 'live-badge' : 'estimated-badge'}>
                  {option.estimated === false ? 'Live' : 'Estimated'}
                </span>
                <h2>{option.name}</h2>
                {option.estimated === false && (
                  <p className="travel-fare-note">
                    Live fare estimate for {option.departureDate || 'your selected date'}. Price and availability may change before ticketing.
                  </p>
                )}
                <p>
                  {option.origin ? `${option.origin} → ` : ''}
                  {option.destination}
                </p>
                {option.departureTime && (
                  <p>{option.departureTime} – {option.arrivalTime}</p>
                )}
                {option.travelClass && <p>Class: {option.travelClass}</p>}
                {option.amenities?.length > 0 && (
                  <p>Amenities: {option.amenities.join(', ')}</p>
                )}
                <p>Rating: {option.rating} / 5</p>
              </div>

              <div className="travel-option-action">
                <strong className="travel-option-price">
                  {inr.format(option.priceINR)}
                  {accommodationKinds.includes(kind) ? ' / night' : ''}
                </strong>
                <button
                  className="book-option-button"
                  type="button"
                  onClick={() => openBooking(option)}
                >
                  Book
                </button>
              </div>
              </article>
            ))}
          </section>
        </>
      )}

      {!isLoading && !result.error && result.total > result.limit && (
        <nav className="search-pagination" aria-label="Travel search pages">
          <button type="button" disabled={result.page <= 1} onClick={() => changePage(result.page - 1)}>
            Previous
          </button>
          <span>Page {result.page} of {Math.ceil(result.total / result.limit)}</span>
          <button
            type="button"
            disabled={result.page >= Math.ceil(result.total / result.limit)}
            onClick={() => changePage(result.page + 1)}
          >
            Next
          </button>
        </nav>
      )}

      {bookingOption && (
        <section className="booking-panel">
          <button
            className="booking-close"
            type="button"
            onClick={() => setBookingOption(null)}
            aria-label="Close booking form"
          >
            ×
          </button>

          <p className="eyebrow dark">BOOKING REQUEST</p>
          <h2>{bookingOption.name}</h2>
          <p>
            {bookingOption.origin ? `${bookingOption.origin} → ` : ''}
            {bookingOption.destination}
          </p>

          <form className="booking-form" onSubmit={submitBooking}>
            <label>
              Traveler name
              <input
                value={travelerName}
                onChange={(event) => setTravelerName(event.target.value)}
                minLength={2}
                maxLength={80}
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={travelerEmail}
                onChange={(event) => setTravelerEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Phone
              <input
                type="tel"
                value={travelerPhone}
                onChange={(event) => setTravelerPhone(event.target.value)}
                minLength={7}
                maxLength={20}
                required
              />
            </label>

            <label>
              {accommodationKinds.includes(kind) ? 'Rooms or units' : 'Travelers'}
              <input
                type="number"
                min="1"
                max="9"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </label>

            <label className="booking-coupon-field">
              Discount coupon
              <input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                maxLength={32}
                placeholder="Optional coupon code"
                autoComplete="off"
              />
            </label>

            <div className="booking-price-breakdown">
              <p>Subtotal <strong>{inr.format(subtotal)}</strong></p>
              {couponCode && couponPercent > 0 && (
                <p>Game coupon ({couponPercent}%) <strong>−{inr.format(discount)}</strong></p>
              )}
              <p>Estimated GST ({Math.round(gstRate * 100)}%) <strong>{inr.format(gst)}</strong></p>
              <p className="booking-total">Estimated total <strong>{inr.format(total)}</strong></p>
            </div>

            {bookingError && (
              <p className="error-message" role="alert">{bookingError}</p>
            )}

            <button type="submit" disabled={submittingBooking}>
              {submittingBooking ? 'Saving…' : 'Continue to payment'}
            </button>
          </form>
        </section>
      )}

      {bookingResult && (
        <section className={`booking-confirmation ${bookingResult.status === 'confirmed' ? 'confirmed-pass' : ''}`} role="status">
          {bookingResult.status === 'confirmed' ? (
            <div className="ticket-confirmation-wrapper">
              <div className="ticket-header-badge">
                <span className="badge-check">✓</span>
                <div>
                  <p className="eyebrow dark">ODYSSEY OFFICIAL RESERVATION PASS</p>
                  <h2 style={{ margin: '4px 0 6px', color: '#18262c' }}>Booking Confirmed!</h2>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#556872' }}>
                    Your voyage has been reserved. A confirmation summary was sent to <strong>{bookingResult.traveler?.email}</strong>.
                  </p>
                </div>
              </div>

              <div className="ticket-boarding-card">
                <div className="ticket-pnr-banner">
                  <div>
                    <span className="ticket-meta-label">BOOKING PNR / TICKET NUMBER</span>
                    <strong className="ticket-pnr-code">{bookingResult.pnr || `ODY-${bookingResult._id.slice(-6).toUpperCase()}`}</strong>
                  </div>
                  <div>
                    <span className="ticket-status-pill confirmed">● CONFIRMED & ISSUED</span>
                  </div>
                </div>

                <div className="ticket-details-grid">
                  <div className="ticket-field">
                    <span className="ticket-meta-label">RESERVATION / SERVICE</span>
                    <strong>{bookingResult.optionSnapshot?.name}</strong>
                    <span className="ticket-subtext">{bookingResult.optionSnapshot?.kind?.toUpperCase()}</span>
                  </div>

                  <div className="ticket-field">
                    <span className="ticket-meta-label">ROUTE / DESTINATION</span>
                    <strong>
                      {bookingResult.optionSnapshot?.origin ? `${bookingResult.optionSnapshot.origin} → ` : ''}
                      {bookingResult.optionSnapshot?.destination}
                    </strong>
                  </div>

                  <div className="ticket-field">
                    <span className="ticket-meta-label">LEAD TRAVELER</span>
                    <strong>{bookingResult.traveler?.name}</strong>
                    <span className="ticket-subtext">{bookingResult.quantity} Traveler{bookingResult.quantity > 1 ? 's' : ''}</span>
                  </div>

                  <div className="ticket-field">
                    <span className="ticket-meta-label">CONTACT INFO</span>
                    <strong>{bookingResult.traveler?.phone}</strong>
                    <span className="ticket-subtext">{bookingResult.traveler?.email}</span>
                  </div>

                  <div className="ticket-field">
                    <span className="ticket-meta-label">PAYMENT REFERENCE</span>
                    <span className="ticket-ref-code">{bookingResult.paymentId || 'pay_verified'}</span>
                    <span className="ticket-subtext">{bookingResult.paymentMethod || 'Online Verified Payment'}</span>
                  </div>

                  <div className="ticket-field">
                    <span className="ticket-meta-label">TOTAL PAID</span>
                    <strong className="ticket-amount">{inr.format(bookingResult.totalINR)}</strong>
                    {bookingResult.couponCode && (
                      <span className="ticket-subtext" style={{ color: '#2e7d32', fontWeight: 600 }}>
                        Coupon {bookingResult.couponCode} applied (−{inr.format(bookingResult.discountINR)})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="ticket-actions-row">
                <button type="button" className="ticket-action-btn primary" onClick={() => window.print()}>
                  🖨️ Print / Save E-Ticket (PDF)
                </button>
                <button type="button" className="ticket-action-btn secondary" onClick={() => navigate('/my-journeys')}>
                  🎒 View in My Journeys
                </button>
                <button type="button" className="ticket-action-btn tertiary" onClick={() => setBookingResult(null)}>
                  🔍 Search Another Trip
                </button>
              </div>
            </div>
          ) : (
            <div className="pending-payment-wrapper">
              <h2>Booking Request Saved</h2>
              <p>Reference: <strong>{bookingResult._id}</strong></p>
              {bookingResult.couponCode && (
                <p>Coupon {bookingResult.couponCode} applied: −<strong>{inr.format(bookingResult.discountINR)}</strong></p>
              )}
              <p>Total: <strong>{inr.format(bookingResult.totalINR)}</strong></p>
              <p>Status: <strong style={{ color: '#e65100' }}>Pending payment</strong>. Complete checkout below to issue your ticket.</p>

              <div className="sandbox-payment-selector">
                <p style={{ fontWeight: 700, margin: '14px 0 8px', fontSize: '0.92rem' }}>
                  Select Payment Option (Test & Sandbox Mode):
                </p>

                <div className="payment-options-grid">
                  {[
                    { id: 'upi', label: '⚡ Instant UPI (GooglePay / PhonePe / Paytm)', val: 'Instant UPI (GooglePay / PhonePe)' },
                    { id: 'card', label: '💳 Credit / Debit Card (Visa / Mastercard)', val: 'Credit / Debit Card' },
                    { id: 'netbanking', label: '🏛️ NetBanking (All Indian Banks)', val: 'NetBanking' },
                  ].map((m) => (
                    <label
                      key={m.id}
                      className={`payment-option-pill ${paymentMethod === m.val ? 'active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="sandboxPaymentMethod"
                        value={m.val}
                        checked={paymentMethod === m.val}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>

                <div className="payment-buttons-group">
                  <button
                    type="button"
                    className="complete-pay-btn"
                    onClick={() => simulatePayment(paymentMethod)}
                    disabled={paying}
                  >
                    {paying ? 'Processing Payment…' : `Pay ${inr.format(bookingResult.totalINR)} & Confirm Ticket`}
                  </button>

                  <button
                    type="button"
                    className="cancel-pending-btn"
                    onClick={cancelPendingBooking}
                    disabled={paying}
                  >
                    Cancel Request
                  </button>
                </div>
              </div>

              {paymentError && <p className="error-message" role="alert">{paymentError}</p>}
              {paymentMessage && <p role="status">{paymentMessage}</p>}
            </div>
          )}
        </section>
      )}
    </main>
  )
}
