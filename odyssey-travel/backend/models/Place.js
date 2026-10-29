
const mongoose = require('mongoose')

// Schema for storing place and location details
const placeSchema = new mongoose.Schema(
  {
    // Provider used to retrieve place information
    provider: { type: String, required: true, default: 'photon' },
    providerId: { type: String, required: true },

    // Basic place information
    name: { type: String, required: true, trim: true },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },

    // Geographic coordinates of the place
    coordinates: {
      latitude: Number,
      longitude: Number,
    },

    // Timestamp of the last time the place was seen
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

// Ensure each provider and provider ID combination is unique
placeSchema.index({ provider: 1, providerId: 1 }, { unique: true })

// Enable text search across place names and locations
placeSchema.index({
  name: 'text',
  city: 'text',

})

// Export the Place model
module.exports = mongoose.model('Place', placeSchema)
