require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const mongoose = require('mongoose')
const { rateLimit } = require('express-rate-limit')
const {
  requestLogger,
  sanitizeInput,
  notFoundHandler,
  errorHandler,
} = require('./middleware/requestSafety')
const { ensureMongoRunning } = require('./utils/ensureMongo')

const authRouter = require('./routes/auth')
const destinationsRouter = require('./routes/destinations')
const placesRouter = require('./routes/places')
const favoritesRouter = require('./routes/favorites')
const searchRouter = require('./routes/search')
const bookingsRouter = require('./routes/bookings')
const weatherRouter = require('./routes/weather')
const chatRouter = require('./routes/chat')
const itinerariesRouter = require('./routes/itineraries')
const reviewsRouter = require('./routes/reviews')
const gameRouter = require('./routes/game')
const contactRouter = require('./routes/contact')

const app = express()
const port = process.env.PORT || 5000
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    message: 'Too many requests. Please wait a little and try again.',
    requestId: req.requestId,
  }),
})

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173']

app.use(helmet())
app.use(requestLogger)
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
)
app.use('/api', apiLimiter)
app.use(express.json({ limit: '1mb' }))
app.use(sanitizeInput)

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Odyssey Travel API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

app.use('/api/auth', authRouter)
app.use('/api/destinations', destinationsRouter)
app.use('/api/places', placesRouter)
app.use('/api/favorites', favoritesRouter)
app.use('/api/search', searchRouter)
app.use('/api/bookings', bookingsRouter)
app.use('/api/weather', weatherRouter)
app.use('/api/chat', chatRouter)
app.use('/api/itineraries', itinerariesRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/game', gameRouter)
app.use('/api/contact', contactRouter)

app.use('/api', notFoundHandler)
app.use(errorHandler)

async function startServer() {
  try {
    await ensureMongoRunning(process.env.MONGODB_URI)
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    app.listen(port, () => {
      console.log(`API server listening at http://localhost:${port}`)
    })
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

startServer()
