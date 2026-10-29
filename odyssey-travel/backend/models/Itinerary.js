const mongoose = require('mongoose')

// Schema for individual activities in a day's itinerary
const activitySchema = new mongoose.Schema(
  {
    time: { type: String, required: true },
    place: { type: String, required: true },
    description: { type: String, required: true },
    estimatedCostINR: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
)

// Schema for each day of the itinerary
const daySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    theme: { type: String, required: true },
    activities: { type: [activitySchema], default: [] },
  },
  { _id: false },
)

// Main schema for storing user itineraries
const itinerarySchema = new mongoose.Schema(
  {
    // User who owns the itinerary
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Destination associated with the itinerary
  
    // Basic itinerary information
    destinationName: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },

    // Day-wise travel plan
    days: { type: [daySchema], required: true },

    // Estimated trip budget in Indian Rupees
    totalEstimatedCostINR: { type: Number, min: 0, default: 0 },
    budgetNote: { type: String, default: '' },
  },
  { timestamps: true },
)

// Export the Itinerary model for use in other files
module.exports = mongoose.model('Itinerary', itinerarySchema)

