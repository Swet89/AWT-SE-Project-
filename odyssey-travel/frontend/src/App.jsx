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
import ApiStatus from './pages/ApiStatus.jsx'
import BackgroundMusic from './components/BackgroundMusic.jsx'
import ScrollExperience from './components/ScrollExperience.jsx'
import CustomCursor from './components/CustomCursor.jsx'
import ToastViewport from './components/ToastViewport.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AiTravelConcierge from './components/AiTravelConcierge.jsx'
import { signOutSession } from './lib/authRefresh.js'

const ContestOfBow = lazy(() => import('./pages/ContestOfBow.jsx'))

const routeTitles = {
  '/': 'Odyssey — Smart AI Tourism Planner & Travel Concierge',
  '/destinations': '50+ Global Destinations | Odyssey Travel',
  '/login': 'Sign In | Odyssey Travel',
  '/signup': 'Create Traveler Account | Odyssey Travel',
  '/wayfinder': 'Wayfinder AI Itinerary Planner | Odyssey Travel',
  '/journeys': 'My Journeys & Booking History | Odyssey Travel',
  '/contest': 'Contest of the Bow — Travel Rewards | Odyssey Travel',
  '/team': 'Engineering Architecture & Creators | Odyssey Travel',
  '/contact': 'Odyssey Concierge & Traveler Support | Odyssey Travel',
  '/status': 'System Diagnostics & Health | Odyssey Travel',
}

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
  const [menuOpen, setMenuOpen] = useState(false)

  // Sync document title with current route
  useEffect(() => {
    const title = routeTitles[location.pathname] ||
      (location.pathname.startsWith('/destinations/') ? 'Destination Details | Odyssey Travel' :
       location.pathname.startsWith('/search/') ? 'Live Travel Search | Odyssey Travel' :
       'Odyssey — Smart AI Tourism Planner')
    document.title = title
    setMenuOpen(false) // Auto-close mobile drawer on route navigation
  }, [location.pathname])

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
    setMenuOpen(false)
    navigate('/login')
  }

  return (
    <>
      <nav className="navbar" aria-label="Main Navigation">
        <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">Ω</span>
          ODYSSEY TRAVEL
        </Link>

        {/* Mobile Hamburger Toggle */}
        <button
          className="nav-hamburger"
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Navigation Links (Desktop bar / Mobile slide-out drawer) */}
        <div className={`nav-links ${menuOpen ? 'mobile-open' : ''}`}>
          <Link to="/destinations">Destinations</Link>
          <Link to="/search/flights">Travel search</Link>
          <Link to="/wayfinder">Wayfinder AI</Link>

          {isSignedIn && (
            <>
              <Link to="/journeys">My journeys</Link>
              <Link to="/contest">Contest</Link>
            </>
          )}

          <Link to="/team">About & Tech</Link>
          <Link to="/contact">Concierge</Link>

          <div className="nav-actions-row">
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

          {isSignedIn ? (
            <button className="nav-signout-button" type="button" onClick={signOut}>
              Sign out
            </button>
          ) : (
            <Link to="/login" className="nav-signout-button" onClick={() => setMenuOpen(false)}>
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <ScrollExperience />
      <CustomCursor />
      <ToastViewport />
      <motion.div
        className="route-transition"
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
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
          <Route path="/status" element={<ApiStatus />} />

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

      <AiTravelConcierge />
    </>
  )
}
