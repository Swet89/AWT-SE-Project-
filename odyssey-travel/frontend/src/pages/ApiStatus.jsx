import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { API } from '../lib/api.js'

export default function ApiStatus() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [latency, setLatency] = useState(null)

  function checkStatus() {
    setLoading(true)
    setError('')
    const start = performance.now()
    axios
      .get(`${API}/health`)
      .then((response) => {
        setLatency(Math.round(performance.now() - start))
        setData(response.data)
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'API service is currently unreachable.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <main className="welcome-page" style={{ maxWidth: '680px', margin: 'clamp(4rem, 6vw, 6rem) auto 4rem', padding: '0 1.5rem' }}>
      <header style={{ textAlign: 'center', marginBottom: 'clamp(4.5rem, 7vw, 6.5rem)' }}>
        <p className="eyebrow dark" style={{ marginBottom: '0.65rem' }}>SYSTEM DIAGNOSTICS</p>
        <h1 style={{ fontFamily: 'var(--font-heading, "Cinzel", Georgia, serif)', fontSize: 'clamp(2.2rem, 4.5vw, 3.25rem)', margin: '0.5rem 0 1rem' }}>
          Odyssey System Health
        </h1>
        <p style={{ maxWidth: '540px', margin: '0 auto', color: 'var(--text-muted, #666)', fontSize: '1.05rem', lineHeight: 1.65 }}>
          Live health and connectivity check for backend services, database clusters, and AI engines.
        </p>
      </header>

      <div style={{
        padding: '2.25rem',
        borderRadius: '18px',
        border: '1px solid var(--border, #e2d9cc)',
        background: 'var(--surface, #ffffff)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.04)'
      }}>
        {loading ? (
          <p>Pinging services…</p>
        ) : error ? (
          <div style={{ color: '#d9534f' }}>
            <p><strong>Status: Degraded / Offline</strong></p>
            <p>{error}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border, #eee)', paddingBottom: '0.75rem' }}>
              <span>API Gateway</span>
              <strong style={{ color: '#2e7d32' }}>● Operational ({data.status})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border, #eee)', paddingBottom: '0.75rem' }}>
              <span>Database (MongoDB)</span>
              <strong style={{ color: data.database === 'connected' ? '#2e7d32' : '#d9534f' }}>
                {data.database === 'connected' ? '● Connected' : '○ Disconnected'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border, #eee)', paddingBottom: '0.75rem' }}>
              <span>Ping Latency</span>
              <span>{latency} ms</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Server Message</span>
              <span style={{ fontStyle: 'italic' }}>{data.message}</span>
            </div>
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={checkStatus}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '999px',
              border: 'none',
              background: 'var(--gold, #b58b4a)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Recheck status
          </button>
          <Link to="/" style={{ color: 'var(--text-muted, #666)' }}>← Return home</Link>
        </div>
      </div>
    </main>
  )
}
