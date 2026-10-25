const mongoose = require('mongoose')

const activitySchema = new mongoose.Schema(
  {
    time: { type: String, required: true },
    place: { type: String, required: true },
    description: { type: String, required: true },
    estimatedCostINR: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
)

const daySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    theme: { type: String, required: true },
    activities: { type: [activitySchema], default: [] },
  },
  { _id: false },
)

const itinerarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      required: true,
    },
    destinationName: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    days: { type: [daySchema], required: true },
    totalEstimatedCostINR: { type: Number, min: 0, default: 0 },
    budgetNote: { type: String, default: '' },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Itinerary', itinerarySchema)