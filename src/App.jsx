import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import Home from './pages/Home.jsx'
import Destinations from './pages/Destinations.jsx'
import DestinationDetails from './pages/DestinationDetails.jsx'
import MyJourneys from './pages/MyJourneys.jsx'
import Auth from './pages/Auth.jsx'
import TravelSearch from './pages/TravelSearch.jsx'
import Contact from './pages/Contact.jsx'
import Wayfinder from './pages/Wayfinder.jsx'
import DevTeam from './pages/DevTeam.jsx'
import BackgroundMusic from './components/BackgroundMusic.jsx'
import ScrollExperience from './components/ScrollExperience.jsx'
import CustomCursor from './components/CustomCursor.jsx'
import ToastViewport from './components/ToastViewport.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { signOutSession } from './lib/authRefresh.js'

const ContestOfBow = lazy(() => import('./pages/ContestOfBow.jsx'))

function NotFound() {
  return (
    <main className="not-found-page">
      <p className="eyebrow dark">THE MAP ENDS HERE</p>
      <span className="not-found-code" aria-hidden="true">404</span>
      <h1>This page has drifted off course.</h1>
      <p>The address may be old, or the page may have moved. Let’s find your way back.</p>
      <div className="not-found-actions">
        <Link to="/">Return home</Link>
        <Link to="/destinations">Explore destinations</Link>
      </div>
    </main>
  )
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSignedIn, setIsSignedIn] = useState(() =>
    Boolean(sessionStorage.getItem('odysseyAccessToken')),
  )
  const [theme, setTheme] = useState(() => localStorage.getItem('odysseyTheme') || 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('odysseyTheme', theme)
  }, [theme])

  useEffect(() => {
    function syncAuthState() {
      setIsSignedIn(Boolean(sessionStorage.getItem('odysseyAccessToken')))
    }

    window.addEventListener('odyssey-auth-change', syncAuthState)
    window.addEventListener('storage', syncAuthState)

    return () => {
      window.removeEventListener('odyssey-auth-change', syncAuthState)
      window.removeEventListener('storage', syncAuthState)
    }
  }, [])

  async function signOut() {
    await signOutSession()
    setIsSignedIn(false)
    navigate('/login')
  }

  return (
    <>
      <nav className="navbar">
        <Link className="brand" to="/">
          ODYSSEY TRAVEL
        </Link>

        <div className="nav-links">
          <Link to="/destinations">Destinations</Link>
          {isSignedIn ? (
            <>
              <Link to="/journeys">My journeys</Link>
              <Link to="/contest">Contest</Link>
              <button className="nav-signout-button" type="button" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login">Sign in</Link>
          )}
          <Link to="/search/flights">Travel search</Link>
          <Link to="/wayfinder">Wayfinder</Link>
          <Link to="/team">Dev team</Link>
          <Link to="/contact">Contact</Link>
          <button
            className="nav-control-button"
            type="button"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-pressed={theme === 'dark'}
          >
            {theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
          <BackgroundMusic />
        </div>
      </nav>

      <ScrollExperience />
      <CustomCursor />
      <ToastViewport />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          className="route-transition"
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/destinations/:id" element={<DestinationDetails />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        <Route path="/search/:kind" element={<TravelSearch />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/team" element={<DevTeam />} />

        <Route
          path="/journeys"
          element={
            <ProtectedRoute>
              <MyJourneys />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wayfinder"
          element={
            <ProtectedRoute>
              <Wayfinder />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contest"
          element={
            <ProtectedRoute>
              <Suspense fallback={<main className="page-message">Loading the contest…</main>}>
                <ContestOfBow />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
