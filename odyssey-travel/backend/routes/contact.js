const express = require('express')
const { rateLimit } = require('express-rate-limit')

const ContactMessage = require('../models/ContactMessage')

const router = express.Router()

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

router.post('/', contactLimiter, async (req, res) => {
  try {
    const {
      name,
      email,
      subject,
      destinationInterest,
      message,
    } = req.body || {}

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (
      !email ||
      typeof email !== 'string' ||
      !emailRegex.test(email.trim())
    ) {
      return res.status(400).json({
        message: 'Please provide a valid email address.',
      })
    }

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

    const savedMessage = await ContactMessage.create({
      name: name.trim().slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 254),

      subject: (
        subject && typeof subject === 'string'
          ? subject.trim()
          : 'General Inquiry'
      ).slice(0, 150),

      destinationInterest: (
        destinationInterest &&
        typeof destinationInterest === 'string'
          ? destinationInterest.trim()
          : ''
      ).slice(0, 100),

      message: message.trim().slice(0, 3000),
    })

    return res.status(201).json({
      success: true,
      message:
        'Thank you for contacting Odyssey Travel! Our travel specialist will get back to you shortly.',
      ticketId: savedMessage._id,
      receivedAt: savedMessage.createdAt,
    })
  } catch (error) {
    console.error(
      'Contact submission error:',
      error.message,
    )

    return res.status(500).json({
      message:
        'Could not send your message right now. Please try again later.',
    })
  }
})

module.exports = router