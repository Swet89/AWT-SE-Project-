import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { API } from '../lib/api.js'

function formatMessage(text) {
  if (!text) return ''
  return text.split('\n').map((line, idx) => {
    const cleanLine = line
    if (cleanLine.startsWith('### ')) {
      return (
        <h4 key={idx} style={{ margin: '8px 0 4px', fontSize: '0.96rem', fontWeight: 700, color: 'var(--gold, #b58b4a)' }}>
          {cleanLine.replace('### ', '')}
        </h4>
      )
    }

    const parts = cleanLine.split(/(\*\*.*?\*\*|\*.*?\*)/g)
    return (
      <span key={idx} style={{ display: 'block', minHeight: line.trim() ? undefined : '0.5rem' }}>
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pIdx} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</strong>
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={pIdx} style={{ opacity: 0.9 }}>{part.slice(1, -1)}</em>
          }
          return part
        })}
      </span>
    )
  })
}

export default function AiTravelConcierge({ destinationId, destinationName, initialPrompt }) {
  const token = sessionStorage.getItem('odysseyAccessToken')
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: destinationName
        ? `Greetings! I am your Odyssey AI Concierge for **${destinationName}**. Ask me about hidden gems, local delicacies, day-by-day packing, or personalized itinerary tweaks!`
        : `Greetings traveler! I am your Odyssey AI Concierge. I have your AI Travel Profile synced. What voyages are we dreaming up today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'Odyssey Intelligence',
      suggestedActions: destinationName
        ? [`Top attractions in ${destinationName}`, `Evening cafe recommendations in ${destinationName}`, `Suggest best local food spots`]
        : ['Evening cafe recommendations', 'Beach trip under ₹40,000', 'Top cultural getaways'],
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const chatBottomRef = useRef(null)
  const messagesContainerRef = useRef(null)

  useEffect(() => {
    if (initialPrompt && !isOpen) {
      setIsOpen(true)
      sendMessage(initialPrompt)
    }
  }, [initialPrompt])

  useEffect(() => {
    if (isOpen) {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      } else {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [messages, isOpen])

  async function sendMessage(textToSend) {
    const text = (textToSend || input).trim()
    if (!text || sending) return

    const userMsg = {
      id: String(Date.now()),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const response = await axios.post(
        `${API}/chat/message`,
        {
          message: text,
          destinationId: destinationId || undefined,
          conversationHistory: messages.map((m) => ({ sender: m.sender, text: m.text })),
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )

      const aiMsg = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: response.data.reply,
        source: response.data.source || 'Odyssey AI',
        suggestedActions: response.data.suggestedActions || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      const errorMsg = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: 'I could not connect to the Odyssey AI service right now. Please ensure you are signed in or try again in a moment.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open AI Concierge Chat"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 998,
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          background: 'var(--navy, #10232d)',
          color: 'var(--gold, #b58b4a)',
          border: '2px solid var(--gold, #b58b4a)',
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.28)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.6rem',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isOpen ? '✕' : '✨'}
      </button>

      {/* Floating Chat Window */}
      {isOpen && (
        <aside
          aria-label="Odyssey AI Travel Concierge"
          className="odyssey-chat-window"
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          style={{
            position: 'fixed',
            bottom: '92px',
            right: '24px',
            zIndex: 998,
            width: 'min(420px, calc(100vw - 32px))',
            height: 'min(580px, calc(100vh - 120px))',
            background: 'var(--surface, #ffffff)',
            borderRadius: '20px',
            border: '1px solid var(--border, #d8cfbe)',
            color: 'var(--text, #111111)',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.22)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'inherit',
          }}
        >
          {/* Chat Header */}
          <header
            style={{
              padding: '1rem 1.25rem',
              background: 'var(--navy, #10232d)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(228, 201, 142, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(228, 201, 142, 0.15)',
                  color: 'var(--gold, #b58b4a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                }}
              >
                Ω
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', letterSpacing: '0.5px', color: '#ffffff', fontWeight: 600 }}>
                  Odyssey AI Concierge
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#90caf9', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#4caf50' }}></span>
                  {destinationName ? `Focusing on ${destinationName}` : 'Synced with AI Travel Profile'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '4px',
              }}
              aria-label="Close chat"
            >
              ✕
            </button>
          </header>

          {/* Messages Scroll View */}
          <div
            ref={messagesContainerRef}
            className="odyssey-chat-messages"
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            onWheel={(e) => {
              e.stopPropagation()
            }}
            style={{
              flex: 1,
              minHeight: 0,
              padding: '1rem',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              background: 'var(--bg-muted, #faf8f5)',
              color: 'var(--text, #111111)',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
            }}
          >
            {messages.map((msg) => {
              const isMe = msg.sender === 'user'
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      padding: '0.85rem 1.15rem',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMe ? 'var(--navy, #10232d)' : 'var(--surface, #ffffff)',
                      color: isMe ? '#ffffff' : 'var(--text, #111111)',
                      border: isMe ? 'none' : '1px solid var(--border, #e5ded3)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      fontSize: '0.88rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {formatMessage(msg.text)}
                  </div>

                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: 'var(--text-muted, #888)',
                      marginTop: '3px',
                      display: 'flex',
                      gap: '6px',
                    }}
                  >
                    <span>{msg.time}</span>
                    {msg.source && <span style={{ color: 'var(--gold, #b58b4a)' }}>• {msg.source}</span>}
                  </div>

                  {/* Suggestion action pills for assistant messages */}
                  {!isMe && msg.suggestedActions?.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.35rem',
                        marginTop: '0.5rem',
                      }}
                    >
                      {msg.suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => sendMessage(action)}
                          style={{
                            padding: '0.3rem 0.65rem',
                            fontSize: '0.75rem',
                            borderRadius: '999px',
                            background: 'var(--surface, #ffffff)',
                            border: '1px solid var(--border, #d8cfbe)',
                            color: 'var(--text, #10232d)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--gold, #b58b4a)'
                            e.currentTarget.style.color = 'var(--gold, #b58b4a)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border, #d8cfbe)'
                            e.currentTarget.style.color = 'var(--text, #10232d)'
                          }}
                        >
                          {action} →
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {sending && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.65rem 0.95rem',
                  borderRadius: '16px 16px 16px 2px',
                  background: 'var(--surface, #ffffff)',
                  border: '1px solid var(--border, #e5ded3)',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted, #777)',
                  fontStyle: 'italic',
                }}
              >
                Odyssey Concierge is thinking… ✨
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            style={{
              padding: '0.75rem',
              background: 'var(--surface, #ffffff)',
              borderTop: '1px solid var(--border, #e5ded3)',
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={destinationName ? `Ask about ${destinationName}…` : 'Ask travel questions or tips…'}
              disabled={sending}
              style={{
                flex: 1,
                minHeight: '40px',
                padding: '0.5rem 0.85rem',
                fontSize: '0.88rem',
                borderRadius: '10px',
                border: '1px solid var(--border, #d8cfbe)',
                background: 'transparent',
                color: 'inherit',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              style={{
                padding: '0 1rem',
                minHeight: '40px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--navy, #10232d)',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: sending || !input.trim() ? 0.6 : 1,
              }}
            >
              Send
            </button>
          </form>
        </aside>
      )}
    </>
  )
}
