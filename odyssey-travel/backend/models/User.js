const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254
  },

  passwordHash: {
    type: String,
    required: true,
    select: false
  },

  refreshTokenHash: {
    type: String,
    default: undefined,
    select: false
  },

  gamePlayed: {
    type: Boolean,
    default: false
  },

  gameScore: {
    type: Number,
    min: 0,
    max: 12,
    default: null
  },

  gameCouponCode: {
    type: String,
    default: ''
  },

  gameDiscountPercent: {
    type: Number,
    min: 0,
    max: 15,
    default: 0
  },

  gameCouponRedeemedAt: {
    type: Date,
    default: null
  },

  gameCouponBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },

  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination'
    }
  ],

  travelProfile: {
    travelStyle: {
      type: String,
      enum: [
        'Balanced',
        'Cultural',
        'Adventure',
        'Foodie',
        'Relaxed',
        'Budget'
      ],
      default: 'Balanced'
    },

    interests: [
      {
        type: String,
        trim: true
      }
    ],

    dietaryPreference: {
      type: String,
      enum: [
        'None',
        'Vegetarian',
        'Vegan',
        'Halal',
        'Gluten-Free',
        'Jain'
      ],
      default: 'None'
    },

    typicalBudgetPerDayINR: {
      type: Number,
      default: 5000,
      min: 500,
      max: 500000
    },

    preferredPace: {
      type: String,
      enum: [
        'Fast-paced',
        'Moderate',
        'Slow & leisurely'
      ],
      default: 'Moderate'
    },

    pastTrips: [
      {
        destination: {
          type: String,
          trim: true,
          required: true
        },
        year: {
          type: Number
        },
        highlights: {
          type: String,
          trim: true
        },
        rating: {
          type: Number,
          min: 1,
          max: 5
        }
      }
    ]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
