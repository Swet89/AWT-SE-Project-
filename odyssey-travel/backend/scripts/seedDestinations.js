require('dotenv').config()

const mongoose = require('mongoose')
const Destination = require('../models/Destination')

// Coordinates below are fallback city/region centers. Wikipedia coordinates replace them when available.
const destinations = [
  ['Goa','India','Goa','A tropical coastal state known for beaches, Portuguese heritage, and seafood.','November to February',4500,['Baga Beach','Old Goa','Dudhsagar Falls'],15.2993,74.124,'Goa International Airport (GOI)','Madgaon Junction'],
  ['Jaipur','India','Rajasthan','The Pink City is celebrated for its forts, palaces, and lively bazaars.','October to March',3500,['Amber Fort','Hawa Mahal','City Palace'],26.9124,75.7873,'Jaipur International Airport (JAI)','Jaipur Junction'],
  ['Udaipur','India','Rajasthan','A lakeside city of historic palaces, courtyards, and Aravalli views.','September to March',4000,['City Palace','Lake Pichola','Saheliyon-ki-Bari'],24.5854,73.7125,'Maharana Pratap Airport (UDR)','Udaipur City railway station'],
  ['Varanasi','India','Uttar Pradesh','An ancient city on the Ganges, known for riverfront ghats and temples.','November to February',2500,['Dashashwamedh Ghat','Kashi Vishwanath Temple','Sarnath'],25.3176,82.9739,'Lal Bahadur Shastri Airport (VNS)','Varanasi Junction'],
  ['Kerala Backwaters','India','Kerala','A network of lagoons and canals lined with villages, palms, and paddy fields.','October to March',5000,['Alappuzha canals','Kumarakom Bird Sanctuary','Vembanad Lake'],9.4981,76.3388,'Cochin International Airport (COK)','Alappuzha railway station'],
  ['Munnar','India','Kerala','A hill station surrounded by tea gardens, mountain trails, and misty valleys.','September to March',3000,['Tea Museum','Eravikulam National Park','Mattupetty Dam'],10.0889,77.0595,'Cochin International Airport (COK)','Aluva railway station'],
  ['Leh-Ladakh','India','Ladakh','A high-altitude Himalayan region of monasteries, stark mountains, and clear lakes.','June to September',6000,['Pangong Lake','Thiksey Monastery','Khardung La'],34.1526,77.5771,'Kushok Bakula Rimpochee Airport (IXL)','No direct rail service; Jammu Tawi is the nearest major railhead'],
  ['Andaman Islands','India','Andaman and Nicobar Islands','An island archipelago with coral reefs, rainforest, and clear-water beaches.','October to May',5500,['Radhanagar Beach','Cellular Jail','Baratang Island'],11.7401,92.6586,'Veer Savarkar International Airport (IXZ)','No railway service on the islands'],
  ['Rishikesh','India','Uttarakhand','A Himalayan foothill town known for yoga, river rafting, and Ganges views.','September to November and March to May',3000,['Laxman Jhula area','Triveni Ghat','Neer Garh Waterfall'],30.0869,78.2676,'Jolly Grant Airport (DED)','Yog Nagari Rishikesh station'],
  ['Darjeeling','India','West Bengal','A mountain town famed for tea gardens, Himalayan views, and heritage rail.','March to May and October to December',3500,['Tiger Hill','Batasia Loop','Darjeeling Himalayan Railway'],27.041,88.2663,'Bagdogra Airport (IXB)','New Jalpaiguri Junction'],
  ['Hampi','India','Karnataka','A UNESCO-listed landscape of Vijayanagara-era ruins among dramatic boulder hills.','October to February',2500,['Virupaksha Temple','Vittala Temple','Hemakuta Hill'],15.335,76.46,'Jindal Vijaynagar Airport (VDY)','Hosapete Junction'],
  ['Agra','India','Uttar Pradesh','A historic city on the Yamuna, home to Mughal monuments and gardens.','October to March',3000,['Taj Mahal','Agra Fort','Itimad-ud-Daulah'],27.1767,78.0081,'Agra Airport (AGR)','Agra Cantt'],
  ['Mumbai','India','Maharashtra','India’s energetic coastal metropolis blends colonial landmarks, arts, and street food.','November to February',6000,['Gateway of India','Chhatrapati Shivaji Maharaj Terminus','Marine Drive'],19.076,72.8777,'Chhatrapati Shivaji Maharaj International Airport (BOM)','Mumbai Central'],
  ['Delhi','India','Delhi','India’s capital pairs monumental history with markets, museums, and modern neighborhoods.','October to March',4500,['Red Fort','Humayun’s Tomb','Qutub Minar'],28.6139,77.209,'Indira Gandhi International Airport (DEL)','New Delhi railway station'],
  ['Amritsar','India','Punjab','A Punjabi city known for Sikh heritage, spiritual landmarks, and celebrated cuisine.','October to March',3000,['Golden Temple','Jallianwala Bagh','Wagah Border'],31.634,74.8723,'Sri Guru Ram Dass Jee International Airport (ATQ)','Amritsar Junction'],
  ['Manali','India','Himachal Pradesh','A mountain resort town with cedar forests, river valleys, and Himalayan adventure.','March to June and October to February',4500,['Solang Valley','Hadimba Temple','Old Manali'],32.2396,77.1887,'Bhuntar Airport (KUU)','No direct rail service; Joginder Nagar is the nearest narrow-gauge station'],
  ['Puducherry','India','Puducherry','A seaside town with French-era streets, Tamil culture, and a relaxed promenade.','October to March',3500,['Promenade Beach','White Town','Auroville'],11.9416,79.8083,'Puducherry Airport (PNY)','Puducherry railway station'],
  ['Ooty','India','Tamil Nadu','A Nilgiri hill station surrounded by tea estates, gardens, and mountain rail.','October to June',3500,['Ooty Lake','Government Botanical Garden','Nilgiri Mountain Railway'],11.4064,76.6932,'Coimbatore International Airport (CJB)','Udhagamandalam station'],
  ['Jaisalmer','India','Rajasthan','A golden desert city of sandstone havelis, a living fort, and Thar dunes.','November to February',3500,['Jaisalmer Fort','Sam Sand Dunes','Patwon Ki Haveli'],26.9157,70.9083,'Jaisalmer Airport (JSA)','Jaisalmer railway station'],
  ['Shimla','India','Himachal Pradesh','A former summer capital set along forested ridges in the western Himalayas.','March to June and December to February',4000,['The Ridge','Jakhoo Temple','Kalka–Shimla Railway'],31.1048,77.1734,'Shimla Airport (SLV)','Kalka railway station'],
  ['Srinagar','India','Jammu and Kashmir','A Himalayan city of houseboats, gardens, lakes, and traditional craft markets.','April to October',5000,['Dal Lake','Shalimar Bagh','Nishat Bagh'],34.0837,74.7973,'Sheikh ul-Alam International Airport (SXR)','Srinagar railway station'],
  ['Jodhpur','India','Rajasthan','The Blue City is watched over by a hilltop fort and surrounded by desert country.','October to March',3500,['Mehrangarh Fort','Jaswant Thada','Clock Tower Market'],26.2389,73.0243,'Jodhpur Airport (JDH)','Bhagat Ki Kothi railway station'],
  ['Mysuru','India','Karnataka','A cultural city known for its palace, markets, and celebrated Dasara festival.','October to February',3000,['Mysore Palace','Chamundi Hills','Devaraja Market'],12.2958,76.6394,'Mysore Airport (MYQ)','Mysuru Junction'],
  ['Kochi','India','Kerala','A historic port city shaped by maritime trade, art, and layered coastal cultures.','October to March',4000,['Fort Kochi','Mattancherry Palace','Chinese fishing nets'],9.9312,76.2673,'Cochin International Airport (COK)','Ernakulam Junction'],
  ['Bengaluru','India','Karnataka','A modern garden city with lively food, culture, technology, and green spaces.','October to February',5000,['Lalbagh Botanical Garden','Bengaluru Palace','Cubbon Park'],12.9716,77.5946,'Kempegowda International Airport (BLR)','KSR Bengaluru City Junction'],
  ['Hyderabad','India','Telangana','A Deccan capital known for its historic monuments, markets, and biryani.','October to February',4000,['Charminar','Golconda Fort','Salar Jung Museum'],17.385,78.4867,'Rajiv Gandhi International Airport (HYD)','Secunderabad Junction'],
  ['Kolkata','India','West Bengal','A river city renowned for literature, colonial architecture, arts, and cuisine.','October to February',3500,['Victoria Memorial','Howrah Bridge','Indian Museum'],22.5726,88.3639,'Netaji Subhas Chandra Bose International Airport (CCU)','Howrah Junction'],
  ['Chennai','India','Tamil Nadu','A coastal cultural capital with classical arts, temples, and a long city beach.','November to February',4000,['Marina Beach','Kapaleeshwarar Temple','Fort St. George'],13.0827,80.2707,'Chennai International Airport (MAA)','Chennai Central'],
  ['Coorg','India','Karnataka','A Western Ghats region of coffee estates, forested hills, and Kodava culture.','October to March',4000,['Abbey Falls','Raja’s Seat','Dubare Elephant Camp'],12.3375,75.8069,'Mangalore International Airport (IXE)','Mysuru Junction'],
  ['Kaziranga','India','Assam','A floodplain reserve famed for grassland wildlife and the greater one-horned rhinoceros.','November to April',4500,['Kaziranga National Park','Kohora range','Kaziranga Orchid Park'],26.5775,93.1711,'Jorhat Airport (JRH)','Furkating Junction'],
  ['Khajuraho','India','Madhya Pradesh','A temple town with intricately carved medieval monuments and quiet countryside.','October to March',3000,['Western Group of Temples','Eastern Group of Temples','Raneh Falls'],24.8318,79.9199,'Khajuraho Airport (HJR)','Khajuraho railway station'],
  ['Mahabalipuram','India','Tamil Nadu','A coastal heritage town known for Pallava rock-cut temples and stone sculpture.','November to February',3000,['Shore Temple','Pancha Rathas','Arjuna’s Penance'],12.6269,80.1927,'Chennai International Airport (MAA)','Chengalpattu Junction'],
  ['Lakshadweep','India','Lakshadweep','A remote Arabian Sea archipelago with lagoons, reefs, and small island communities.','October to May',7000,['Agatti Island','Bangaram Island','Kavaratti Lagoon'],10.5667,72.6417,'Agatti Airport (AGX)','No railway service on the islands'],
  ['Spiti Valley','India','Himachal Pradesh','A high-altitude cold desert of monasteries, villages, and stark Himalayan scenery.','June to September',4500,['Key Monastery','Dhankar Monastery','Chandratal Lake'],32.246,78.0349,'Bhuntar Airport (KUU)','No direct rail service; Shimla is a regional rail gateway'],
  ['Rann of Kutch','India','Gujarat','A vast seasonal salt marsh celebrated for desert landscapes and regional crafts.','November to February',4000,['White Rann','Kalo Dungar','Bhuj old town'],23.7337,69.8597,'Bhuj Airport (BHJ)','Bhuj railway station'],
  ['Athens','Greece','Attica','A Mediterranean capital shaped by ancient landmarks, museums, and lively neighborhoods.','April to June and September to October',11000,['Acropolis','Plaka','National Garden'],37.9838,23.7275,'Athens International Airport (ATH)','Athens railway station'],
  ['Ithaca','Greece','Ionian Islands','A green Ionian island associated with seafaring legends, quiet coves, and villages.','May to September',10000,['Vathy','Kioni','Archaeological Museum of Vathy'],38.3656,20.7206,'Kefalonia Airport (EFL) plus ferry','No railway service on the island'],
  ['Santorini','Greece','South Aegean','A volcanic island of caldera villages, archaeological sites, and Aegean sunsets.','April to October',16000,['Oia','Akrotiri','Fira'],36.3932,25.4615,'Santorini Airport (JTR)','No railway service on the island'],
  ['Crete','Greece','Crete','Greece’s largest island combines Minoan heritage, mountain landscapes, and beaches.','April to October',12000,['Knossos','Chania Old Town','Samaria Gorge'],35.2401,24.8093,'Heraklion International Airport (HER)','No intercity railway service'],
  ['Dubai','United Arab Emirates','Dubai','A Gulf city of historic creek districts, contemporary architecture, and desert landscapes.','November to March',18000,['Al Fahidi Historical Neighbourhood','Dubai Creek','Burj Khalifa'],25.2048,55.2708,'Dubai International Airport (DXB)','Union Metro station'],
  ['Bali','Indonesia','Bali','An Indonesian island known for Hindu temples, rice terraces, volcanic scenery, and beaches.','April to October',9000,['Ubud','Tanah Lot','Tegallalang Rice Terraces'],-8.4095,115.1889,'Ngurah Rai International Airport (DPS)','No railway service on the island'],
  ['Singapore','Singapore','Singapore','A compact island city with diverse neighborhoods, gardens, and a celebrated food scene.','February to April',17000,['Gardens by the Bay','Chinatown','Singapore Botanic Gardens'],1.3521,103.8198,'Singapore Changi Airport (SIN)','Woodlands Train Checkpoint'],
  ['Bangkok','Thailand','Bangkok','Thailand’s capital pairs ornate temples with river life, markets, and street food.','November to February',8000,['Wat Arun','Grand Palace','Chatuchak Market'],13.7563,100.5018,'Suvarnabhumi Airport (BKK)','Krung Thep Aphiwat Central Terminal'],
  ['Paris','France','Île-de-France','A world city of museums, boulevards, architecture, and neighborhood cafés.','April to June and September to October',22000,['Eiffel Tower','Louvre Museum','Notre-Dame Cathedral'],48.8566,2.3522,'Charles de Gaulle Airport (CDG)','Gare du Nord'],
  ['Rome','Italy','Lazio','Italy’s capital layers ancient monuments, Renaissance art, and everyday piazza life.','April to June and September to October',20000,['Colosseum','Pantheon','Trevi Fountain'],41.9028,12.4964,'Leonardo da Vinci–Fiumicino Airport (FCO)','Roma Termini'],
  ['Kyoto','Japan','Kyoto Prefecture','A former imperial capital known for temples, gardens, and traditional streets.','March to May and October to November',18000,['Fushimi Inari Taisha','Kinkaku-ji','Arashiyama Bamboo Grove'],35.0116,135.7681,'Kansai International Airport (KIX)','Kyoto Station'],
  ['London','United Kingdom','England','A global capital with royal landmarks, major museums, theaters, and diverse districts.','May to September',25000,['British Museum','Tower of London','Westminster'],51.5072,-0.1276,'Heathrow Airport (LHR)','London St Pancras International'],
  ['Istanbul','Türkiye','Istanbul','A transcontinental city where Byzantine and Ottoman landmarks meet the Bosphorus.','April to May and September to November',14000,['Hagia Sophia','Topkapı Palace','Grand Bazaar'],41.0082,28.9784,'Istanbul Airport (IST)','Halkalı railway station'],
  ['New York City','United States','New York','A global metropolis of distinct neighborhoods, celebrated museums, and landmark skylines.','April to June and September to November',30000,['Central Park','Metropolitan Museum of Art','Statue of Liberty'],40.7128,-74.006,'John F. Kennedy International Airport (JFK)','Penn Station'],
  ['Maldives','Maldives','Kaafu Atoll','An Indian Ocean island nation of coral atolls, lagoons, and marine life.','November to April',28000,['Malé','North Malé Atoll','Hulhumalé'],4.1755,73.5093,'Velana International Airport (MLE)','No railway service'],
]

