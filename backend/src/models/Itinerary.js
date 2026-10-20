const mongoose = require('mongoose');

const dayPlanSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    activities: [{ type: String }],
  },
  { _id: false },
);

const itinerarySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    destination: { type: String, required: true },
    startDate: { type: String },
    summary: { type: String },
    days: [dayPlanSchema],
    demoMode: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Itinerary', itinerarySchema);
