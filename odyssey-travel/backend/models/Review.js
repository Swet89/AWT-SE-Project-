
const mongoose = require('mongoose')

// Schema for storing destination reviews
const reviewSchema = new mongoose.Schema(
  {
    // Destination being reviewed
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      required: true,
      index: true,
    },

    // User who submitted the review
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Rating between 1 and 5
    rating: { type: Number, required: true, min: 1, max: 5 },

    // Review comment with length validation
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000,
    },
  },
  { timestamps: true },
)

// Allow only one review per user for each destination
reviewSchema.index({ destination: 1, user: 1 }, { unique: true })

// Export the Review model
module.exports = mongoose.model('Review', reviewSchema)
