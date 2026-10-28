const express = require('express')
const crypto = require('crypto')
const mongoose = require('mongoose')
const Razorpay = require('razorpay')
const Booking = require('../models/Booking')
const TravelOption = require('../models/TravelOption')
const User = require('../models/User')
const authenticate = require('../middleware/authenticate')

const router = express.Router()

router.use(authenticate)

function razorpayEnabled() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') &&
    process.env.RAZORPAY_KEY_SECRET,
  )
}

function createRazorpayClient() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

router.get('/my', async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.auth.userId }).sort({ createdAt: -1 })
    return res.json(bookings)
  } catch (error) {
    console.error('Loading bookings failed:', error.message)
    return res.status(500).json({ message: 'Could not load bookings.' })
  }
})

router.post('/:id/payment/simulate', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' })
    }

    const { paymentMethod = 'Instant UPI (GooglePay / PhonePe)' } = req.body || {}
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.auth.userId,
    })

    if (!booking) return res.status(404).json({ message: 'Booking not found.' })
    if (booking.status === 'confirmed') {
      return res.json({ message: 'Booking already confirmed.', booking })
    }
    if (booking.status !== 'pending_payment') {
      return res.status(409).json({ message: 'This booking is no longer awaiting payment.' })
    }

    const simPaymentId = `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const pnr = `ODY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    booking.paymentId = simPaymentId
    booking.paymentOrderId = booking.paymentOrderId || `order_sim_${Date.now()}`
    booking.paymentMethod = paymentMethod
    booking.pnr = pnr
    booking.status = 'confirmed'
    await booking.save()

    return res.json({
      message: 'Payment simulation successful! Your booking is confirmed.',
      booking,
      pnr,
    })
  } catch (error) {
    console.error('Payment simulation failed:', error.message)
    return res.status(500).json({ message: 'Could not complete simulated payment.' })
  }
})

router.post('/:id/payment/order', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' })
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.auth.userId,
    })

    if (!booking) return res.status(404).json({ message: 'Booking not found.' })
    if (booking.status !== 'pending_payment') {
      return res.status(409).json({ message: 'This booking is no longer awaiting payment.' })
    }

    if (!razorpayEnabled()) {
      return res.json({
        simulationMode: true,
        message: 'Sandbox payment simulation active.',
        id: `order_sim_${Date.now()}`,
        amount: Math.round(booking.totalINR * 100),
        currency: 'INR',
        keyId: null,
      })
    }

    let order
    if (booking.paymentOrderId) {
      order = await createRazorpayClient().orders.fetch(booking.paymentOrderId)
    } else {
      order = await createRazorpayClient().orders.create({
        amount: Math.round(booking.totalINR * 100),
        currency: 'INR',
        receipt: String(booking._id),
        notes: { bookingId: String(booking._id), userId: String(req.auth.userId) },
      })
      booking.paymentOrderId = order.id
      await booking.save()
    }

    return res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('Creating Razorpay order failed:', error.message)
    return res.status(502).json({ message: 'Could not start test payment. Your booking is still pending.' })
  }
})

router.post('/:id/payment/verify', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' })
    }
    if (!razorpayEnabled()) {
      return res.status(503).json({ message: 'Razorpay test payments are not configured.' })
    }

    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body
    if (![orderId, paymentId, signature].every((value) => typeof value === 'string' && value.length > 0)) {
      return res.status(400).json({ message: 'Payment verification details are incomplete.' })
    }

    const booking = await Booking.findOne({ _id: req.params.id, user: req.auth.userId })
    if (!booking) return res.status(404).json({ message: 'Booking not found.' })
    if (booking.status === 'confirmed' && booking.paymentId === paymentId) {
      return res.json({ message: 'Payment already confirmed.', booking })
    }
    if (booking.status !== 'pending_payment' || booking.paymentOrderId !== orderId) {
      return res.status(409).json({ message: 'Payment does not match this pending booking.' })
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')
    const expectedBuffer = Buffer.from(expected, 'hex')
    const signatureBuffer = Buffer.from(signature, 'hex')
    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return res.status(400).json({ message: 'Payment signature is invalid.' })
    }

    booking.paymentId = paymentId
    booking.status = 'confirmed'
    await booking.save()
    return res.json({ message: 'Payment confirmed.', booking })
  } catch (error) {
    console.error('Verifying Razorpay payment failed:', error.message)
    return res.status(500).json({ message: 'Could not confirm payment. Contact support with your booking reference.' })
  }
})

