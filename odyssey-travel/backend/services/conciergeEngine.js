const Destination = require('../models/Destination')

// Curated destination cafe databases for popular destinations
const curatedCafes = {
  goa: {
    title: 'Top Evening Cafes & Sundowners in Goa',
    spots: [
      { name: 'Eva Cafe (Anjuna Cliff)', vibe: 'Bohemian Santorini aesthetic right over the waves', signature: 'Iced Americano, Shakshuka, and sunset sangria', timing: 'Best from 17:00 to 19:30 for golden hour' },
      { name: 'Purple Martini (Vagator Cliff)', vibe: 'Iconic cliffside sunset lounge with live saxophone & ocean views', signature: 'Signature cocktails & Mediterranean platters', timing: 'Arrive by 17:15 for front-row sunset seating' },
      { name: 'Thalassa (Siolim Waterfront)', vibe: 'Celebrated open-air Greek taverna overlooking the backwaters', signature: 'Greek dips, grilled souvlaki, and house wines', timing: 'Twilight and dinner' },
      { name: 'Artjuna (Anjuna)', vibe: 'Open-air garden cafe under mango trees with lifestyle boutique', signature: 'Artisanal drip coffee, tahini smoothies, and fresh waffles', timing: 'Late afternoon to relaxed evening' },
      { name: 'Babka (Arpora)', vibe: 'Specialty bakery and specialty roastery cafe', signature: 'Dark chocolate babka roll and cold brews', timing: 'Great for evening dessert & coffee' },
    ],
  },
  jaipur: {
    title: 'Top Evening Cafes & Rooftops in Jaipur',
    spots: [
      { name: 'Tapri Central (C-Scheme)', vibe: 'Rooftop overlooking Central Park with eclectic vintage decor', signature: 'Cutting chai in clay kulhad, Sa-dum noodles, and vada pav', timing: '17:30 onwards as the breeze picks up' },
      { name: 'The Tattoo Cafe / Wind View Cafe', vibe: 'Directly across from the ornate facade of Hawa Mahal', signature: 'Masala chai, iced frappes, and pizza slices', timing: 'Golden hour when the palace facade glows rose-amber' },
      { name: 'Bar Palladio (Narain Niwas Palace)', vibe: 'Regal peacock-blue Italian lounge and candlelit garden canopies', signature: 'Artisanal espresso, tiramisu, and classic negronis', timing: 'Romantic candlelit twilight' },
      { name: 'Stepout Cafe & Booklounge', vibe: 'Cozy book-lined cafe with relaxed seating and board games', signature: 'Hand-poured pour-over coffee and thin-crust pizzas', timing: 'Anytime in the evening' },
    ],
  },
  pondicherry: {
    title: 'Top Evening Cafes in Pondicherry (French Quarter & Promenade)',
    spots: [
      { name: 'Coromandel Cafe (Rue Romain Rolland)', vibe: '19th-century French mansion with lush courtyard, chandeliers & pink bougainvillea', signature: 'Hot chocolate, rose cold brew, and salted caramel tarts', timing: 'Ideal for 17:00 tea or candlelit dinner' },
      { name: 'Cafe des Arts (Suffren Street)', vibe: 'Vintage colonial townhouse with sunlit courtyard and bohemian art', signature: 'Fresh buckwheat crepes, artisanal espresso, and gazpacho', timing: 'Late afternoon till sunset' },
      { name: 'Le Cafe (Rock Beach)', vibe: 'Open-air seafront cafe right on the crash of the Bay of Bengal waves', signature: 'Filter coffee, croissants, and ocean breeze', timing: '24/7, stunning under evening sea lights' },
      { name: 'Hope Cafe (Heritage Town)', vibe: 'Arty graffiti courtyard with vegan & organic options', signature: 'Pesto pasta, artisanal hibiscus tea, and sourdough toasts', timing: 'Peaceful evening reading & coffee' },
    ],
  },
  udaipur: {
    title: 'Top Evening Cafes & Lakeview Lounges in Udaipur',
    spots: [
      { name: "Jheel's Ginger Coffee Bar (Gangaur Ghat)", vibe: 'Steps leading directly into Lake Pichola with panoramic palace views', signature: 'Ginger honey lemon tea, iced mocha, and wood-fired thin-crust pizza', timing: 'Sunset as City Palace lights turn on' },
      { name: 'Upre by 1559 AD (Lake Pichola)', vibe: 'Rooftop cabana seating with uninterrupted view of Lake Palace', signature: 'Cocktails and Mughlai/Rajasthani dinner', timing: 'Reservations recommended for sunset' },
      { name: 'Sun & Moon Rooftop Cafe', vibe: 'High elevation overlooking Jagdish Temple and old quarter rooftops', signature: 'Masala chai, pancakes, and twilight breezes', timing: 'Evening golden hour' },
    ],
  },
  manali: {
    title: 'Top Evening Cafes in Manali (Old Manali & Riverbank)',
    spots: [
      { name: 'Cafe 1947 (Old Manali)', vibe: 'Riverside stone-and-timber cafe right beside the roaring Manalsu river', signature: 'Wood-fired pizza, river trout, and warm apple cider', timing: '17:00 onwards with live acoustic jam sessions' },
      { name: 'The Lazy Dog (Old Manali)', vibe: 'Wooden deck with hammock chairs overlooking mountain forest', signature: 'Craft beers, Korean bowls, and hot chocolate', timing: 'Chilly mountain evenings' },
      { name: 'Drifters’ Cafe (Old Manali)', vibe: 'Sunlit cafe with acoustic music and board games', signature: 'Shepherd’s pie, pancakes, and specialty cappuccinos', timing: 'Evening hangout after a trek' },
    ],
  },
  munnar: {
    title: 'Top Evening Cafes & Tea Spots in Munnar',
    spots: [
      { name: 'Rapsy Restaurant & Cafe (Munnar Market)', vibe: 'Bustling legacy cafe loved by hikers and global backpackers', signature: 'Cardamom black tea, Spanish omelettes, and warm banana pancakes', timing: 'Cool misty evenings' },
      { name: 'Tea Tales Cafe (Nullatanni)', vibe: 'Cozy boutique tea lounge surrounded by green estates', signature: 'First-flush Munnar white tea and cardamom cakes', timing: 'Sunset tea time' },
    ],
  },
}

