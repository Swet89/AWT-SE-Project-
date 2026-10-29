
const express = require('express')
const { rateLimit } = require('express-rate-limit')

const ContactMessage = require('../models/ContactMessage')

const router = express.Router()

// Limit contact form submissions to 10 requests per hour
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  message: {
    message:
      'Too many contact requests from this connection. Please try again later.',
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})

// Handle contact form submissions
router.post('/', contactLimiter, async (req, res) => {
  try {
    // Extract contact form fields from the request body
    const {
      name,
      email,
      subject,
      destinationInterest,
      message,
    } = req.body || {}

    // Validate the user's name
    if (
      !name ||
      typeof name !== 'string' ||
      name.trim().length < 2
    ) {
      return res.status(400).json({
        message:
          'Please provide a valid name (at least 2 characters).',
      })
    }

    // Regular expression for basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    // Validate the email address
    if (
      !email ||
      typeof email !== 'string' ||
      !emailRegex.test(email.trim())
    ) {
      return res.status(400).json({
        message: 'Please provide a valid email address.',
      })
    }

    // Validate the contact message
    if (
      !message ||
      typeof message !== 'string' ||
      message.trim().length < 5
    ) {
      return res.status(400).json({
        message:
          'Please enter a message with at least 5 characters.',
      })
    }

    // Save the validated contact details to MongoDB
    const savedMessage = await ContactMessage.create({
      name: name.trim().slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 254),

      // Use a default subject when none is provided
      subject: (
        subject && typeof subject === 'string'
          ? subject.trim()
          : 'General Inquiry'
      ).slice(0, 150),

      // Store the user's destination interest, if provided
      destinationInterest: (
        destinationInterest &&
        typeof destinationInterest === 'string'
          ? destinationInterest.trim()
          : ''
      ).slice(0, 100),

      // Limit the stored message length
      message: message.trim().slice(0, 3000),
    })

    // Return a success response with the ticket ID and timestamp
    return res.status(201).json({
      success: true,
      message:
        'Thank you for contacting Odyssey Travel! Our travel specialist will get back to you shortly.',
      ticketId: savedMessage._id,
      receivedAt: savedMessage.createdAt,
    })
  } catch (error) {
    // Log the error if the contact submission fails
    console.error(
      'Contact submission error:',
      error.message,
    )

    // Return a server error response
    return res.status(500).json({
      message:
        'Could not send your message right now. Please try again later.',
    })
  }
})

// Export the router for use in the Express application
module.exports = router
