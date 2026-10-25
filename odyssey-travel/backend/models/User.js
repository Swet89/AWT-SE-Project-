const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    refreshTokenHash: {
      type: String,
      default: undefined,
      select: false,
    },
    gamePlayed: { type: Boolean, default: false },
    gameScore: { type: Number, min: 0, max: 12, default: null },
    gameCouponCode: { type: String, default: '' },
    gameDiscountPercent: { type: Number, min: 0, max: 15, default: 0 },
    gameCouponRedeemedAt: { type: Date, default: null },
    gameCouponBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Destination',
      },
    ],
  },
  { timestamps: true },
)

module.exports = mongoose.model('User', userSchema)