const fallbackImages = {
  Goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
  Jaipur: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1200&q=80',
  Udaipur: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1200&q=80',
  Munnar: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  Varanasi: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
  Athens: 'https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?auto=format&fit=crop&w=1200&q=80',
}

function stripHtml(value = '') {
  return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
}

async function fetchWikipediaMetadata(name) {
  const metadata = {}
  try {
    const summaryResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replaceAll(' ', '_'))}`,
      { headers: { 'User-Agent': 'OdysseyTravel/1.0 (destination catalog)' }, signal: AbortSignal.timeout(8000) },
    )
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json()
      const summary = String(summaryData.extract || '').trim().slice(0, 900)
      if (summary) metadata.description = summary
      const image = summaryData.originalimage?.source || summaryData.thumbnail?.source
      if (image) {
        metadata.imageUrl = image
        metadata.photoCredit = 'Wikimedia image; see source page for author and license'
        metadata.photoSourceUrl = summaryData.content_urls?.desktop?.page || summaryData.desktop?.page || ''
      }
      if (summaryData.content_urls?.desktop?.page) {
        metadata.wikipediaUrl = summaryData.content_urls.desktop.page
      }
    }
  } catch (error) {
    console.warn(`Wikipedia summary unavailable for ${name}:`, error.message)
  }

  try {
    const params = new URLSearchParams({
      action: 'query', titles: name, prop: 'coordinates|pageimages|info',
      inprop: 'url', piprop: 'name', colimit: '1', format: 'json',
    })
    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
      headers: { 'User-Agent': 'OdysseyTravel/1.0 (destination catalog)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return metadata
    const data = await response.json()
    const page = Object.values(data.query?.pages || {})[0]
    if (!page || page.missing !== undefined) return metadata

    if (page.coordinates?.[0]) {
      metadata.coordinates = { latitude: page.coordinates[0].lat, longitude: page.coordinates[0].lon }
    }
    if (page.fullurl) metadata.wikipediaUrl = page.fullurl
    if (page.pageimage) {
      metadata.photoSourceUrl = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(page.pageimage.replaceAll(' ', '_'))}`
      if (!metadata.photoCredit) metadata.photoCredit = 'Wikimedia Commons; see image page for author and license'
      const commonsParams = new URLSearchParams({
        action: 'query', titles: `File:${page.pageimage}`, prop: 'imageinfo',
        iiprop: 'url|extmetadata', iiurlwidth: '1400', format: 'json',
      })
      try {
        const commonsResponse = await fetch(`https://commons.wikimedia.org/w/api.php?${commonsParams}`, {
          headers: { 'User-Agent': 'OdysseyTravel/1.0 (destination catalog)' },
          signal: AbortSignal.timeout(8000),
        })
        if (commonsResponse.ok) {
          const commons = await commonsResponse.json()
          const file = Object.values(commons.query?.pages || {})[0]
          const image = file?.imageinfo?.[0]
          if (image) {
            metadata.imageUrl = image.thumburl || image.url || metadata.imageUrl
            metadata.photoSourceUrl = image.descriptionurl || metadata.photoSourceUrl
            const artist = stripHtml(image.extmetadata?.Artist?.value || '')
            const license = stripHtml(image.extmetadata?.LicenseShortName?.value || '')
            metadata.photoCredit = [artist, license].filter(Boolean).join(' · ') || metadata.photoCredit
          }
        }
      } catch (error) {
        console.warn(`Wikimedia Commons attribution unavailable for ${name}:`, error.message)
      }
    }
  } catch (error) {
    console.warn(`Wikipedia metadata unavailable for ${name}:`, error.message)
  }
  return metadata
}

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing from backend/.env')
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    let descriptionCount = 0
    let imageCount = 0
    let coordinateCount = 0
    const operations = []

    for (let start = 0; start < destinations.length; start += 5) {
      const batch = await Promise.all(destinations.slice(start, start + 5).map(async (row) => {
        const [name, country, state, description, bestTimeToVisit, budget, attractions,
          latitude, longitude, nearestAirport, nearestRailwayStation] = row
        const wiki = await fetchWikipediaMetadata(name)
        if (wiki.description) descriptionCount += 1
        if (wiki.imageUrl) imageCount += 1
        if (wiki.coordinates) coordinateCount += 1
        const data = {
          name, country, state, description: wiki.description || description, bestTimeToVisit,
          averageDailyBudgetINR: budget,
          attractions,
          coordinates: wiki.coordinates || { latitude, longitude },
          nearestAirport,
          nearestRailwayStation,
          imageUrl: wiki.imageUrl || fallbackImages[name] || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85',
          photoCredit: wiki.photoCredit || (fallbackImages[name] ? 'Image source: Unsplash' : 'Unsplash fallback image'),
          photoSourceUrl: wiki.photoSourceUrl || (fallbackImages[name] ? 'https://unsplash.com/' : 'https://unsplash.com/'),
          wikipediaUrl: wiki.wikipediaUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replaceAll(' ', '_'))}`,
        }
        return { updateOne: { filter: { name, country }, update: { $set: data }, upsert: true } }
      }))
      operations.push(...batch)
      console.log(`Prepared ${operations.length}/${destinations.length} destinations with public catalog metadata.`)
    }

    const result = await Destination.bulkWrite(operations, { ordered: false })
    console.log(`Destination catalog ready: ${destinations.length} records (${result.upsertedCount} added, ${result.modifiedCount} updated).`)
    console.log(`Wikipedia descriptions: ${descriptionCount}/${destinations.length}; images: ${imageCount}/${destinations.length}; coordinates: ${coordinateCount}/${destinations.length}.`)
  } catch (error) {
    console.error('Destination seed failed:', error.message)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

seed()
