const mongoose = require('mongoose');

// Whether the last connection attempt succeeded. Routes that need the
// database (auth, game) check this and return a clear 503 instead of
// hanging or crashing when Mongo isn't reachable yet.
let isConnected = false;

function dbConnected() {
  return isConnected;
}

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('[db] MONGO_URI not set — auth and the mini-game will be unavailable.');
    return;
  }

  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log('[db] connected to MongoDB');
  });
  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[db] disconnected from MongoDB');
  });
  mongoose.connection.on('error', (err) => {
    isConnected = false;
    console.error('[db] connection error:', err.message);
  });

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    isConnected = false;
    console.error(
      `[db] could not connect to MongoDB at startup (${err.message}). ` +
        'The server will keep running — weather/travel/chatbot demo routes still work — ' +
        'but auth and the mini-game need a database. Start MongoDB and restart the server.',
    );
  }
}

module.exports = { connectDB, dbConnected };
