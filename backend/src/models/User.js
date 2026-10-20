const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    preferences: {
      interests: [{ type: String }],
      homeCurrency: { type: String, default: 'USD' },
    },
    gamePlayed: { type: Boolean, default: false },
    gameScore: { type: Number, default: null },
    discountCode: { type: String, default: null },
    discountPercent: { type: Number, default: null },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    gamePlayed: this.gamePlayed,
  };
};

module.exports = mongoose.model('User', userSchema);
