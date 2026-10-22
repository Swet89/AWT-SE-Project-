require('dotenv').config()

const mongoose = require('mongoose')
const TravelOption = require('../models/TravelOption')

const options = [
  { kind: 'flights', name: 'IndiGo 6E 204', origin: 'DEL', destination: 'GOI', departureTime: '08:10', arrivalTime: '10:45', priceINR: 5899, stops: 0, travelClass: 'Economy', rating: 4.1 },
  { kind: 'flights', name: 'Air India AI 885', origin: 'BOM', destination: 'GOI', departureTime: '12:20', arrivalTime: '13:35', priceINR: 4299, stops: 0, travelClass: 'Economy', rating: 4.0 },
  { kind: 'trains', name: 'Mewar Express', origin: 'Delhi', destination: 'Jaipur', departureTime: '06:05', arrivalTime: '11:15', priceINR: 480, stops: 2, travelClass: '3A', rating: 4.2 },
  { kind: 'trains', name: 'Shatabdi Express', origin: 'Delhi', destination: 'Jaipur', departureTime: '06:10', arrivalTime: '10:40', priceINR: 1250, stops: 1, travelClass: 'CC', rating: 4.5 },
  { kind: 'buses', name: 'Rajasthan Volvo AC Sleeper', origin: 'Delhi', destination: 'Jaipur', departureTime: '22:00', arrivalTime: '05:30', priceINR: 950, stops: 1, travelClass: 'Volvo AC Sleeper', rating: 4.3 },
  { kind: 'buses', name: 'Pink City Semi-Sleeper', origin: 'Delhi', destination: 'Jaipur', departureTime: '21:30', arrivalTime: '06:00', priceINR: 650, stops: 2, travelClass: 'Semi-Sleeper', rating: 4.0 },
  { kind: 'cruises', name: 'Aegean Island Passage', origin: 'Athens', destination: 'Santorini', departureTime: '07:25', arrivalTime: '12:10', priceINR: 4200, stops: 0, travelClass: 'Standard Deck', rating: 4.4 },
  { kind: 'cruises', name: 'Cyclades Day Sail', origin: 'Athens', destination: 'Santorini', departureTime: '09:00', arrivalTime: '14:30', priceINR: 6800, stops: 0, travelClass: 'Sea View', rating: 4.7 },
  { kind: 'hotels', name: 'The Heritage Haveli', destination: 'Jaipur', priceINR: 3200, rating: 4.5, amenities: ['Breakfast', 'Wi-Fi', 'Pool'] },
  { kind: 'hotels', name: 'Lakeview Garden Stay', destination: 'Goa', priceINR: 2800, rating: 4.2, amenities: ['Wi-Fi', 'Garden', 'Beach shuttle'] },
  { kind: 'rentals', name: 'Fontainhas Heritage Apartment', destination: 'Goa', priceINR: 4200, rating: 4.6, amenities: ['Kitchen', 'Wi-Fi', 'Balcony'] },
  { kind: 'hostels', name: 'Pink City Backpackers Hostel', destination: 'Jaipur', priceINR: 650, rating: 4.3, amenities: ['Wi-Fi', 'Shared kitchen', 'Lockers'] },
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    const operations = options.map((option) => ({
      updateOne: {
        filter: { kind: option.kind, name: option.name },
        update: { $set: option },
        upsert: true,
      },
    }))
    const result = await TravelOption.bulkWrite(operations)
    console.log(
      `Travel options updated: ${result.modifiedCount}; added: ${result.upsertedCount}.`,
    )
  } catch (error) {
    console.error('Travel option seeding failed:', error.message)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

seed()
