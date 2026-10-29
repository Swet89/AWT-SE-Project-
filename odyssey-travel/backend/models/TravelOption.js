
const mongoose = require('mongoose')

// Schema for storing different travel options
const travelOptionSchema = new mongoose.Schema(
  {
    // Type of travel service available
    kind: {
      type: String,
      enum: ['flights', 'trains', 'buses', 'cruises', 'hotels', 'rentals', 'hostels'],
      required: true,
      index: true,
    },

    // Basic travel option details
    name: { type: String, required: true, trim: true },
    origin: { type: String, default: '' },
    destination: { type: String, required: true, trim: true, index: true },

    // Departure and arrival information
    departureTime: { type: String, default: '' },
    arrivalTime: { type: String, default: '' },
    departureDate: { type: String, default: '' },

    // Pricing and travel details
    priceINR: { type: Number, required: true, min: 0 },
    stops: { type: Number, default: 0 },
    travelClass: { type: String, default: '' },

    // Rating and display information
    rating: { type: Number, default: 0, min: 0, max: 5 },
    imageUrl: { type: String, default: '' },
    amenities: [{ type: String }],

    // Information about pricing estimates and providers
 
  },
  { timestamps: true },
)

// Export the TravelOption model
module.exports = mongoose.model('TravelOption', travelOptionSchema)

