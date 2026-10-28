require('dotenv').config()
const mongoose = require('mongoose')
const Destination = require('../models/Destination')

const sleep = ms => new Promise(r => setTimeout(r, ms))

const NEW_20_DESTINATIONS = [
  {
    name: 'Tokyo',
    country: 'Japan',
    state: 'Kantō',
    description: 'A vibrant world metropolis blending ultramodern neon skyscrapers, ancient Shinto shrines, historic tea ceremonies, and renowned culinary scenes.',
    bestTimeToVisit: 'March to May and September to November',
    averageDailyBudgetINR: 18000,
    attractions: ['Shibuya Crossing', 'Sensō-ji Temple', 'Tokyo Skytree', 'Meiji Shrine'],
    coordinates: { latitude: 35.6762, longitude: 139.6503 },
    nearestAirport: 'Haneda Airport (HND) / Narita Airport (NRT)',
    nearestRailwayStation: 'Tokyo Station',
    mainWiki: 'Tokyo',
    spots: [
      { name: 'Shibuya Crossing', wiki: 'Shibuya_Crossing' },
      { name: 'Sensō-ji Temple', wiki: 'Sens%C5%8D-ji' },
      { name: 'Tokyo Skytree', wiki: 'Tokyo_Skytree' },
      { name: 'Meiji Shrine', wiki: 'Meiji_Shrine' }
    ]
  },
  {
    name: 'Barcelona',
    country: 'Spain',
    state: 'Catalonia',
    description: 'An enchanting Mediterranean city celebrated for Antoni Gaudí’s surreal modernist architecture, Gothic Quarter avenues, and sunlit coastal beaches.',
    bestTimeToVisit: 'May to June and September to October',
    averageDailyBudgetINR: 16000,
    attractions: ['Sagrada Família', 'Park Güell', 'Casa Batlló', 'La Rambla'],
    coordinates: { latitude: 41.3879, longitude: 2.1699 },
    nearestAirport: 'Josep Tarradellas Barcelona–El Prat Airport (BCN)',
    nearestRailwayStation: 'Barcelona Sants',
    mainWiki: 'Barcelona',
    spots: [
      { name: 'Sagrada Família', wiki: 'Sagrada_Fam%C3%ADlia' },
      { name: 'Park Güell', wiki: 'Park_G%C3%BCell' },
      { name: 'Casa Batlló', wiki: 'Casa_Batll%C3%B3' },
      { name: 'La Rambla', wiki: 'La_Rambla,_Barcelona' }
    ]
  },
  {
    name: 'Amsterdam',
    country: 'Netherlands',
    state: 'North Holland',
    description: 'A picturesque historic capital of romantic 17th-century canal rings, gabled brick townhouses, world-famous museums, and cycling boulevards.',
    bestTimeToVisit: 'April to May and September to November',
    averageDailyBudgetINR: 18000,
    attractions: ['Canals of Amsterdam', 'Rijksmuseum', 'Van Gogh Museum', 'Anne Frank House'],
    coordinates: { latitude: 52.3676, longitude: 4.9041 },
    nearestAirport: 'Amsterdam Airport Schiphol (AMS)',
    nearestRailwayStation: 'Amsterdam Centraal',
    mainWiki: 'Amsterdam',
    spots: [
      { name: 'Canals of Amsterdam', wiki: 'Canals_of_Amsterdam' },
      { name: 'Rijksmuseum', wiki: 'Rijksmuseum' },
      { name: 'Van Gogh Museum', wiki: 'Van_Gogh_Museum' },
      { name: 'Anne Frank House', wiki: 'Anne_Frank_House' }
    ]
  },
  {
    name: 'Venice',
    country: 'Italy',
    state: 'Veneto',
    description: 'The floating Queen of the Adriatic built on 118 lagoon islands, connected by stone bridges, ornate Gothic palazzos, and singing gondoliers.',
    bestTimeToVisit: 'April to June and September to October',
    averageDailyBudgetINR: 19000,
    attractions: ['St. Mark\'s Basilica', 'Rialto Bridge', 'Grand Canal', 'Doge\'s Palace'],
    coordinates: { latitude: 45.4408, longitude: 12.3155 },
    nearestAirport: 'Venice Marco Polo Airport (VCE)',
    nearestRailwayStation: 'Venezia Santa Lucia',
    mainWiki: 'Venice',
    spots: [
      { name: 'St. Mark\'s Basilica', wiki: 'St_Mark%27s_Basilica' },
      { name: 'Rialto Bridge', wiki: 'Rialto_Bridge' },
      { name: 'Grand Canal', wiki: 'Grand_Canal_(Venice)' },
      { name: 'Doge\'s Palace', wiki: 'Doge%27s_Palace' }
    ]
  },
  {
    name: 'Prague',
    country: 'Czech Republic',
    state: 'Bohemia',
    description: 'The City of a Hundred Spires, boasting fairy-tale Gothic towers, Baroque cathedrals, the cobblestone Charles Bridge, and rich Bohemian heritage.',
    bestTimeToVisit: 'May to September',
    averageDailyBudgetINR: 12000,
    attractions: ['Charles Bridge', 'Prague Castle', 'Old Town Square', 'Astronomical Clock'],
    coordinates: { latitude: 50.0755, longitude: 14.4378 },
    nearestAirport: 'Václav Havel Airport Prague (PRG)',
    nearestRailwayStation: 'Praha hlavní nádraží',
    mainWiki: 'Prague',
    spots: [
      { name: 'Charles Bridge', wiki: 'Charles_Bridge' },
      { name: 'Prague Castle', wiki: 'Prague_Castle' },
      { name: 'Old Town Square', wiki: 'Old_Town_Square_(Prague)' },
      { name: 'Astronomical Clock', wiki: 'Prague_astronomical_clock' }
    ]
  },
  {
    name: 'Sydney',
    country: 'Australia',
    state: 'New South Wales',
    description: 'Australia’s iconic harbor city pairing the sail-like rooflines of Sydney Opera House with golden surf beaches, vibrant gardens, and ocean cliffs.',
    bestTimeToVisit: 'September to November and March to May',
    averageDailyBudgetINR: 22000,
    attractions: ['Sydney Opera House', 'Sydney Harbour Bridge', 'Bondi Beach', 'Darling Harbour'],
    coordinates: { latitude: -33.8688, longitude: 151.2093 },
    nearestAirport: 'Sydney Kingsford Smith Airport (SYD)',
    nearestRailwayStation: 'Central Station Sydney',
    mainWiki: 'Sydney',
    spots: [
      { name: 'Sydney Opera House', wiki: 'Sydney_Opera_House' },
      { name: 'Sydney Harbour Bridge', wiki: 'Sydney_Harbour_Bridge' },
      { name: 'Bondi Beach', wiki: 'Bondi_Beach' },
      { name: 'Darling Harbour', wiki: 'Darling_Harbour' }
    ]
  },
  {
    name: 'Cape Town',
    country: 'South Africa',
    state: 'Western Cape',
    description: 'A dramatic coastal city framed by the flat-topped monolith of Table Mountain, penguin colonies at Boulders Beach, and rugged Cape Peninsula cliffs.',
    bestTimeToVisit: 'November to March',
    averageDailyBudgetINR: 14000,
    attractions: ['Table Mountain', 'Boulders Beach', 'Cape Point', 'Kirstenbosch Gardens'],
    coordinates: { latitude: -33.9249, longitude: 18.4241 },
    nearestAirport: 'Cape Town International Airport (CPT)',
    nearestRailwayStation: 'Cape Town Railway Station',
    mainWiki: 'Cape_Town',
    spots: [
      { name: 'Table Mountain', wiki: 'Table_Mountain' },
      { name: 'Boulders Beach', wiki: 'Boulders_Beach' },
      { name: 'Cape Point', wiki: 'Cape_Point' },
      { name: 'Kirstenbosch Botanical Gardens', wiki: 'Kirstenbosch_National_Botanical_Garden' }
    ]
  },
  {
    name: 'Cairo',
    country: 'Egypt',
    state: 'Cairo Governorate',
    description: 'The cradle of ancient civilization along the Nile, home to the monumental Pyramids of Giza, golden pharaonic treasures, and labyrinthine Islamic bazaars.',
    bestTimeToVisit: 'October to April',
    averageDailyBudgetINR: 9000,
    attractions: ['Great Pyramid of Giza', 'Great Sphinx of Giza', 'Egyptian Museum', 'Khan el-Khalili'],
    coordinates: { latitude: 30.0444, longitude: 31.2357 },
    nearestAirport: 'Cairo International Airport (CAI)',
    nearestRailwayStation: 'Ramses Railway Station',
    mainWiki: 'Cairo',
    spots: [
      { name: 'Great Pyramid of Giza', wiki: 'Giza_pyramid_complex' },
      { name: 'Great Sphinx of Giza', wiki: 'Great_Sphinx_of_Giza' },
      { name: 'Egyptian Museum', wiki: 'Egyptian_Museum' },
      { name: 'Khan el-Khalili', wiki: 'Khan_el-Khalili' }
    ]
  },
  {
    name: 'Rio de Janeiro',
    country: 'Brazil',
    state: 'Rio de Janeiro',
    description: 'The Marvelous City nestled between tropical green peaks and the Atlantic, famed for Christ the Redeemer, Copacabana sands, and samba rhythms.',
    bestTimeToVisit: 'December to March',
    averageDailyBudgetINR: 13000,
    attractions: ['Christ the Redeemer', 'Sugarloaf Mountain', 'Copacabana Beach', 'Selarón Steps'],
    coordinates: { latitude: -22.9068, longitude: -43.1729 },
    nearestAirport: 'Rio de Janeiro/Galeão International Airport (GIG)',
    nearestRailwayStation: 'Central do Brasil',
    mainWiki: 'Rio_de_Janeiro',
    spots: [
      { name: 'Christ the Redeemer', wiki: 'Christ_the_Redeemer_(statue)' },
      { name: 'Sugarloaf Mountain', wiki: 'Sugarloaf_Mountain' },
      { name: 'Copacabana Beach', wiki: 'Copacabana,_Rio_de_Janeiro' },
      { name: 'Selarón Steps', wiki: 'Escadaria_Selar%C3%B3n' }
    ]
  },
  {
    name: 'Seoul',
    country: 'South Korea',
    state: 'Seoul Capital Area',
    description: 'A hyper-modern Asian powerhouse where futuristic K-pop culture and skyscrapers coexist with tranquil Joseon dynasty royal palaces and hanok villages.',
    bestTimeToVisit: 'March to May and September to November',
    averageDailyBudgetINR: 16000,
    attractions: ['Gyeongbokgung Palace', 'N Seoul Tower', 'Bukchon Hanok Village', 'Myeongdong'],
    coordinates: { latitude: 37.5665, longitude: 126.9780 },
    nearestAirport: 'Incheon International Airport (ICN) / Gimpo (GMP)',
    nearestRailwayStation: 'Seoul Station',
    mainWiki: 'Seoul',
    spots: [
      { name: 'Gyeongbokgung Palace', wiki: 'Gyeongbokgung' },
      { name: 'N Seoul Tower', wiki: 'N_Seoul_Tower' },
      { name: 'Bukchon Hanok Village', wiki: 'Bukchon_Hanok_Village' },
      { name: 'Myeongdong', wiki: 'Myeong-dong' }
    ]
  },
  {
    name: 'Vienna',
    country: 'Austria',
    state: 'Vienna',
    description: 'The imperial capital of classical music, grand Habsburg palaces, ornate Baroque concert halls, and historic coffeehouse traditions.',
    bestTimeToVisit: 'April to May and September to October',
    averageDailyBudgetINR: 17000,
    attractions: ['Schönbrunn Palace', 'St. Stephen\'s Cathedral', 'Hofburg Palace', 'Belvedere Palace'],
    coordinates: { latitude: 48.2082, longitude: 16.3738 },
    nearestAirport: 'Vienna International Airport (VIE)',
    nearestRailwayStation: 'Wien Hauptbahnhof',
    mainWiki: 'Vienna',
    spots: [
      { name: 'Schönbrunn Palace', wiki: 'Sch%C3%B6nbrunn_Palace' },
      { name: 'St. Stephen\'s Cathedral', wiki: 'St._Stephen%27s_Cathedral,_Vienna' },
      { name: 'Hofburg Palace', wiki: 'Hofburg' },
      { name: 'Belvedere Palace', wiki: 'Belvedere,_Vienna' }
    ]
  },
  {
    name: 'Lucerne',
    country: 'Switzerland',
    state: 'Lucerne',
    description: 'A postcard Swiss alpine town nestled beside Lake Lucerne against Mount Pilatus, famous for medieval wooden bridges and snow-peaked vistas.',
    bestTimeToVisit: 'June to September and December to March',
    averageDailyBudgetINR: 24000,
    attractions: ['Chapel Bridge', 'Mount Pilatus', 'Lake Lucerne', 'Lion Monument'],
    coordinates: { latitude: 47.0502, longitude: 8.3093 },
    nearestAirport: 'Zurich Airport (ZRH)',
    nearestRailwayStation: 'Lucerne Railway Station',
    mainWiki: 'Lucerne',
    spots: [
      { name: 'Chapel Bridge', wiki: 'Chapel_Bridge' },
      { name: 'Mount Pilatus', wiki: 'Mount_Pilatus' },
      { name: 'Lake Lucerne', wiki: 'Lake_Lucerne' },
      { name: 'Lion Monument', wiki: 'Lion_Monument' }
    ]
  },
  {
    name: 'Machu Picchu',
    country: 'Peru',
    state: 'Cusco',
    description: 'The ancient Incan capital tucked high in the Andes, leading to the breathtaking 15th-century mountain citadel of Machu Picchu above the clouds.',
    bestTimeToVisit: 'May to September',
    averageDailyBudgetINR: 11000,
    attractions: ['Machu Picchu Citadel', 'Sacred Valley', 'Plaza de Armas Cusco', 'Sacsayhuamán'],
    coordinates: { latitude: -13.1631, longitude: -72.5450 },
    nearestAirport: 'Alejandro Velasco Astete Airport (CUZ)',
    nearestRailwayStation: 'Estación San Pedro Cusco',
    mainWiki: 'Machu_Picchu',
    spots: [
      { name: 'Machu Picchu Citadel', wiki: 'Machu_Picchu' },
      { name: 'Sacred Valley', wiki: 'Sacred_Valley' },
      { name: 'Plaza de Armas Cusco', wiki: 'Plaza_de_Armas,_Cusco' },
      { name: 'Sacsayhuamán Fortress', wiki: 'Sacsayhuam%C3%A1n' }
    ]
  },
  {
    name: 'Kuala Lumpur',
    country: 'Malaysia',
    state: 'Federal Territory',
    description: 'Malaysia’s gleaming capital crowned by the 88-story Petronas Twin Towers, colorful Hindu cave temples at Batu Caves, and hawker street food.',
    bestTimeToVisit: 'May to July and December to February',
    averageDailyBudgetINR: 8000,
    attractions: ['Petronas Twin Towers', 'Batu Caves', 'Merdeka Square', 'Thean Hou Temple'],
    coordinates: { latitude: 3.1390, longitude: 101.6869 },
    nearestAirport: 'Kuala Lumpur International Airport (KUL)',
    nearestRailwayStation: 'KL Sentral',
    mainWiki: 'Kuala_Lumpur',
    spots: [
      { name: 'Petronas Twin Towers', wiki: 'Petronas_Towers' },
      { name: 'Batu Caves', wiki: 'Batu_Caves' },
      { name: 'Merdeka Square', wiki: 'Merdeka_Square,_Kuala_Lumpur' },
      { name: 'Thean Hou Temple', wiki: 'Thean_Hou_Temple' }
    ]
  },
  {
    name: 'Hanoi & Ha Long Bay',
    country: 'Vietnam',
    state: 'Red River Delta',
    description: 'Vietnam’s thousand-year-old capital of lakes and French colonial quarters, paired with thousands of emerald limestone karst islands rising from Ha Long Bay.',
    bestTimeToVisit: 'October to April',
    averageDailyBudgetINR: 7000,
    attractions: ['Ha Long Bay', 'Hoan Kiem Lake', 'Temple of Literature', 'Old Quarter Hanoi'],
    coordinates: { latitude: 21.0285, longitude: 105.8542 },
    nearestAirport: 'Noi Bai International Airport (HAN)',
    nearestRailwayStation: 'Hanoi Railway Station',
    mainWiki: 'Hanoi',
    spots: [
      { name: 'Ha Long Bay', wiki: 'H%E1%BA%A1_Long_Bay' },
      { name: 'Hoan Kiem Lake', wiki: 'Ho%C3%A0n_Ki%E1%BA%BFm_Lake' },
      { name: 'Temple of Literature', wiki: 'Temple_of_Literature,_Hanoi' },
      { name: 'Old Quarter Hanoi', wiki: 'Old_Quarter,_Hanoi' }
    ]
  },
  {
    name: 'Doha',
    country: 'Qatar',
    state: 'Doha',
    description: 'A futuristic Arabian Gulf jewel where visionary museums designed by I.M. Pei meet traditional falcon souqs and luxurious artificial island rivieras.',
    bestTimeToVisit: 'November to March',
    averageDailyBudgetINR: 18000,
    attractions: ['Museum of Islamic Art', 'Souq Waqif', 'The Pearl-Qatar', 'Katara Cultural Village'],
    coordinates: { latitude: 25.2854, longitude: 51.5310 },
    nearestAirport: 'Hamad International Airport (DOH)',
    nearestRailwayStation: 'Doha Metro Central',
    mainWiki: 'Doha',
    spots: [
      { name: 'Museum of Islamic Art', wiki: 'Museum_of_Islamic_Art,_Doha' },
      { name: 'Souq Waqif', wiki: 'Souq_Waqif' },
      { name: 'The Pearl-Qatar', wiki: 'The_Pearl-Qatar' },
      { name: 'Katara Cultural Village', wiki: 'Katara_(cultural_village)' }
    ]
  },
  {
    name: 'Auckland',
    country: 'New Zealand',
    state: 'North Island',
    description: 'The City of Sails flanked by two natural harbors, dormant volcanic cones, lush vineyard islands, and rugged black sand surf beaches.',
    bestTimeToVisit: 'November to April',
    averageDailyBudgetINR: 21000,
    attractions: ['Sky Tower', 'Waiheke Island', 'Mount Eden', 'Piha Beach'],
    coordinates: { latitude: -36.8485, longitude: 174.7633 },
    nearestAirport: 'Auckland Airport (AKL)',
    nearestRailwayStation: 'Waitematā Railway Station',
    mainWiki: 'Auckland',
    spots: [
      { name: 'Sky Tower', wiki: 'Sky_Tower_(Auckland)' },
      { name: 'Waiheke Island', wiki: 'Waiheke_Island' },
      { name: 'Mount Eden', wiki: 'Mount_Eden' },
      { name: 'Piha Beach', wiki: 'Piha' }
    ]
  },
  {
    name: 'Reykjavik',
    country: 'Iceland',
    state: 'Capital Region',
    description: 'The world’s northernmost capital, gateway to milky-blue geothermal lagoons, roaring Golden Circle waterfalls, volcanic glaciers, and dancing Aurora Borealis.',
    bestTimeToVisit: 'June to August and September to March',
    averageDailyBudgetINR: 26000,
    attractions: ['Blue Lagoon', 'Hallgrímskirkja', 'Gullfoss Waterfall', 'Thingvellir National Park'],
    coordinates: { latitude: 64.1466, longitude: -21.9426 },
    nearestAirport: 'Keflavík International Airport (KEF)',
    nearestRailwayStation: 'Reykjavik BSI Terminal',
    mainWiki: 'Reykjavik',
    spots: [
      { name: 'Blue Lagoon', wiki: 'Blue_Lagoon_(geothermal_spa)' },
      { name: 'Hallgrímskirkja', wiki: 'Hallgr%C3%ADmskirkja' },
      { name: 'Gullfoss Waterfall', wiki: 'Gullfoss' },
      { name: 'Thingvellir National Park', wiki: '%C3%9Eingvellir' }
    ]
  },
  {
    name: 'San Francisco',
    country: 'United States',
    state: 'California',
    description: 'The cultural heart of Northern California with the rust-red Golden Gate Bridge, historic cable cars ascending steep hills, and sea lions at Fisherman’s Wharf.',
    bestTimeToVisit: 'September to November',
    averageDailyBudgetINR: 28000,
    attractions: ['Golden Gate Bridge', 'Alcatraz Island', 'Fisherman\'s Wharf', 'Chinatown'],
    coordinates: { latitude: 37.7749, longitude: -122.4194 },
    nearestAirport: 'San Francisco International Airport (SFO)',
    nearestRailwayStation: 'Salesforce Transit Center',
    mainWiki: 'San_Francisco',
    spots: [
      { name: 'Golden Gate Bridge', wiki: 'Golden_Gate_Bridge' },
      { name: 'Alcatraz Island', wiki: 'Alcatraz_Island' },
      { name: 'Fisherman\'s Wharf', wiki: 'Fisherman%27s_Wharf,_San_Francisco' },
      { name: 'Chinatown', wiki: 'Chinatown,_San_Francisco' }
    ]
  },
  {
    name: 'Edinburgh',
    country: 'United Kingdom',
    state: 'Scotland',
    description: 'Scotland’s romantic capital dominated by Edinburgh Castle atop a volcanic crag, the medieval Royal Mile, and literary pubs in the shadow of Arthur\'s Seat.',
    bestTimeToVisit: 'May to September',
    averageDailyBudgetINR: 20000,
    attractions: ['Edinburgh Castle', 'Royal Mile', 'Arthur\'s Seat', 'Palace of Holyroodhouse'],
    coordinates: { latitude: 55.9533, longitude: -3.1883 },
    nearestAirport: 'Edinburgh Airport (EDI)',
    nearestRailwayStation: 'Edinburgh Waverley',
    mainWiki: 'Edinburgh',
    spots: [
      { name: 'Edinburgh Castle', wiki: 'Edinburgh_Castle' },
      { name: 'Royal Mile', wiki: 'Royal_Mile' },
      { name: 'Arthur\'s Seat', wiki: 'Arthur%27s_Seat' },
      { name: 'Palace of Holyroodhouse', wiki: 'Holyrood_Palace' }
    ]
  }
]

