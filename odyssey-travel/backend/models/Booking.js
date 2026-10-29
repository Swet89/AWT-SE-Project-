const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    option: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TravelOption',
      required: true,
    },

    optionSnapshot: {
      kind: { type: String, required: true },
      name: { type: String, required: true },
      origin: { type: String, default: '' },
      destination: { type: String, required: true },
      priceINR: { type: Number, required: true },
    },

    traveler: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 9,
    },

    subtotalINR: { type: Number, required: true },
    gstRate: { type: Number, required: true },
    gstINR: { type: Number, required: true },
    totalINR: { type: Number, required: true },

    discountINR: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },


    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'cancelled'],
      default: 'pending_payment',
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Booking', bookingSchema)
