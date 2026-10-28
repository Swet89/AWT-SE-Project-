import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { API } from '../lib/api.js'
import { showToast } from '../lib/toast.js'

const inquirySubjects = [
  'AI Trip Planning & Itinerary Advice',
  'Custom Tour & Group Package',
  'Booking & Payment Support',
  'Destination & Weather Inquiries',
  'Partnership & Hotel Listing',
  'Other Inquiries',
]

const faqs = [
  {
    q: 'How does the Smart AI Wayfinder work?',
    a: 'Our Wayfinder takes your target destination, budget, trip duration, and travel style to curate balanced morning-to-night day plans, estimating activities and local experiences suited to your pace.',
  },
  {
    q: 'Can I customize an AI-generated itinerary?',
    a: 'Yes! Once generated, you can save your itinerary to your Odyssey account, export it, or modify activities and budget preferences at any time.',
  },
  {
    q: 'How do bookings and payments work?',
    a: 'Bookings are created securely through our travel portal. If test payment mode is enabled, test transactions can be completed via Razorpay. Otherwise, bookings remain securely queued in your account.',
  },
  {
    q: 'How quickly does the Odyssey team respond to inquiries?',
    a: 'Our travel concierges typically review and respond to inquiries within 4 to 12 hours.',
  },
]

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: inquirySubjects[0],
    destinationInterest: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [ticket, setTicket] = useState(null)
  const [error, setError] = useState('')
  const [openFaq, setOpenFaq] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError('Please provide your name (at least 2 characters).')
      return
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please provide a valid email address.')
      return
    }

    if (!formData.message.trim() || formData.message.trim().length < 5) {
      setError('Please enter a message of at least 5 characters.')
      return
    }

    setSubmitting(true)
    try {
      const response = await axios.post(`${API}/contact`, formData)
      setTicket(response.data)
      showToast('Inquiry submitted successfully!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit inquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="contact-page" style={{ maxWidth: '1120px', margin: 'clamp(4rem, 6vw, 6.5rem) auto 7rem', padding: '0 clamp(1.5rem, 3.5vw, 3rem)' }}>
      <header className="contact-heading" style={{ textAlign: 'center', marginBottom: 'clamp(5.5rem, 9vw, 8.5rem)' }}>
        <p className="eyebrow dark" style={{ marginBottom: '1rem', letterSpacing: '0.14em' }}>WE’RE HERE FOR YOUR JOURNEY</p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 3.85rem)', margin: '0.75rem 0 1.5rem', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
          Connect with Odyssey Concierge
        </h1>
        <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--text-muted, #555)', fontSize: '1.18rem', lineHeight: 1.75 }}>
          Have questions about an upcoming voyage, personalized AI trip curation, or special booking requests? Let us know.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 'clamp(2.25rem, 4vw, 3.5rem)', alignItems: 'start' }}>
        {/* Left Column: Form or Success Card */}
        <section
          style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e5ded3)',
            borderRadius: '24px',
            padding: 'clamp(2rem, 3.5vw, 3rem)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.05)',
          }}
        >
          {ticket ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✨</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold, #b58b4a)', marginBottom: '0.75rem' }}>
                Inquiry Received!
              </h2>
              <p style={{ color: 'var(--text-muted, #555)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                {ticket.message}
              </p>
              <div
                style={{
                  background: 'var(--bg-muted, #faf8f5)',
                  border: '1px dashed var(--border, #ddd)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '2rem',
                  fontSize: '0.9rem',
                  color: 'var(--text, inherit)',
                }}
              >
                <div><strong>Ticket Reference:</strong> <code>{ticket.ticketId}</code></div>
                <div style={{ color: 'var(--text-muted, #777)', marginTop: '0.35rem' }}>
                  Received at: {new Date(ticket.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTicket(null)
                  setFormData({
                    name: '',
                    email: '',
                    subject: inquirySubjects[0],
                    destinationInterest: '',
                    message: '',
                  })
                }}
                style={{
                  padding: '0.75rem 1.75rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: 'var(--navy, #10232d)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', margin: 0 }}>
                Send us a message
              </h2>

              {error && (
                <div
                  style={{
                    padding: '0.85rem 1.25rem',
                    background: 'rgba(211, 47, 47, 0.12)',
                    color: '#f08070',
                    border: '1px solid rgba(239, 83, 80, 0.3)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                  }}
                >
                  {error}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Penelope Cruz"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #d8d0c4)',
                    background: 'transparent',
                    color: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #d8d0c4)',
                    background: 'transparent',
                    color: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Inquiry Topic
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border, #d8d0c4)',
                      background: 'var(--surface, #fff)',
                      color: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  >
                    {inquirySubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Destination (optional)
                  </label>
                  <input
                    type="text"
                    name="destinationInterest"
                    value={formData.destinationInterest}
                    onChange={handleChange}
                    placeholder="e.g. Goa, Athens, Kyoto"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border, #d8d0c4)',
                      background: 'transparent',
                      color: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Your Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Tell us about your travel dates, preferred travel styles, or any question you have…"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #d8d0c4)',
                    background: 'transparent',
                    color: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '0.85rem 1.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--navy, #10232d)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: submitting ? 'wait' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {submitting ? 'Submitting…' : 'Submit Traveler Inquiry →'}
              </button>
            </form>
          )}
        </section>

        {/* Right Column: Direct Info & FAQs */}
        <section style={{ display: 'grid', gap: '1.75rem' }}>
          {/* Quick Contact Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                padding: '1.4rem 1.25rem',
                borderRadius: '16px',
                background: 'var(--surface, #ffffff)',
                border: '1px solid var(--border, #e5ded3)',
                boxSizing: 'border-box',
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>✉️</div>
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem' }}>Direct Concierge</h3>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-muted, #666)' }}>
                Email inquiries & support
              </p>
              <a
                href="mailto:concierge@odysseytravel.ai"
                title="concierge@odysseytravel.ai"
                style={{
                  display: 'inline-block',
                  maxWidth: '100%',
                  fontWeight: 600,
                  color: 'var(--gold, #b58b4a)',
                  textDecoration: 'none',
                  fontSize: 'clamp(0.78rem, 2vw, 0.88rem)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  lineHeight: 1.35,
                }}
              >
                concierge@odysseytravel.ai
              </a>
            </div>

            <div
              style={{
                padding: '1.4rem 1.25rem',
                borderRadius: '16px',
                background: 'var(--surface, #ffffff)',
                border: '1px solid var(--border, #e5ded3)',
                boxSizing: 'border-box',
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📞</div>
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem' }}>Traveler Hotline</h3>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-muted, #666)' }}>
                Mon–Sat, 9:00–20:00 IST
              </p>
              <a
                href="tel:+919724282267"
                style={{
                  display: 'inline-block',
                  maxWidth: '100%',
                  fontWeight: 600,
                  color: 'var(--gold, #b58b4a)',
                  textDecoration: 'none',
                  fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)',
                }}
              >
                +91 97242 82267
              </a>
            </div>
          </div>

          {/* Quick FAQ Section */}
          <div
            style={{
              padding: '1.75rem',
              borderRadius: '20px',
              background: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e5ded3)',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontFamily: 'var(--font-heading)' }}>
              Frequently Asked Questions
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i
                return (
                  <div
                    key={i}
                    style={{
                      border: '1px solid var(--border, #eee)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.85rem 1rem',
                        background: isOpen ? 'var(--bg-muted, #faf8f5)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'inherit',
                      }}
                    >
                      <span>{faq.q}</span>
                      <span style={{ fontSize: '1.1rem', color: 'var(--gold, #b58b4a)' }}>
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                    {isOpen && (
                      <div
                        style={{
                          padding: '0.85rem 1rem 1rem',
                          fontSize: '0.88rem',
                          color: 'var(--text-muted, #555)',
                          lineHeight: 1.5,
                          background: 'var(--bg-muted, #faf8f5)',
                        }}
                      >
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <Link to="/" style={{ color: 'var(--text-muted, #666)', fontSize: '0.9rem', textDecoration: 'none' }}>
              ← Return to Odyssey Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
