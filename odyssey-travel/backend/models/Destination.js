
const mongoose = require('mongoose')

const spotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    imageUrl: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { _id: false },
)

const destinationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    state: { type: String, default: '' },
    description: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    famousSpots: [spotSchema],
    bestTimeToVisit: { type: String, default: '' },
    averageDailyBudgetINR: { type: Number, default: 0 },
    attractions: [{ type: String }],
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    nearestAirport: { type: String, default: '' },
    nearestRailwayStation: { type: String, default: '' },
    photoCredit: { type: String, default: '' },
    photoSourceUrl: { type: String, default: '' },
    wikipediaUrl: { type: String, default: '' },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Destination', destinationSchema)