require('dotenv').config()

const mongoose = require('mongoose')
const TravelOption = require('../models/TravelOption')

const options = [
  // ==================== FLIGHTS ====================
  // Mumbai (BOM) -> Delhi (DEL)
  { kind: 'flights', name: 'IndiGo 6E 5312', origin: 'BOM', destination: 'DEL', departureTime: '06:15', arrivalTime: '08:30', priceINR: 4899, stops: 0, travelClass: 'Economy', rating: 4.4, amenities: ['Web check-in', 'Cabin baggage (7 kg)', 'Check-in baggage (15 kg)'] },
  { kind: 'flights', name: 'Air India AI 806', origin: 'BOM', destination: 'DEL', departureTime: '09:30', arrivalTime: '11:45', priceINR: 5450, stops: 0, travelClass: 'Economy', rating: 4.2, amenities: ['Complimentary hot snack', 'Cabin baggage (7 kg)', 'Check-in baggage (15 kg)'] },
  { kind: 'flights', name: 'Vistara UK 994', origin: 'BOM', destination: 'DEL', departureTime: '13:45', arrivalTime: '16:00', priceINR: 6199, stops: 0, travelClass: 'Economy', rating: 4.7, amenities: ['Gourmet meal', 'In-flight entertainment', 'Check-in baggage (15 kg)'] },
  { kind: 'flights', name: 'Akasa Air QP 1124', origin: 'BOM', destination: 'DEL', departureTime: '17:20', arrivalTime: '19:35', priceINR: 4499, stops: 0, travelClass: 'Economy', rating: 4.3, amenities: ['USB charging ports', 'Cabin baggage (7 kg)', 'Check-in baggage (15 kg)'] },
  { kind: 'flights', name: 'Air India Business AI 678', origin: 'BOM', destination: 'DEL', departureTime: '19:00', arrivalTime: '21:15', priceINR: 14500, stops: 0, travelClass: 'Business', rating: 4.8, amenities: ['Priority check-in', 'Lounge access', 'Fine dining', 'Extra baggage (35 kg)'] },
  { kind: 'flights', name: 'IndiGo 6E 2051', origin: 'BOM', destination: 'DEL', departureTime: '21:40', arrivalTime: '23:55', priceINR: 4299, stops: 0, travelClass: 'Economy', rating: 4.1, amenities: ['Web check-in', 'Cabin baggage (7 kg)'] },

  // Delhi (DEL) -> Mumbai (BOM)
  { kind: 'flights', name: 'IndiGo 6E 5022', origin: 'DEL', destination: 'BOM', departureTime: '06:00', arrivalTime: '08:15', priceINR: 4799, stops: 0, travelClass: 'Economy', rating: 4.3, amenities: ['Web check-in', 'Cabin baggage (7 kg)', 'Check-in baggage (15 kg)'] },
  { kind: 'flights', name: 'Air India AI 887', origin: 'DEL', destination: 'BOM', departureTime: '08:45', arrivalTime: '11:00', priceINR: 5300, stops: 0, travelClass: 'Economy', rating: 4.2, amenities: ['Complimentary hot snack', 'Check-in baggage (15 kg)'] },
  { kind: 'flights', name: 'Vistara UK 975', origin: 'DEL', destination: 'BOM', departureTime: '14:00', arrivalTime: '16:15', priceINR: 6250, stops: 0, travelClass: 'Economy', rating: 4.6, amenities: ['Gourmet meal', 'In-flight entertainment'] },
  { kind: 'flights', name: 'Akasa Air QP 1302', origin: 'DEL', destination: 'BOM', departureTime: '18:10', arrivalTime: '20:25', priceINR: 4399, stops: 0, travelClass: 'Economy', rating: 4.3, amenities: ['USB charging', 'Check-in baggage (15 kg)'] },
  { kind: 'flights', name: 'SpiceJet SG 8169', origin: 'DEL', destination: 'BOM', departureTime: '20:30', arrivalTime: '22:50', priceINR: 3999, stops: 0, travelClass: 'Economy', rating: 4.0, amenities: ['Cabin baggage (7 kg)'] },

  // Delhi (DEL) <-> Goa (GOI)
  { kind: 'flights', name: 'IndiGo 6E 204', origin: 'DEL', destination: 'GOI', departureTime: '08:10', arrivalTime: '10:45', priceINR: 5899, stops: 0, travelClass: 'Economy', rating: 4.1, amenities: ['Web check-in', 'Check-in baggage (15 kg)'] },
  { kind: 'flights', name: 'Air India AI 840', origin: 'DEL', destination: 'GOI', departureTime: '14:20', arrivalTime: '17:00', priceINR: 6150, stops: 0, travelClass: 'Economy', rating: 4.3, amenities: ['Hot meal', 'Check-in baggage (15 kg)'] },
  { kind: 'flights', name: 'IndiGo 6E 205', origin: 'GOI', destination: 'DEL', departureTime: '11:20', arrivalTime: '13:55', priceINR: 5699, stops: 0, travelClass: 'Economy', rating: 4.2, amenities: ['Web check-in', 'Check-in baggage (15 kg)'] },

  // Mumbai (BOM) <-> Goa (GOI)
  { kind: 'flights', name: 'Air India AI 885', origin: 'BOM', destination: 'GOI', departureTime: '12:20', arrivalTime: '13:35', priceINR: 4299, stops: 0, travelClass: 'Economy', rating: 4.0, amenities: ['Snack box', 'Check-in baggage (15 kg)'] },
  { kind: 'flights', name: 'IndiGo 6E 518', origin: 'BOM', destination: 'GOI', departureTime: '07:30', arrivalTime: '08:45', priceINR: 3899, stops: 0, travelClass: 'Economy', rating: 4.4, amenities: ['Web check-in'] },
  { kind: 'flights', name: 'IndiGo 6E 519', origin: 'GOI', destination: 'BOM', departureTime: '19:15', arrivalTime: '20:30', priceINR: 3999, stops: 0, travelClass: 'Economy', rating: 4.3, amenities: ['Web check-in'] },

  // Bengaluru (BLR) <-> Delhi (DEL) & Mumbai (BOM)
  { kind: 'flights', name: 'IndiGo 6E 2135', origin: 'BLR', destination: 'DEL', departureTime: '06:30', arrivalTime: '09:15', priceINR: 5299, stops: 0, travelClass: 'Economy', rating: 4.5, amenities: ['Web check-in', 'Baggage (15 kg)'] },
  { kind: 'flights', name: 'Air India AI 506', origin: 'DEL', destination: 'BLR', departureTime: '09:45', arrivalTime: '12:35', priceINR: 5499, stops: 0, travelClass: 'Economy', rating: 4.3, amenities: ['Hot snack', 'Baggage (15 kg)'] },
  { kind: 'flights', name: 'Akasa Air QP 1109', origin: 'BOM', destination: 'BLR', departureTime: '08:00', arrivalTime: '09:35', priceINR: 3299, stops: 0, travelClass: 'Economy', rating: 4.4, amenities: ['USB charging'] },
  { kind: 'flights', name: 'IndiGo 6E 448', origin: 'BLR', destination: 'BOM', departureTime: '17:45', arrivalTime: '19:25', priceINR: 3499, stops: 0, travelClass: 'Economy', rating: 4.3, amenities: ['Web check-in'] },

  // Hyderabad (HYD) <-> Delhi (DEL) & Mumbai (BOM)
  { kind: 'flights', name: 'IndiGo 6E 551', origin: 'HYD', destination: 'DEL', departureTime: '07:10', arrivalTime: '09:25', priceINR: 4499, stops: 0, travelClass: 'Economy', rating: 4.4, amenities: ['Web check-in'] },
  { kind: 'flights', name: 'Air India AI 544', origin: 'DEL', destination: 'HYD', departureTime: '15:20', arrivalTime: '17:35', priceINR: 4899, stops: 0, travelClass: 'Economy', rating: 4.2, amenities: ['Hot meal'] },
  { kind: 'flights', name: 'IndiGo 6E 718', origin: 'BOM', destination: 'HYD', departureTime: '08:50', arrivalTime: '10:15', priceINR: 3199, stops: 0, travelClass: 'Economy', rating: 4.3, amenities: ['Web check-in'] },

  // Jaipur (JAI) <-> Delhi (DEL) & Mumbai (BOM)
  { kind: 'flights', name: 'IndiGo 6E 7224', origin: 'DEL', destination: 'JAI', departureTime: '10:15', arrivalTime: '11:15', priceINR: 2899, stops: 0, travelClass: 'Economy', rating: 4.2, amenities: ['Web check-in'] },
  { kind: 'flights', name: 'Air India AI 643', origin: 'BOM', destination: 'JAI', departureTime: '11:40', arrivalTime: '13:30', priceINR: 4699, stops: 0, travelClass: 'Economy', rating: 4.3, amenities: ['Snack box'] },

  // Kolkata (CCU) <-> Delhi (DEL) & Mumbai (BOM)
  { kind: 'flights', name: 'Air India AI 701', origin: 'DEL', destination: 'CCU', departureTime: '07:00', arrivalTime: '09:10', priceINR: 4999, stops: 0, travelClass: 'Economy', rating: 4.2, amenities: ['Hot breakfast'] },
  { kind: 'flights', name: 'IndiGo 6E 6108', origin: 'BOM', destination: 'CCU', departureTime: '14:30', arrivalTime: '17:15', priceINR: 5899, stops: 0, travelClass: 'Economy', rating: 4.4, amenities: ['Web check-in'] },

  // International Flights
  { kind: 'flights', name: 'Emirates EK 501', origin: 'BOM', destination: 'DXB', departureTime: '04:30', arrivalTime: '06:15', priceINR: 19800, stops: 0, travelClass: 'Economy', rating: 4.8, amenities: ['In-flight entertainment (ice)', 'Multi-course meal', 'Wi-Fi'] },
  { kind: 'flights', name: 'Air India AI 995', origin: 'DEL', destination: 'DXB', departureTime: '19:40', arrivalTime: '22:10', priceINR: 17500, stops: 0, travelClass: 'Economy', rating: 4.3, amenities: ['Complimentary dinner', 'Baggage (30 kg)'] },
  { kind: 'flights', name: 'British Airways BA 142', origin: 'DEL', destination: 'LHR', departureTime: '03:15', arrivalTime: '07:35', priceINR: 48500, stops: 0, travelClass: 'Economy', rating: 4.6, amenities: ['Full meals', 'Entertainment screens', 'Baggage (23 kg)'] },
  { kind: 'flights', name: 'Air France AF 225', origin: 'DEL', destination: 'CDG', departureTime: '00:35', arrivalTime: '06:05', priceINR: 52000, stops: 0, travelClass: 'Economy', rating: 4.7, amenities: ['French cuisine', 'Champagne service', 'Baggage (23 kg)'] },
  { kind: 'flights', name: 'Singapore Airlines SQ 421', origin: 'BOM', destination: 'SIN', departureTime: '11:45', arrivalTime: '19:50', priceINR: 24500, stops: 0, travelClass: 'Economy', rating: 4.9, amenities: ['KrisWorld entertainment', 'Full meals', 'Wi-Fi'] },
  { kind: 'flights', name: 'All Nippon Airways NH 838', origin: 'DEL', destination: 'NRT', departureTime: '18:00', arrivalTime: '05:35', priceINR: 56000, stops: 0, travelClass: 'Economy', rating: 4.9, amenities: ['Japanese hospitality', 'Gourmet dining'] },

  // ==================== TRAINS ====================
  // Delhi <-> Mumbai
  { kind: 'trains', name: 'Mumbai Tejas Rajdhani Express (12952)', origin: 'Delhi', destination: 'Mumbai', departureTime: '16:55', arrivalTime: '08:35', priceINR: 2450, stops: 5, travelClass: '3A', rating: 4.7, amenities: ['Pantry meals', 'Bedding kit', 'Reading lights', 'Clean bio-toilets'] },
  { kind: 'trains', name: 'Mumbai Tejas Rajdhani Express 2A (12952)', origin: 'Delhi', destination: 'Mumbai', departureTime: '16:55', arrivalTime: '08:35', priceINR: 3680, stops: 5, travelClass: '2A', rating: 4.8, amenities: ['Pantry meals', 'Bedding kit', 'Spacious berths', 'Onboard attendants'] },
  { kind: 'trains', name: 'August Kranti Tejas Rajdhani (12954)', origin: 'Delhi', destination: 'Mumbai', departureTime: '17:15', arrivalTime: '10:05', priceINR: 2380, stops: 7, travelClass: '3A', rating: 4.6, amenities: ['Pantry meals', 'Clean washrooms'] },
  { kind: 'trains', name: 'Mumbai Rajdhani Return (12951)', origin: 'Mumbai', destination: 'Delhi', departureTime: '17:00', arrivalTime: '08:32', priceINR: 2450, stops: 5, travelClass: '3A', rating: 4.7, amenities: ['Pantry meals', 'Bedding kit'] },
  { kind: 'trains', name: 'Golden Temple Mail (12903)', origin: 'Mumbai', destination: 'Delhi', departureTime: '18:45', arrivalTime: '13:50', priceINR: 1580, stops: 12, travelClass: '3A', rating: 4.2, amenities: ['Pantry car', 'Charging sockets'] },

  // Delhi <-> Jaipur
  { kind: 'trains', name: 'Ajmer Vande Bharat Express (20978)', origin: 'Delhi', destination: 'Jaipur', departureTime: '06:10', arrivalTime: '09:55', priceINR: 1050, stops: 3, travelClass: 'CC', rating: 4.8, amenities: ['High-speed AC', 'Reclining seats', 'Breakfast included', 'Wi-Fi infotainment'] },
  { kind: 'trains', name: 'Jaipur Shatabdi Express (12015)', origin: 'Delhi', destination: 'Jaipur', departureTime: '06:10', arrivalTime: '10:40', priceINR: 1250, stops: 4, travelClass: 'CC', rating: 4.5, amenities: ['Breakfast', 'Newspapers', 'Reclining seats'] },
  { kind: 'trains', name: 'Mewar Express (12963)', origin: 'Delhi', destination: 'Jaipur', departureTime: '18:25', arrivalTime: '23:35', priceINR: 480, stops: 2, travelClass: '3A', rating: 4.2, amenities: ['Night berths', 'Charging sockets'] },

  // Mumbai <-> Goa
  { kind: 'trains', name: 'Goa Vande Bharat Express (22229)', origin: 'Mumbai', destination: 'Goa', departureTime: '05:25', arrivalTime: '13:10', priceINR: 1690, stops: 6, travelClass: 'CC', rating: 4.8, amenities: ['Scenic Western Ghats views', 'Breakfast & lunch', 'Rotating seats'] },
  { kind: 'trains', name: 'Mandovi Express (10103)', origin: 'Mumbai', destination: 'Goa', departureTime: '07:10', arrivalTime: '18:45', priceINR: 520, stops: 16, travelClass: 'SL', rating: 4.3, amenities: ['Legendary pantry food', 'Konkan coastal scenery'] },
  { kind: 'trains', name: 'Konkan Kanya Express (20111)', origin: 'Mumbai', destination: 'Goa', departureTime: '23:05', arrivalTime: '10:45', priceINR: 1120, stops: 14, travelClass: '3A', rating: 4.4, amenities: ['Overnight sleeper', 'Bedding'] },

  // Delhi <-> Varanasi
  { kind: 'trains', name: 'Varanasi Vande Bharat Express (22436)', origin: 'Delhi', destination: 'Varanasi', departureTime: '06:00', arrivalTime: '14:00', priceINR: 1750, stops: 2, travelClass: 'CC', rating: 4.8, amenities: ['Hot meals', 'Scenic high speed travel', 'Audio-visual infotainment'] },
  { kind: 'trains', name: 'Shiv Ganga Express (12560)', origin: 'Delhi', destination: 'Varanasi', departureTime: '20:05', arrivalTime: '06:10', priceINR: 1050, stops: 1, travelClass: '3A', rating: 4.6, amenities: ['Punctual overnight express', 'Clean berths'] },

  // Delhi <-> Agra
  { kind: 'trains', name: 'Gatimaan Express (12050)', origin: 'Delhi', destination: 'Agra', departureTime: '08:10', arrivalTime: '09:50', priceINR: 850, stops: 0, travelClass: 'CC', rating: 4.7, amenities: ['Fastest direct connection', 'Continental / Indian breakfast', 'Train hostesses'] },
  { kind: 'trains', name: 'Taj Express (12280)', origin: 'Delhi', destination: 'Agra', departureTime: '06:55', arrivalTime: '09:35', priceINR: 375, stops: 4, travelClass: 'CC', rating: 4.2, amenities: ['Day train', 'Snack vendors'] },

  // ==================== BUSES ====================
  { kind: 'buses', name: 'Zingbus Multi-Axle Volvo AC Sleeper', origin: 'Delhi', destination: 'Jaipur', departureTime: '22:00', arrivalTime: '04:30', priceINR: 850, stops: 1, travelClass: 'Volvo AC Sleeper', rating: 4.5, amenities: ['Blanket & pillow', 'Charging point', 'Live bus tracking', 'Water bottle'] },
  { kind: 'buses', name: 'Rajasthan State Roadways Scania', origin: 'Delhi', destination: 'Jaipur', departureTime: '07:00', arrivalTime: '12:30', priceINR: 650, stops: 2, travelClass: 'Semi-Sleeper', rating: 4.2, amenities: ['Air-conditioned', 'Pushback seats'] },
  { kind: 'buses', name: 'Neeta Tours Multi-Axle Volvo', origin: 'Mumbai', destination: 'Pune', departureTime: '08:30', arrivalTime: '12:00', priceINR: 450, stops: 1, travelClass: 'Semi-Sleeper', rating: 4.3, amenities: ['Expressway transit', 'Snack stop at food mall'] },
  { kind: 'buses', name: 'IntrCity SmartBus Volvo Sleeper', origin: 'Mumbai', destination: 'Goa', departureTime: '19:30', arrivalTime: '08:00', priceINR: 1350, stops: 2, travelClass: 'Volvo AC Sleeper', rating: 4.6, amenities: ['Private cabin curtain', 'Wi-Fi', 'Smart lounge boarding'] },
  { kind: 'buses', name: 'SRS Travels Scania Multi-Axle', origin: 'Bengaluru', destination: 'Goa', departureTime: '20:00', arrivalTime: '07:30', priceINR: 1200, stops: 2, travelClass: 'Volvo AC Sleeper', rating: 4.3, amenities: ['Pillow & blanket', 'Reading light'] },
  { kind: 'buses', name: 'Laxmi Holidays BharatBenz AC Sleeper', origin: 'Delhi', destination: 'Agra', departureTime: '06:30', arrivalTime: '10:00', priceINR: 550, stops: 1, travelClass: 'Semi-Sleeper', rating: 4.4, amenities: ['Yamuna Expressway corridor', 'Mineral water'] },

  // ==================== CRUISES ====================
  { kind: 'cruises', name: 'Cordelia Cruises Mumbai-Goa Sail', origin: 'Mumbai', destination: 'Goa', departureTime: '16:30', arrivalTime: '09:00', priceINR: 9800, stops: 0, travelClass: 'Standard Deck', rating: 4.8, amenities: ['All meals included', 'Broadway casino & theatre', 'Swimming pool', 'Oceanview sundeck'] },
  { kind: 'cruises', name: 'Cordelia Premium Ocean Suite', origin: 'Mumbai', destination: 'Goa', departureTime: '16:30', arrivalTime: '09:00', priceINR: 22500, stops: 0, travelClass: 'Sea View', rating: 4.9, amenities: ['Private balcony suite', 'Butler service', 'VIP lounge access'] },
  { kind: 'cruises', name: 'Aegean Island Passage', origin: 'Athens', destination: 'Santorini', departureTime: '07:25', arrivalTime: '12:10', priceINR: 4200, stops: 0, travelClass: 'Standard Deck', rating: 4.4, amenities: ['Observation lounge', 'Cafe on board'] },
  { kind: 'cruises', name: 'Cyclades Day Sail', origin: 'Athens', destination: 'Santorini', departureTime: '09:00', arrivalTime: '14:30', priceINR: 6800, stops: 0, travelClass: 'Sea View', rating: 4.7, amenities: ['Open bar', 'Snacks', 'Sun lounger'] },

  // ==================== HOTELS ====================
  { kind: 'hotels', name: 'The Taj Mahal Palace & Tower', destination: 'Mumbai', priceINR: 18500, rating: 4.9, amenities: ['Harbour view', 'Luxury spa', 'Fine dining', 'Swimming pool', '24/7 concierge'] },
  { kind: 'hotels', name: 'Trident Hotel Nariman Point', destination: 'Mumbai', priceINR: 9800, rating: 4.7, amenities: ['Marine Drive sea view', 'Buffet breakfast', 'Fitness centre', 'High-speed Wi-Fi'] },
  { kind: 'hotels', name: 'The Imperial New Delhi', destination: 'Delhi', priceINR: 14500, rating: 4.8, amenities: ['Heritage architecture', 'Award-winning spa', 'Art gallery', 'Gardens'] },
  { kind: 'hotels', name: 'Radisson Blu Marina Connaught Place', destination: 'Delhi', priceINR: 6800, rating: 4.5, amenities: ['Central CP location', 'Metro access', 'Complimentary breakfast'] },
  { kind: 'hotels', name: 'The Heritage Haveli', destination: 'Jaipur', priceINR: 3200, rating: 4.5, amenities: ['Breakfast', 'Wi-Fi', 'Pool', 'Rooftop fort view'] },
  { kind: 'hotels', name: 'Lakeview Garden Stay & Resort', destination: 'Goa', priceINR: 2800, rating: 4.2, amenities: ['Wi-Fi', 'Garden', 'Beach shuttle', 'Swimming pool'] },
  { kind: 'hotels', name: 'ITC Grand Chola', destination: 'Chennai', priceINR: 8900, rating: 4.8, amenities: ['Chola dynasty architecture', '10 restaurants', 'Outdoor pool'] },
  { kind: 'hotels', name: 'The Leela Palace Bengaluru', destination: 'Bengaluru', priceINR: 13500, rating: 4.9, amenities: ['Artisan gardens', 'Royal suites', 'Michelin-starred cuisine'] },
  { kind: 'hotels', name: 'Taj Falaknuma Palace', destination: 'Hyderabad', priceINR: 26000, rating: 5.0, amenities: ['Historic Nizam palace', 'Horse-drawn carriage entry', 'Royal dining'] },
  { kind: 'hotels', name: 'The Oberoi Amarvilas', destination: 'Agra', priceINR: 28500, rating: 4.9, amenities: ['Unobstructed Taj Mahal view from every room', 'Private balcony', 'Spa'] },

  // ==================== RENTALS ====================
  { kind: 'rentals', name: 'Fontainhas Portuguese Heritage Villa', destination: 'Goa', priceINR: 4200, rating: 4.6, amenities: ['Full kitchen', 'Wi-Fi', 'Balcony', 'Private garden', 'Air conditioning'] },
  { kind: 'rentals', name: 'Bandra West Bohemian Penthouse', destination: 'Mumbai', priceINR: 5800, rating: 4.7, amenities: ['Sea-facing terrace', 'High-speed Wi-Fi', 'Designer kitchen', 'Smart TV'] },
  { kind: 'rentals', name: 'Hauz Khas Village Lakeview Loft', destination: 'Delhi', priceINR: 3900, rating: 4.5, amenities: ['Lake monument views', 'Art district vibe', 'Self check-in'] },
  { kind: 'rentals', name: 'Cavelossim Beachside Cottage', destination: 'Goa', priceINR: 3500, rating: 4.4, amenities: ['100m to beach', 'Kitchenette', 'Bicycle rental'] },

  // ==================== HOSTELS ====================
  { kind: 'hostels', name: 'Zostel Mumbai', destination: 'Mumbai', priceINR: 850, rating: 4.5, amenities: ['Air-conditioned dorms', 'Rooftop community cafe', 'Lockers', 'Social events'] },
  { kind: 'hostels', name: 'Zostel Delhi', destination: 'Delhi', priceINR: 750, rating: 4.4, amenities: ['Near New Delhi Railway Station', 'Free Wi-Fi', 'Travel desk', 'Common kitchen'] },
  { kind: 'hostels', name: 'Pink City Backpackers Hostel', destination: 'Jaipur', priceINR: 650, rating: 4.3, amenities: ['Wi-Fi', 'Shared kitchen', 'Lockers', 'Rooftop bonfire'] },
  { kind: 'hostels', name: 'The Hosteller Goa (Anjuna)', destination: 'Goa', priceINR: 799, rating: 4.6, amenities: ['Swimming pool', 'Cafe', 'Motorbike rentals', 'Game room'] },
  { kind: 'hostels', name: 'Zostel Varanasi', destination: 'Varanasi', priceINR: 600, rating: 4.5, amenities: ['Rooftop overlooking Ganges Aarti', 'Chai bar', 'Lockers'] },
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log(`Connected to MongoDB. Seeding ${options.length} travel options...`)
    const operations = options.map((option) => ({
      updateOne: {
        filter: { kind: option.kind, name: option.name, origin: option.origin || '', destination: option.destination },
        update: { $set: { ...option, estimated: false, provider: 'seed' } },
        upsert: true,
      },
    }))
    const result = await TravelOption.bulkWrite(operations)
    console.log(
      `Travel options updated: ${result.modifiedCount}; upserted: ${result.upsertedCount}; total active: ${options.length}.`,
    )
  } catch (error) {
    console.error('Travel option seeding failed:', error.message)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

seed()
