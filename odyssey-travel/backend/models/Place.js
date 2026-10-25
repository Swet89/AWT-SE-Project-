const mongoose = require('mongoose')

const placeSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, default: 'photon' },
    providerId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

placeSchema.index({ provider: 1, providerId: 1 }, { unique: true })
placeSchema.index({ name: 'text', city: 'text', state: 'text', country: 'text' })

module.exports = mongoose.model('Place', placeSchema)