router.patch('/:id/cancel', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' })
    }

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.auth.userId,
        status: 'pending_payment',
      },
      { status: 'cancelled' },
      { new: true, runValidators: true },
    )

    if (!booking) {
      const existingBooking = await Booking.findOne({
        _id: req.params.id,
        user: req.auth.userId,
      })

      if (!existingBooking) {
        return res.status(404).json({ message: 'Booking not found.' })
      }

      return res.status(409).json({
        message: 'Only bookings with pending payment can be cancelled.',
      })
    }

    if (booking.couponCode) {
      await User.updateOne(
        { _id: req.auth.userId, gameCouponBookingId: booking._id },
        { $set: { gameCouponRedeemedAt: null, gameCouponBookingId: null } },
      )
    }

    return res.json({ message: 'Booking request cancelled.', booking })
  } catch (error) {
    console.error('Cancelling booking failed:', error.message)
    return res.status(500).json({ message: 'Could not cancel this booking.' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { optionId, traveler, quantity } = req.body
    const couponCode = String(req.body.couponCode || '').trim().toUpperCase()

    if (!mongoose.isValidObjectId(optionId)) {
      return res.status(400).json({ message: 'Select a valid travel option.' })
    }

    const travelerName = String(traveler?.name || '').trim()
    const travelerEmail = String(traveler?.email || '').trim().toLowerCase()
    const travelerPhone = String(traveler?.phone || '').trim()
    const travelerCount = Number(quantity)

    if (travelerName.length < 2 || travelerName.length > 80) {
      return res.status(400).json({ message: 'Enter the traveler’s name.' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(travelerEmail)) {
      return res.status(400).json({ message: 'Enter a valid traveler email.' })
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(travelerPhone)) {
      return res.status(400).json({ message: 'Enter a valid phone number.' })
    }

    if (!Number.isInteger(travelerCount) || travelerCount < 1 || travelerCount > 9) {
      return res.status(400).json({ message: 'Quantity must be from 1 to 9.' })
    }

    const option = await TravelOption.findById(optionId)

    if (!option) {
      return res.status(404).json({ message: 'That travel option is no longer available.' })
    }

    if (option.estimated === false && option.offerExpiresAt && option.offerExpiresAt <= new Date()) {
      return res.status(409).json({
        message: 'This live fare has expired. Search again to refresh current availability and price.',
      })
    }

    const user = couponCode
      ? await User.findById(req.auth.userId).select(
          'gameCouponCode gameDiscountPercent gameCouponRedeemedAt',
        )
      : null

    if (couponCode && (
      !user ||
      user.gameCouponCode !== couponCode ||
      user.gameCouponRedeemedAt
    )) {
      return res.status(400).json({ message: 'That coupon is invalid or has already been used.' })
    }

    const gstRate = ['hotels', 'rentals', 'hostels'].includes(option.kind) ? 0.12 : 0.05
    const subtotalINR = option.priceINR * travelerCount
    const discountPercent = couponCode ? user.gameDiscountPercent : 0
    const discountINR = Math.round(subtotalINR * discountPercent / 100)
    const taxableAmountINR = subtotalINR - discountINR
    const gstINR = Math.round(taxableAmountINR * gstRate)
    const totalINR = taxableAmountINR + gstINR

    const booking = new Booking({
      user: req.auth.userId,
      option: option._id,
      optionSnapshot: {
        kind: option.kind,
        name: option.name,
        origin: option.origin,
        destination: option.destination,
        priceINR: option.priceINR,
      },
      traveler: {
        name: travelerName,
        email: travelerEmail,
        phone: travelerPhone,
      },
      quantity: travelerCount,
      subtotalINR,
      discountINR,
      discountPercent,
      couponCode,
      gstRate,
      gstINR,
      totalINR,
      status: 'pending_payment',
    })

    await booking.save()

    if (couponCode) {
      const redemption = await User.updateOne(
        {
          _id: req.auth.userId,
          gameCouponCode: couponCode,
          gameCouponRedeemedAt: null,
        },
        {
          $set: {
            gameCouponRedeemedAt: new Date(),
            gameCouponBookingId: booking._id,
          },
        },
      )

      if (redemption.modifiedCount !== 1) {
        await Booking.findByIdAndDelete(booking._id)
        return res.status(409).json({ message: 'That coupon has just been used. Refresh your booking and try again.' })
      }
    }

    return res.status(201).json({
      message: 'Booking request created successfully.',
      booking,
      paymentEnabled: true,
      isSandbox: !razorpayEnabled(),
    })
  } catch (error) {
    console.error('Creating booking failed:', error.message)
    return res.status(500).json({ message: 'Could not create booking.' })
  }
})

module.exports = router