async function fetchWikiImageAndExtract(wikiSlug) {
  try {
    await sleep(250) // Rate limit safety
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiSlug}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'OdysseyTravelPlanner/1.0 (verified international catalogue; contact@odyssey.com)' }
    })
    if (!res.ok) return null
    const data = await res.json()
    const imageUrl = data.originalimage?.source || data.thumbnail?.source || null
    const extract = data.extract ? data.extract.trim().slice(0, 160) : ''
    return { imageUrl, description: extract }
  } catch (err) {
    return null
  }
}

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/odyssey'
  await mongoose.connect(uri)
  console.log('Connected to MongoDB. Inserting 20 verified out-of-India destinations...')

  let count = 0

  for (const item of NEW_20_DESTINATIONS) {
    console.log(`Processing ${item.name} (${item.country})...`)

    // 1. Fetch main verified image
    const mainData = await fetchWikiImageAndExtract(item.mainWiki)
    const mainImageUrl = mainData?.imageUrl || `https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80`

    // 2. Fetch spots
    const spotResults = []
    for (const spotInfo of item.spots) {
      const spotData = await fetchWikiImageAndExtract(spotInfo.wiki)
      spotResults.push({
        name: spotInfo.name,
        imageUrl: spotData?.imageUrl || mainImageUrl,
        description: spotData?.description || `Famous historic landmark in ${item.name}.`
      })
    }

    // 3. Upsert into MongoDB
    await Destination.findOneAndUpdate(
      { name: item.name, country: item.country },
      {
        name: item.name,
        country: item.country,
        state: item.state,
        description: item.description,
        bestTimeToVisit: item.bestTimeToVisit,
        averageDailyBudgetINR: item.averageDailyBudgetINR,
        attractions: item.attractions,
        coordinates: item.coordinates,
        nearestAirport: item.nearestAirport,
        nearestRailwayStation: item.nearestRailwayStation,
        imageUrl: mainImageUrl,
        famousSpots: spotResults,
        wikipediaUrl: `https://en.wikipedia.org/wiki/${item.mainWiki}`
      },
      { upsert: true, new: true }
    )

    count++
    console.log(`✓ ${count}/20: Saved ${item.name} with ${spotResults.length} famous spots!`)
  }

  const total = await Destination.countDocuments()
  console.log(`\nSUCCESS! Database now contains ${total} destinations (including ${count} new out-of-India spots)!`)
  await mongoose.disconnect()
}

run().catch(err => {
  console.error('Error adding 20 international destinations:', err)
  process.exit(1)
})
