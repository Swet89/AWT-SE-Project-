const express = require('express');
const PDFDocument = require('pdfkit');
const { chat, planItinerary } = require('../services/openai.service');
const Itinerary = require('../models/Itinerary');
const { dbConnected } = require('../config/db');

const router = express.Router();

router.post('/chat', async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'message is required.' });
    }
    const result = await chat(message, Array.isArray(history) ? history : []);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/itinerary', async (req, res, next) => {
  try {
    const { destination, days, interests, startDate } = req.body;
    if (!destination) {
      return res.status(400).json({ message: 'destination is required.' });
    }

    const plan = await planItinerary({ destination, days, interests, startDate });

    // Best-effort save so /itinerary/:id/pdf can regenerate a PDF later.
    // Doesn't block the response if the database is unavailable.
    if (dbConnected()) {
      try {
        const saved = await Itinerary.create({
          destination: plan.destination,
          startDate,
          summary: plan.summary,
          days: plan.days,
          demoMode: plan.demoMode,
        });
        plan.id = saved._id.toString();
      } catch (err) {
        console.warn('[itinerary] could not save to database:', err.message);
      }
    }

    res.json(plan);
  } catch (err) {
    next(err);
  }
});

router.get('/itinerary/:id/pdf', async (req, res, next) => {
  try {
    if (!dbConnected()) {
      return res.status(503).json({ message: 'Database unavailable — cannot fetch saved itineraries.' });
    }
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) return res.status(404).json({ message: 'Itinerary not found.' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${itinerary.destination.replace(/\s+/g, '-')}-itinerary.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(22).text(`Odyssey Travel — ${itinerary.destination}`, { align: 'center' });
    doc.moveDown();
    if (itinerary.summary) {
      doc.fontSize(11).fillColor('#555').text(itinerary.summary);
      doc.moveDown();
    }

    itinerary.days.forEach((day) => {
      doc.fillColor('#000').fontSize(14).text(`Day ${day.day}: ${day.title}`);
      doc.fontSize(11).fillColor('#333');
      day.activities.forEach((activity) => doc.text(`  •  ${activity}`));
      doc.moveDown(0.6);
    });

    doc.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
