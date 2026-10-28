import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API } from '../lib/api.js'
import { showToast } from '../lib/toast.js'

export default function Auth() {
  const location = useLocation()
  const navigate = useNavigate()
  const isSignup = location.pathname === '/signup'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const endpoint = isSignup ? 'signup' : 'login'
      const response = await axios.post(
        `${API}/auth/${endpoint}`,
        { name, email, password },
        { withCredentials: true },
      )

      sessionStorage.setItem('odysseyAccessToken', response.data.accessToken)
      sessionStorage.setItem('odysseyUser', JSON.stringify(response.data.user))
      window.dispatchEvent(new Event('odyssey-auth-change'))
      showToast(isSignup ? 'Your Odyssey account is ready.' : 'Welcome back.')
      navigate('/journeys')
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Could not connect to the server. Check that the backend is running.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow dark">YOUR JOURNEY STARTS HERE</p>
        <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-intro">
          {isSignup
            ? 'Sign up to start saving your travel plans.'
            : 'Sign in to continue planning your travels.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup && (
            <label>
              Name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={80}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              maxLength={128}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
            />
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting
              ? 'Please wait…'
              : isSignup
                ? 'Create account'
                : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : 'New to Odyssey Travel?'}{' '}
          <Link to={isSignup ? '/login' : '/signup'}>
            {isSignup ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </section>
    </main>
  )
}