// Helper to find a destination mentioned in user text or context
async function detectDestination(message, destinationId) {
  if (destinationId) {
    try {
      const dest = await Destination.findById(destinationId)
      if (dest) return dest
    } catch (_) {}
  }

  const allDests = await Destination.find({}, 'name state country attractions famousSpots averageDailyBudgetINR bestTimeToVisit nearestAirport nearestRailwayStation description')
  const lowerMsg = (message || '').toLowerCase()

  // Exact or word boundary match
  for (const d of allDests) {
    const nameLower = d.name.toLowerCase()
    const regex = new RegExp(`\\b${nameLower.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i')
    if (regex.test(lowerMsg)) {
      return d
    }
  }

  // Partial match if longer than 3 chars
  for (const d of allDests) {
    const nameLower = d.name.toLowerCase()
    if (nameLower.length > 3 && lowerMsg.includes(nameLower)) {
      return d
    }
  }

  return null
}

async function handleConciergeChat({ message, conversationHistory = [], destinationId, userDoc }) {
  const trimmed = (message || '').trim()
  const lower = trimmed.toLowerCase()
  const userProfile = userDoc?.travelProfile || {}
  const userName = userDoc?.name ? userDoc.name.split(' ')[0] : 'Traveler'

  // Detect destination either from explicit parameter or from text
  const destination = await detectDestination(trimmed, destinationId)

  // 1. GREETINGS (Only if message is purely a greeting)
  const isPureGreeting = /^(hi|hello|hey|greetings|hola|namaste|good morning|good evening|good afternoon|sup)\b/i.test(trimmed) && trimmed.length < 20
  if (isPureGreeting) {
    return {
      reply: `Hello ${userName}! Welcome to Odyssey AI Travel Concierge. I have your travel preferences (${userProfile.travelStyle || 'Balanced'} pace, ${userProfile.dietaryPreference || 'any'} cuisine) loaded.\n\nHow can I guide your upcoming voyage today? You can ask me for:\n• **Cafe & dining recommendations** (rooftop, cliffside, hidden bakeries)\n• **Hidden gems & secret viewpoints**\n• **Curated multi-day itineraries** with day/evening breakdowns\n• **Packing checklists & weather guides**\n• **Budget & transportation advice**`,
      suggestedActions: destination
        ? [`Top attractions in ${destination.name}`, `Evening cafe recommendations`, `Plan 3-day itinerary here`]
        : ['Evening cafe recommendations', 'Beach trip under ₹40,000', 'Explore 50+ destinations'],
    }
  }

  // 2. CAFES, COFFEE, TEA & EVENING LOUNGES
  if (
    lower.includes('cafe') ||
    lower.includes('café') ||
    lower.includes('coffee') ||
    lower.includes('tea') ||
    lower.includes('chai') ||
    lower.includes('bakery') ||
    lower.includes('rooftop') ||
    lower.includes('sundowner') ||
    lower.includes('lounge') ||
    lower.includes('patisserie')
  ) {
    if (destination) {
      const destKey = destination.name.toLowerCase()
      const curated = curatedCafes[destKey]
      if (curated) {
        let replyText = `### ☕ ${curated.title}\nHere are our handpicked evening cafes for relaxed vibes, delicious coffee, and stunning twilight views in **${destination.name}**:\n\n`
        curated.spots.forEach((spot, i) => {
          replyText += `${i + 1}. **${spot.name}**\n   • **Vibe:** ${spot.vibe}\n   • **Must-try:** ${spot.signature}\n   • **Best time:** ${spot.timing}\n\n`
        })
        replyText += `*Tip: Many popular sunset spots fill up quickly around 17:30. Arrive slightly early to secure a prime view!*`
        return {
          reply: replyText,
          suggestedActions: [
            `Top local food spots in ${destination.name}`,
            `Hidden gems in ${destination.name}`,
            `Plan 3-day itinerary in ${destination.name}`,
          ],
        }
      }

      // Generic destination cafe response using its attractions/state
      return {
        reply: `### ☕ Evening Cafe & Sunset Recommendations for ${destination.name}\n\nIn **${destination.name}**, evening cafe culture centers around panoramic sunset viewpoints, heritage quarter nooks, and artisan coffee houses:\n\n1. **Heritage / Old Town Promenade Cafes**\n   • Head to the historic central quarter near ${(destination.attractions || [])[0] || destination.name} for courtyard coffee houses and local bakeries.\n2. **Rooftop & Sunset View Cafes**\n   • Look for rooftop establishments facing natural landmarks or lakes/hills for amber golden-hour lighting.\n3. **Local Tea & Regional Coffee Stalls**\n   • Don't miss sampling regional freshly brewed tea or pour-overs along the lively evening markets.\n\n*Would you like food recommendations or a full evening walking itinerary for ${destination.name}?*`,
        suggestedActions: [
          `Top food spots in ${destination.name}`,
          `Best time to visit ${destination.name}`,
          `Plan 3-day itinerary here`,
        ],
      }
    }

    // General cafe recommendations across popular regions
    let replyText = `### ☕ Top Evening Cafe Recommendations by Destination Style\n\nHere are some of our travelers' favorite aesthetic evening cafes and sunset lounges across India:\n\n`
    replyText += `1. **Cliffside & Coastal Sunsets (Goa & Pondicherry)**\n`
    replyText += `   • **Eva Cafe (Anjuna, Goa)**: Grecian white cliff cafe with chilled ocean views & iced frappes.\n`
    replyText += `   • **Coromandel Cafe (Pondicherry)**: 19th-century French mansion with lush courtyard, cold brew & pastries.\n\n`
    replyText += `2. **Heritage & Royal Palaces (Jaipur & Udaipur)**\n`
    replyText += `   • **Tapri Central (Jaipur)**: Rooftop cutting chai overlooking Central Park with evening breezes.\n`
    replyText += `   • **Jheel's Ginger Coffee Bar (Udaipur)**: Waterfront cafe dipping onto Lake Pichola with illuminated palace views.\n\n`
    replyText += `3. **Misty Mountain Escapes (Manali & Munnar)**\n`
    replyText += `   • **Cafe 1947 (Old Manali)**: Riverside stone cabin with wood-fired pizza and acoustic river vibes.\n`
    replyText += `   • **Rapsy Cafe (Munnar)**: Mountain hill-station cafe famous for cardamom tea & banana pancakes.\n\n`
    replyText += `*Which destination are you traveling to? Tell me the city (e.g. Goa, Jaipur, Pondicherry, Munnar) and I'll give you exact locations and menus!*`

    return {
      reply: replyText,
      suggestedActions: [
        'Evening cafes in Goa',
        'Rooftop cafes in Jaipur',
        'French cafes in Pondicherry',
      ],
    }
  }

  // 3. FOOD, RESTAURANTS & LOCAL DELICACIES
  if (
    lower.includes('food') ||
    lower.includes('restaurant') ||
    lower.includes('eat') ||
    lower.includes('dining') ||
    lower.includes('dish') ||
    lower.includes('cuisine') ||
    lower.includes('street food') ||
    lower.includes('breakfast') ||
    lower.includes('dinner') ||
    lower.includes('lunch') ||
    lower.includes('thali') ||
    lower.includes('seafood')
  ) {
    if (destination) {
      const attractionsText = (destination.attractions || []).slice(0, 3).join(', ')
      return {
        reply: `### 🍽️ Culinary Guide to ${destination.name} (${destination.state || destination.country})\n\nTaking your preferences into account, here is your essential dining guide for **${destination.name}**:\n\n1. **Iconic Regional Specialties**\n   • Sample authentic generational recipes unique to ${destination.state || destination.country}. Look for long-standing family-run eateries near ${attractionsText || 'the city center'}.\n2. **Morning Breakfast & Street Food Trails**\n   • Start your morning early at the historic bazaar for freshly prepared regional breakfast staples and hot spiced tea.\n3. **Sunset Dining**\n   • Reserve an open-air or rooftop table in the evening to enjoy dinner while taking in twilight views.\n\n*Dietary Tip: ${userProfile.dietaryPreference && userProfile.dietaryPreference !== 'None' ? `We keep your **${userProfile.dietaryPreference}** preference top of mind.` : 'Most local restaurants readily cater to vegetarian and dietary requests; simply request "freshly prepared" dishes.'}*`,
        suggestedActions: [
          `Evening cafe recommendations`,
          `Hidden gems in ${destination.name}`,
          `Plan 3-day itinerary here`,
        ],
      }
    }

    return {
      reply: `### 🍽️ Odyssey Culinary Discovery Trails\n\nFood is the heart of every great journey! Here are iconic regional food journeys in India:\n\n• **Rajasthan (Jaipur/Udaipur)**: Traditional Royal Thali with Dal Baati Churma, Ker Sangri, and freshly made Ghewar.\n• **Goa & Coastal Konkan**: Fresh catch rava-fried fish, coconut curry, poee bread, and multi-layered Bebinca dessert.\n• **Kerala Backwaters**: Banana-leaf Sadhya, soft fluffy Appams with vegetable/chicken stew, and Malabar parotta.\n• **Varanasi & Old Delhi**: Early morning kachori sabzi, malaiyo/lassi in clay kulhads, and historic street chaat.\n\n*Tell me which destination you are visiting for tailored restaurant recommendations!*`,
      suggestedActions: [
        'Food trail in Goa',
        'Best food in Jaipur',
        'Kerala cuisine recommendations',
      ],
    }
  }

  // 4. HIDDEN GEMS & SECRET SPOTS
  if (
    lower.includes('hidden gem') ||
    lower.includes('secret') ||
    lower.includes('offbeat') ||
    lower.includes('less crowded') ||
    lower.includes('quiet') ||
    lower.includes('peaceful')
  ) {
    if (destination) {
      const spots = destination.famousSpots || []
      let replyText = `### ✨ Hidden Gems & Offbeat Spots in ${destination.name}\n\nEscape the crowds and discover these authentic spots:\n\n`
      if (spots.length > 2) {
        spots.slice(1, 4).forEach((s, idx) => {
          replyText += `${idx + 1}. **${s.name}**: ${s.description ? s.description.slice(0, 140) + '...' : 'A serene location offering quiet viewpoints away from mid-day crowds.'}\n`
        })
      } else {
        replyText += `1. **Old Quarter Back-Alleys**: Walk the quiet residential lanes at sunrise before tour buses arrive.\n2. **Sunrise Vantage Point**: Experience early morning vistas from the high ridge overlooking ${(destination.attractions || [])[0] || destination.name}.\n3. **Local Artisan Clusters**: Visit neighborhood workshops where generational craftsmen practice without commercial showrooms.\n`
      }
      replyText += `\n*Best Explorer Tip: Visit between 06:30 and 08:30 AM for undisturbed photography and quiet moments.*`

      return {
        reply: replyText,
        suggestedActions: [
          `Evening cafe recommendations`,
          `What should I pack for ${destination.name}?`,
          `Plan 3-day itinerary here`,
        ],
      }
    }

    return {
      reply: `### ✨ Top Offbeat Destinations & Hidden Gems\n\nIf you prefer unhurried, authentic voyages away from heavy tourist corridors:\n\n• **Hampi (Karnataka)**: Ancient boulder-strewn ruins, coracle boat rides across the Tungabhadra, and timeless sunsets.\n• **Meghalaya**: Living Root Bridges of Nohwet, transparent waters of Dawki, and misty sacred forest trails.\n• **Divar Island (Goa)**: A quiet ferry crossing leads to old-world Portuguese chapels, paddy dykes, and zero traffic.\n• **Ziro Valley (Arunachal)**: Lush pine hills, rice terraces, and unique Apatani cultural settlements.\n\n*Would you like a customized itinerary for one of these tranquil retreats?*`,
      suggestedActions: [
        'Tell me more about Hampi',
        'Explore Meghalaya itinerary',
        'Beach trip under ₹40,000',
      ],
    }
  }

  // 5. ATTRACTIONS & SIGHTSEEING
  if (
    lower.includes('attraction') ||
    lower.includes('things to do') ||
    lower.includes('what to see') ||
    lower.includes('places to visit') ||
    lower.includes('sightseeing') ||
    lower.includes('must visit') ||
    lower.includes('highlights')
  ) {
    if (destination) {
      const attractions = destination.attractions || []
      const spots = destination.famousSpots || []
      let replyText = `### 📍 Top Highlights & Attractions in ${destination.name}\n\n`
      replyText += `${destination.description ? destination.description.slice(0, 220) + '...' : ''}\n\n`
      replyText += `**Essential Landmarks:**\n`
      attractions.forEach((a, i) => {
        replyText += `• **${a}**: Landmark attraction in ${destination.name}. Arrive early morning to beat queues.\n`
      })
      if (spots.length) {
        replyText += `\n**Must-Visit Signature Spots:**\n`
        spots.slice(0, 3).forEach((s) => {
          replyText += `• **${s.name}**: ${s.description ? s.description.slice(0, 110) + '...' : ''}\n`
        })
      }
      replyText += `\n**Best Time to Visit:** ${destination.bestTimeToVisit || 'October to March'}\n`
      replyText += `**Average Daily Budget:** ₹${(destination.averageDailyBudgetINR || 4500).toLocaleString('en-IN')}/person`

      return {
        reply: replyText,
        suggestedActions: [
          `Evening cafe recommendations`,
          `How to reach ${destination.name}`,
          `Plan 3-day itinerary here`,
        ],
      }
    }

    return {
      reply: `Odyssey features **70 curated world-class destinations**! Are you looking for:\n\n• **Sun & Coastline**: Goa, Andaman Islands, Bali, Santorini, Kerala Backwaters\n• **Royal Heritage**: Jaipur, Udaipur, Agra, Hampi, Rome, Athens\n• **Alpine High Peaks**: Leh-Ladakh, Manali, Munnar, Darjeeling, Shimla\n• **Spiritual & Culture**: Varanasi, Amritsar, Rishikesh, Kyoto\n\n*Tell me a destination name or style, and I'll lay out all its attractions and secrets!*`,
      suggestedActions: [
        'Top attractions in Goa',
        'Top attractions in Jaipur',
        'Top attractions in Manali',
      ],
    }
  }

  // 6. ITINERARY & TRIP PLANNING
  if (
    lower.includes('itinerary') ||
    lower.includes('plan') ||
    lower.includes('schedule') ||
    lower.includes('day by day') ||
    lower.includes('3-day') ||
    lower.includes('5-day') ||
    lower.includes('days')
  ) {
    if (destination) {
      return {
        reply: `### 🗺️ Curated 3-Day Journey Outline for ${destination.name}\n\n• **Day 1: Arrival & Iconic Landmarks**\n  - Morning: Check-in, settle in, visit ${(destination.attractions || [])[0] || destination.name}.\n  - Afternoon: Authentic regional lunch & old quarter wander.\n  - Evening: Sunset view and dinner at a recommended local cafe.\n\n• **Day 2: Culture, Nature & Local Rhythm**\n  - Morning: ${(destination.attractions || [])[1] || 'Scenic excursion'}.\n  - Afternoon: Artisan markets & shopping for authentic handicrafts.\n  - Evening: Twilight boat ride or cultural performance.\n\n• **Day 3: Hidden Gems & Departure**\n  - Morning: ${(destination.attractions || [])[2] || 'Quiet sunrise viewpoint'}.\n  - Afternoon: Leisurely farewell lunch & transit to ${destination.nearestAirport || 'the airport'}.\n\n*You can also open our **Wayfinder AI** tab to save a customized PDF itinerary with costs and maps!*`,
        suggestedActions: [
          `Evening cafe recommendations`,
          `What should I pack for ${destination.name}?`,
          `Go to Wayfinder Planner`,
        ],
      }
    }

    return {
      reply: `I can craft an optimized day-by-day travel plan tailored to your budget and interests! To generate the best schedule, tell me:\n1. Your destination (e.g. Goa, Jaipur, Kerala, Munnar)\n2. How many days (1 to 10 days)\n3. Your preferred style (Balanced, Relaxed, Cultural, or Foodie)\n\nOr click below to launch the smart generator:`,
      suggestedActions: [
        '3-Day Goa Itinerary',
        '3-Day Jaipur Itinerary',
        'Open Wayfinder AI',
      ],
    }
  }

  // 7. PACKING & CLIMATE
  if (
    lower.includes('pack') ||
    lower.includes('clothes') ||
    lower.includes('what to wear') ||
    lower.includes('shoes') ||
    lower.includes('essentials') ||
    lower.includes('gear')
  ) {
    const destName = destination ? destination.name : 'your destination'
    return {
      reply: `### 🎒 Essential Packing Checklist for ${destName}\n\n1. **Apparel & Footwear**\n   • Breathable cottons or linens for daytime warmth.\n   • One lightweight jacket or sweater for air-conditioned transit & cool evenings.\n   • Comfortable walking sneakers with grip for stones and trails.\n   • A light shawl or scarf (vital for temple modesty and temple visits).\n\n2. **Sun & Health Protection**\n   • Broad-spectrum SPF 50+ sunscreen and UV sunglasses.\n   • Reusable insulated water bottle & oral rehydration electrolytes.\n   • Compact first-aid kit with personal medicines and insect repellent.\n\n3. **Tech & Essentials**\n   • 10,000+ mAh power bank for full-day photo exploration.\n   • Universal adapter & waterproof pouch for phone and passport.`,
      suggestedActions: [
        destination ? `Evening cafe recommendations` : 'Check weather forecast',
        destination ? `Top attractions in ${destination.name}` : 'Search flights & trains',
        'Create smart itinerary',
      ],
    }
  }

  // 8. BUDGET & EXPENSES
  if (
    lower.includes('budget') ||
    lower.includes('cost') ||
    lower.includes('price') ||
    lower.includes('money') ||
    lower.includes('how much') ||
    lower.includes('rupees') ||
    lower.includes('inr')
  ) {
    const daily = destination?.averageDailyBudgetINR || userProfile.typicalBudgetPerDayINR || 4500
    return {
      reply: `### 💰 Budget Guidance${destination ? ` for ${destination.name}` : ''}\n\n• **Average Daily Spend**: ~₹${daily.toLocaleString('en-IN')} per traveler.\n• **Estimated Breakdown**:\n  - **Stays (mid-range boutique)**: ~40% (₹${Math.round(daily * 0.4).toLocaleString('en-IN')})\n  - **Dining & Cafes**: ~30% (₹${Math.round(daily * 0.3).toLocaleString('en-IN')})\n  - **Activities & Entry Tickets**: ~18% (₹${Math.round(daily * 0.18).toLocaleString('en-IN')})\n  - **Local Taxis & Autos**: ~12% (₹${Math.round(daily * 0.12).toLocaleString('en-IN')})\n\n*Pro-Tip: Booking train/flight transit 3 weeks early and using Odyssey discount coupons can save 15-25% on overall trip expense.*`,
      suggestedActions: [
        'Play Contest of Bow for 15% off',
        destination ? `Evening cafe recommendations` : 'Find stays and transport',
        'Generate budget itinerary',
      ],
    }
  }

  // 9. TRANSPORT, FLIGHTS & HOW TO REACH
  if (
    lower.includes('flight') ||
    lower.includes('train') ||
    lower.includes('reach') ||
    lower.includes('airport') ||
    lower.includes('railway') ||
    lower.includes('how to get') ||
    lower.includes('transport')
  ) {
    if (destination) {
      return {
        reply: `### ✈️ How to Reach ${destination.name}\n\n• **Nearest Airport**: ${destination.nearestAirport || 'Major regional hub'}\n• **Nearest Railway Station**: ${destination.nearestRailwayStation || 'Central junction'}\n• **Local Transit**: Pre-paid airport cabs, app-based taxis, and auto-rickshaws are widely available. For day tours, hiring a dedicated private driver is usually the most relaxed option.\n\nYou can compare live flight, train, and bus fares for ${destination.name} directly under our **Travel Search** tab!`,
        suggestedActions: [
          'Go to Travel Search',
          `Evening cafe recommendations`,
          `Top attractions in ${destination.name}`,
        ],
      }
    }

    return {
      reply: `You can compare and book live transit across India directly on Odyssey:\n• **Flights**: Domestic connections across 40+ airports.\n• **Express Trains**: Vande Bharat & Rajdhani routes with live seat indicators.\n• **Luxury Stays & Buses**: Curated stays in prime locations.\n\n*Which city are you originating from and heading to?*`,
      suggestedActions: [
        'Open Travel Search',
        'Explore all destinations',
        'Evening cafe recommendations',
      ],
    }
  }

  // 10. BEST TIME TO VISIT & SEASONS
  if (
    lower.includes('weather') ||
    lower.includes('season') ||
    lower.includes('when to visit') ||
    lower.includes('best time') ||
    lower.includes('rain') ||
    lower.includes('monsoon') ||
    lower.includes('winter')
  ) {
    if (destination) {
      return {
        reply: `### ☀️ Best Time to Visit ${destination.name}\n\n• **Recommended Window**: **${destination.bestTimeToVisit || 'October to March'}**\n• **Peak Season**: Pleasantly cool temperatures with clear skies, ideal for outdoor sightseeing and evening cafe promenades.\n• **Monsoon (June - September)**: Lush greenery and dramatic clouds; great for lower accommodation rates, but carry waterproof gear.\n• **Summer (April - June)**: Early mornings and late evenings are best for activities; rest during peak afternoon hours.`,
        suggestedActions: [
          `Evening cafe recommendations`,
          `What should I pack for ${destination.name}?`,
          `Plan 3-day itinerary here`,
        ],
      }
    }

    return {
      reply: `### 🗓️ Seasonal Travel Guide for India\n\n• **October – March (Winter/Peak)**: Ideal for Rajasthan, Goa, Kerala, and South India. Warm sunny days, cool evenings.\n• **April – June (Summer)**: Head to higher Himalayas (Leh-Ladakh, Manali, Shimla, Munnar) for alpine breezes and flower valleys.\n• **July – September (Monsoon Magic)**: Spectacular waterfalls and misty hills in Meghalaya, Western Ghats, and Udaipur.\n\n*Tell me your planned travel month, and I'll match the best destinations!*`,
      suggestedActions: [
        'Winter destinations in India',
        'Top mountain escapes',
        'Evening cafe recommendations',
      ],
    }
  }

  // 11. GENERAL / SMART ASSISTANT FALLBACK
  // Never repeat the generic greeting! Provide helpful context and direct choices.
  return {
    reply: `I'm here to assist your journey${destination ? ` in **${destination.name}**` : ''}!\n\nWhether you'd like **evening cafe & dining spots**, **local hidden gems**, **day-by-day travel plans**, or **packing & budget advice**, let me know what sounds best. You can also mention any destination across India and worldwide!`,
    suggestedActions: destination
      ? [
          `Evening cafe recommendations in ${destination.name}`,
          `Top attractions in ${destination.name}`,
          `Plan 3-day itinerary here`,
        ]
      : [
          'Evening cafe recommendations',
          'Explore top destinations',
          'Beach trip under ₹40,000',
        ],
  }
}

module.exports = { handleConciergeChat }
