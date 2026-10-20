const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const travelRoutes = require('./routes/travel.routes');
const chatbotRoutes = require('./routes/chatbot.routes');
const weatherRoutes = require('./routes/weather.routes');
const gameRoutes = require('./routes/game.routes');
const suggestionsRoutes = require('./routes/suggestions.routes');
const { dbConnected } = require('./config/db');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:4200',
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Auth endpoints get a tighter rate limit to slow down brute-force attempts.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
app.use('/api/auth', authLimiter, authRoutes);

app.use('/api/travel', travelRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/suggestions', suggestionsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: dbConnected() ? 'connected' : 'disconnected' });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
