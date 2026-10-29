const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 254
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
    default: 'General Inquiry'
  },
  destinationInterest: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 3000
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'resolved'],
    default: 'unread'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model(
  'ContactMessage',
  contactMessageSchema
);
