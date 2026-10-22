const mongoose = require('mongoose')

const travelOptionSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ['flights', 'trains', 'buses', 'cruises', 'hotels', 'rentals', 'hostels'],
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    origin: { type: String, default: '' },
    destination: { type: String, required: true, trim: true, index: true },
    departureTime: { type: String, default: '' },
    arrivalTime: { type: String, default: '' },
    departureDate: { type: String, default: '' },
    priceINR: { type: Number, required: true, min: 0 },
    stops: { type: Number, default: 0 },
    travelClass: { type: String, default: '' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    imageUrl: { type: String, default: '' },
    amenities: [{ type: String }],
    estimated: { type: Boolean, default: true },
    provider: { type: String, default: 'seed' },
    providerOfferId: { type: String, default: '' },
    offerExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
)

module.exports = mongoose.model('TravelOption', travelOptionSchema)
