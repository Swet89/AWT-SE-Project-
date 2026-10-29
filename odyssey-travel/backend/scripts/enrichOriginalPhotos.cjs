require('dotenv').config()
const mongoose = require('mongoose')
const Destination = require('../models/Destination')

// Comprehensive map of verified Wikipedia article slugs for all 50 destinations & famous spots
const WIKI_SPOT_MAP = {
  Goa: {
    mainWiki: 'Goa',
    spots: [
      { name: 'Calangute & Baga Beach', wiki: 'Calangute' },
      { name: 'Dudhsagar Falls', wiki: 'Dudhsagar_Falls' },
      { name: 'Fort Aguada', wiki: 'Fort_Aguada' },
      { name: 'Basilica of Bom Jesus', wiki: 'Basilica_of_Bom_Jesus' }
    ]
  },
  Jaipur: {
    mainWiki: 'Hawa_Mahal',
    spots: [
      { name: 'Hawa Mahal', wiki: 'Hawa_Mahal' },
      { name: 'Amber Fort', wiki: 'Amber_Fort' },
      { name: 'Jal Mahal', wiki: 'Jal_Mahal' },
      { name: 'City Palace, Jaipur', wiki: 'City_Palace,_Jaipur' }
    ]
  },
  Udaipur: {
    mainWiki: 'City_Palace,_Udaipur',
    spots: [
      { name: 'City Palace, Udaipur', wiki: 'City_Palace,_Udaipur' },
      { name: 'Lake Pichola', wiki: 'Lake_Pichola' },
      { name: 'Jag Mandir', wiki: 'Jag_Mandir' },
      { name: 'Saheliyon-ki-Bari', wiki: 'Saheliyon-ki-Bari' }
    ]
  },
  Varanasi: {
    mainWiki: 'Dashashwamedh_Ghat',
    spots: [
      { name: 'Dashashwamedh Ghat', wiki: 'Dashashwamedh_Ghat' },
      { name: 'Kashi Vishwanath Temple', wiki: 'Kashi_Vishwanath_Temple' },
      { name: 'Assi Ghat', wiki: 'Assi_Ghat' },
      { name: 'Sarnath', wiki: 'Sarnath' }
    ]
  },
  'Kerala Backwaters': {
    mainWiki: 'Alappuzha',
    spots: [
      { name: 'Alappuzha Backwaters', wiki: 'Alappuzha' },
      { name: 'Vembanad Lake', wiki: 'Vembanad' },
      { name: 'Kumarakom', wiki: 'Kumarakom' },
      { name: 'Marari Beach', wiki: 'Marari_Beach' }
    ]
  },
  Munnar: {
    mainWiki: 'Munnar',
    spots: [
      { name: 'Munnar Tea Plantations', wiki: 'Munnar' },
      { name: 'Eravikulam National Park', wiki: 'Eravikulam_National_Park' },
      { name: 'Mattupetty Dam', wiki: 'Mattupetty_Dam' },
      { name: 'Anamudi Peak', wiki: 'Anamudi' }
    ]
  },
  'Leh-Ladakh': {
    mainWiki: 'Pangong_Tso',
    spots: [
      { name: 'Pangong Tso Lake', wiki: 'Pangong_Tso' },
      { name: 'Thikse Monastery', wiki: 'Thikse_Monastery' },
      { name: 'Nubra Valley', wiki: 'Nubra_Valley' },
      { name: 'Khardung La Pass', wiki: 'Khardung_La' }
    ]
  },
  'Andaman Islands': {
    mainWiki: 'Radhanagar_Beach',
    spots: [
      { name: 'Radhanagar Beach (Havelock)', wiki: 'Radhanagar_Beach' },
      { name: 'Cellular Jail (Port Blair)', wiki: 'Cellular_Jail' },
      { name: 'Ross Island', wiki: 'Ross_Island,_South_Andaman' },
      { name: 'Baratang Island', wiki: 'Baratang_Island' }
    ]
  },
  Rishikesh: {
    mainWiki: 'Lakshman_Jhula',
    spots: [
      { name: 'Laxman Jhula', wiki: 'Lakshman_Jhula' },
      { name: 'Triveni Ghat', wiki: 'Triveni_Ghat' },
      { name: 'Ram Jhula', wiki: 'Ram_Jhula' },
      { name: 'Beatles Ashram', wiki: 'Beatles_Ashram' }
    ]
  },
  Darjeeling: {
    mainWiki: 'Darjeeling_Himalayan_Railway',
    spots: [
      { name: 'Tiger Hill, Darjeeling', wiki: 'Tiger_Hill,_Darjeeling' },
      { name: 'Batasia Loop', wiki: 'Batasia_Loop' },
      { name: 'Darjeeling Himalayan Railway', wiki: 'Darjeeling_Himalayan_Railway' },
      { name: 'Peace Pagoda, Darjeeling', wiki: 'Peace_Pagoda,_Darjeeling' }
    ]
  },
  Hampi: {
    mainWiki: 'Virupaksha_Temple,_Hampi',
    spots: [
      { name: 'Virupaksha Temple', wiki: 'Virupaksha_Temple,_Hampi' },
      { name: 'Stone Chariot at Vittala Temple', wiki: 'Vijaya_Vittala_Temple' },
      { name: 'Lotus Mahal', wiki: 'Lotus_Mahal' },
      { name: 'Elephant Stables, Hampi', wiki: 'Elephant_Stables,_Hampi' }
    ]
  },
  Agra: {
    mainWiki: 'Taj_Mahal',
    spots: [
      { name: 'Taj Mahal', wiki: 'Taj_Mahal' },
      { name: 'Agra Fort', wiki: 'Agra_Fort' },
      { name: 'Mehtab Bagh', wiki: 'Mehtab_Bagh' },
      { name: 'Fatehpur Sikri', wiki: 'Fatehpur_Sikri' }
    ]
  },
  Mumbai: {
    mainWiki: 'Gateway_of_India',
    spots: [
      { name: 'Gateway of India', wiki: 'Gateway_of_India' },
      { name: 'Marine Drive', wiki: 'Marine_Drive,_Mumbai' },
      { name: 'Chhatrapati Shivaji Terminus', wiki: 'Chhatrapati_Shivaji_Terminus' },
      { name: 'Bandra-Worli Sea Link', wiki: 'Bandra%E2%80%93Worli_Sea_Link' }
    ]
  },
  Delhi: {
    mainWiki: 'India_Gate',
    spots: [
      { name: 'India Gate', wiki: 'India_Gate' },
      { name: 'Red Fort', wiki: 'Red_Fort' },
      { name: 'Qutb Minar', wiki: 'Qutb_Minar' },
      { name: 'Humayun’s Tomb', wiki: 'Humayun%27s_Tomb' }
    ]
  },
  Amritsar: {
    mainWiki: 'Golden_Temple',
    spots: [
      { name: 'Golden Temple (Harmandir Sahib)', wiki: 'Golden_Temple' },
      { name: 'Jallianwala Bagh', wiki: 'Jallianwala_Bagh' },
      { name: 'Wagah Border', wiki: 'Wagah_border_ceremony' },
      { name: 'Gobindgarh Fort', wiki: 'Gobindgarh_Fort' }
    ]
  },
  Manali: {
    mainWiki: 'Solang_Valley',
    spots: [
      { name: 'Solang Valley', wiki: 'Solang_Valley' },
      { name: 'Hadimba Devi Temple', wiki: 'Hadimba_Temple' },
      { name: 'Rohtang Pass', wiki: 'Rohtang_Pass' },
      { name: 'Beas River Manali', wiki: 'Beas_River' }
    ]
  },
  Puducherry: {
    mainWiki: 'Promenade_Beach',
    spots: [
      { name: 'Promenade Beach (Rock Beach)', wiki: 'Promenade_Beach' },
      { name: 'Matrimandir (Auroville)', wiki: 'Matrimandir' },
      { name: 'French War Memorial', wiki: 'French_War_Memorial_(Puducherry)' },
      { name: 'Basilica of the Sacred Heart', wiki: 'Basilica_of_the_Sacred_Heart_of_Jesus,_Puducherry' }
    ]
  },
  Ooty: {
    mainWiki: 'Nilgiri_Mountain_Railway',
    spots: [
      { name: 'Nilgiri Mountain Railway', wiki: 'Nilgiri_Mountain_Railway' },
      { name: 'Government Botanical Gardens', wiki: 'Government_Botanical_Gardens,_Ooty' },
      { name: 'Ooty Lake', wiki: 'Ooty_Lake' },
      { name: 'Doddabetta Peak', wiki: 'Doddabetta' }
    ]
  },
  Jaisalmer: {
    mainWiki: 'Jaisalmer_Fort',
    spots: [
      { name: 'Jaisalmer Fort (Sonar Qila)', wiki: 'Jaisalmer_Fort' },
      { name: 'Thar Desert Sand Dunes', wiki: 'Thar_Desert' },
      { name: 'Patwon Ji Ki Haveli', wiki: 'Patwon_Ji_Ki_Haveli' },
      { name: 'Gadisar Lake', wiki: 'Gadisar_Lake' }
    ]
  },
  Shimla: {
    mainWiki: 'The_Ridge,_Shimla',
    spots: [
      { name: 'The Ridge & Christ Church', wiki: 'The_Ridge,_Shimla' },
      { name: 'Jakhoo Hill & Temple', wiki: 'Jakhoo' },
      { name: 'Mall Road Shimla', wiki: 'Mall_Road,_Shimla' },
      { name: 'Kalka-Shimla Railway', wiki: 'Kalka%E2%80%93Shimla_railway' }
    ]
  },
  Srinagar: {
    mainWiki: 'Dal_Lake',
    spots: [
      { name: 'Dal Lake & Houseboats', wiki: 'Dal_Lake' },
      { name: 'Shalimar Bagh Mughal Garden', wiki: 'Shalimar_Bagh,_Srinagar' },
      { name: 'Nishat Bagh', wiki: 'Nishat_Bagh' },
      { name: 'Gulmarg Meadow', wiki: 'Gulmarg' }
    ]
  },
  Jodhpur: {
    mainWiki: 'Mehrangarh',
    spots: [
      { name: 'Mehrangarh Fort', wiki: 'Mehrangarh' },
      { name: 'Jaswant Thada', wiki: 'Jaswant_Thada' },
      { name: 'Umaid Bhawan Palace', wiki: 'Umaid_Bhawan_Palace' },
      { name: 'Clock Tower (Ghanta Ghar)', wiki: 'Ghanta_Ghar_(Jodhpur)' }
    ]
  },
  Mysuru: {
    mainWiki: 'Mysore_Palace',
    spots: [
      { name: 'Mysore Palace (Amba Vilas)', wiki: 'Mysore_Palace' },
      { name: 'Chamundeshwari Temple', wiki: 'Chamundeshwari_Temple' },
      { name: 'Brindavan Gardens', wiki: 'Brindavan_Gardens' },
      { name: 'St. Philomena’s Cathedral', wiki: 'St._Philomena%27s_Cathedral,_Mysore' }
    ]
  },
  Kochi: {
    mainWiki: 'Chinese_fishing_nets',
    spots: [
      { name: 'Chinese Fishing Nets', wiki: 'Chinese_fishing_nets' },
      { name: 'Mattancherry Dutch Palace', wiki: 'Mattancherry_Palace' },
      { name: 'Paradesi Synagogue (Jew Town)', wiki: 'Paradesi_Synagogue' },
      { name: 'Fort Kochi Beach', wiki: 'Fort_Kochi' }
    ]
  },
  Bengaluru: {
    mainWiki: 'Bangalore_Palace',
    spots: [
      { name: 'Bangalore Palace', wiki: 'Bangalore_Palace' },
      { name: 'Lalbagh Botanical Garden', wiki: 'Lal_Bagh' },
      { name: 'Cubbon Park', wiki: 'Cubbon_Park' },
      { name: 'Vidhana Soudha', wiki: 'Vidhana_Soudha' }
    ]
  },
  Hyderabad: {
    mainWiki: 'Charminar',
    spots: [
      { name: 'Charminar', wiki: 'Charminar' },
      { name: 'Golconda Fort', wiki: 'Golconda_Fort' },
      { name: 'Hussain Sagar Lake & Buddha', wiki: 'Hussain_Sagar' },
      { name: 'Chowmahalla Palace', wiki: 'Chowmahalla_Palace' }
    ]
  },
  Kolkata: {
    mainWiki: 'Victoria_Memorial,_Kolkata',
    spots: [
      { name: 'Victoria Memorial', wiki: 'Victoria_Memorial,_Kolkata' },
      { name: 'Howrah Bridge', wiki: 'Howrah_Bridge' },
      { name: 'Dakshineswar Kali Temple', wiki: 'Dakshineswar_Kali_Temple' },
      { name: 'Belur Math', wiki: 'Belur_Math' }
    ]
  },
  Chennai: {
    mainWiki: 'Marina_Beach',
    spots: [
      { name: 'Marina Beach', wiki: 'Marina_Beach' },
      { name: 'Kapaleeshwarar Temple', wiki: 'Kapaleeshwarar_Temple' },
      { name: 'San Thome Basilica', wiki: 'San_Thome_Basilica' },
      { name: 'Fort St. George', wiki: 'Fort_St._George,_India' }
    ]
  },
  Coorg: {
    mainWiki: 'Kodagu',
    spots: [
      { name: 'Abbey Falls', wiki: 'Abbey_Falls' },
      { name: 'Raja’s Seat', wiki: 'Raja%27s_Seat' },
      { name: 'Dubare Elephant Camp', wiki: 'Dubare' },
      { name: 'Namdroling Golden Monastery', wiki: 'Namdroling_Monastery' }
    ]
  },
  Kaziranga: {
    mainWiki: 'Kaziranga_National_Park',
    spots: [
      { name: 'Kaziranga National Park', wiki: 'Kaziranga_National_Park' },
      { name: 'Great One-Horned Rhinoceros', wiki: 'Indian_rhinoceros' },
      { name: 'Brahmaputra Riverfront', wiki: 'Brahmaputra_River' },
      { name: 'Assam Tea Garden', wiki: 'Tea_garden' }
    ]
  },
  Khajuraho: {
    mainWiki: 'Kandariya_Mahadeva_Temple',
    spots: [
      { name: 'Kandariya Mahadeva Temple', wiki: 'Kandariya_Mahadeva_Temple' },
      { name: 'Lakshmana Temple', wiki: 'Lakshmana_Temple,_Khajuraho' },
      { name: 'Raneh Falls Canyon', wiki: 'Raneh_Falls' },
      { name: 'Chaturbhuj Temple', wiki: 'Chaturbhuj_Temple_(Khajuraho)' }
    ]
  },
  Mahabalipuram: {
    mainWiki: 'Shore_Temple',
    spots: [
      { name: 'Shore Temple', wiki: 'Shore_Temple' },
      { name: 'Pancha Rathas (Five Rathas)', wiki: 'Pancha_Rathas' },
      { name: 'Descent of the Ganges Relief', wiki: 'Descent_of_the_Ganges_(relief)' },
      { name: 'Krishna’s Butter Ball', wiki: 'Krishna%27s_Butterball' }
    ]
  },
  Lakshadweep: {
    mainWiki: 'Agatti_Island',
    spots: [
      { name: 'Agatti Coral Lagoon', wiki: 'Agatti_Island' },
      { name: 'Bangaram Atoll', wiki: 'Bangaram_Atoll' },
      { name: 'Kavaratti Island', wiki: 'Kavaratti' },
      { name: 'Minicoy Island', wiki: 'Minicoy' }
    ]
  },
  'Spiti Valley': {
    mainWiki: 'Key_Monastery',
    spots: [
      { name: 'Key Gompa Monastery', wiki: 'Key_Monastery' },
      { name: 'Chandratal Crescent Lake', wiki: 'Chandra_Taal' },
      { name: 'Dhankar Monastery & Fort', wiki: 'Dhankar_Gompa' },
      { name: 'Pin Valley National Park', wiki: 'Pin_Valley_National_Park' }
    ]
  },
  'Rann of Kutch': {
    mainWiki: 'Great_Rann_of_Kutch',
    spots: [
      { name: 'White Rann Salt Desert', wiki: 'Great_Rann_of_Kutch' },
      { name: 'Kalo Dungar (Black Hill)', wiki: 'Kalo_Dungar' },
      { name: 'Aina Mahal (Palace of Mirrors)', wiki: 'Aina_Mahal' },
      { name: 'Vijay Vilas Palace', wiki: 'Vijay_Vilas_Palace' }
    ]
  },
  Athens: {
    mainWiki: 'Parthenon',
    spots: [
      { name: 'Acropolis & Parthenon', wiki: 'Parthenon' },
      { name: 'Plaka Old Town', wiki: 'Plaka' },
      { name: 'Temple of Olympian Zeus', wiki: 'Temple_of_Olympian_Zeus,_Athens' },
      { name: 'Panathenaic Stadium', wiki: 'Panathenaic_Stadium' }
    ]
  },
  Ithaca: {
    mainWiki: 'Vathy,_Ithaca',
    spots: [
      { name: 'Vathy Horseshoe Harbour', wiki: 'Vathy,_Ithaca' },
      { name: 'Kioni Bay Village', wiki: 'Kioni,_Ithaca' },
      { name: 'Gidaki Beach', wiki: 'Gidaki_Beach' },
      { name: 'Stavros Heritage Village', wiki: 'Stavros,_Ithaca' }
    ]
  },
  Santorini: {
    mainWiki: 'Oia,_Greece',
    spots: [
      { name: 'Oia Village & Blue Domes', wiki: 'Oia,_Greece' },
      { name: 'Fira Caldera Clifftop', wiki: 'Fira' },
      { name: 'Red Beach', wiki: 'Red_Beach_(Santorini)' },
      { name: 'Akrotiri Archaeological Site', wiki: 'Akrotiri_(Santorini)' }
    ]
  },
  Crete: {
    mainWiki: 'Knossos',
    spots: [
      { name: 'Palace of Knossos', wiki: 'Knossos' },
      { name: 'Elafonisi Pink Beach', wiki: 'Elafonisi' },
      { name: 'Chania Venetian Old Harbour', wiki: 'Chania' },
      { name: 'Samaria Gorge', wiki: 'Samari%C3%A1_Gorge' }
    ]
  },
  Dubai: {
    mainWiki: 'Burj_Khalifa',
    spots: [
      { name: 'Burj Khalifa', wiki: 'Burj_Khalifa' },
      { name: 'Palm Jumeirah', wiki: 'Palm_Jumeirah' },
      { name: 'Dubai Creek & Dhows', wiki: 'Dubai_Creek' },
      { name: 'Burj Al Arab', wiki: 'Burj_Al_Arab' }
    ]
  },
  Bali: {
    mainWiki: 'Ulun_Danu_Bratan_Temple',
    spots: [
      { name: 'Ulun Danu Beratan Temple', wiki: 'Ulun_Danu_Bratan_Temple' },
      { name: 'Tanah Lot Sea Temple', wiki: 'Tanah_Lot' },
      { name: 'Uluwatu Cliff Temple', wiki: 'Uluwatu_Temple' },
      { name: 'Tegallalang Rice Terraces', wiki: 'Tegallalang_Rice_Terrace' }
    ]
  },
  Singapore: {
    mainWiki: 'Marina_Bay_Sands',
    spots: [
      { name: 'Marina Bay Sands SkyPark', wiki: 'Marina_Bay_Sands' },
      { name: 'Gardens by the Bay & Supertrees', wiki: 'Gardens_by_the_Bay' },
      { name: 'Jewel Changi Rain Vortex', wiki: 'Jewel_Changi_Airport' },
      { name: 'Sentosa Island Resort', wiki: 'Sentosa' }
    ]
  },
  Bangkok: {
    mainWiki: 'Wat_Arun',
    spots: [
      { name: 'Wat Arun (Temple of Dawn)', wiki: 'Wat_Arun' },
      { name: 'The Grand Palace', wiki: 'Grand_Palace' },
      { name: 'Wat Pho (Reclining Buddha)', wiki: 'Wat_Pho' },
      { name: 'Chatuchak Weekend Market', wiki: 'Chatuchak_Weekend_Market' }
    ]
  },
  Paris: {
    mainWiki: 'Eiffel_Tower',
    spots: [
      { name: 'Eiffel Tower', wiki: 'Eiffel_Tower' },
      { name: 'The Louvre Museum', wiki: 'Louvre' },
      { name: 'Arc de Triomphe', wiki: 'Arc_de_Triomphe' },
      { name: 'Notre-Dame Cathedral', wiki: 'Notre-Dame_de_Paris' }
    ]
  },
  Rome: {
    mainWiki: 'Colosseum',
    spots: [
      { name: 'The Colosseum', wiki: 'Colosseum' },
      { name: 'Trevi Fountain', wiki: 'Trevi_Fountain' },
      { name: 'The Pantheon', wiki: 'Pantheon,_Rome' },
      { name: 'St. Peter’s Basilica', wiki: 'St._Peter%27s_Basilica' }
    ]
  },
  Kyoto: {
    mainWiki: 'Kinkaku-ji',
    spots: [
      { name: 'Fushimi Inari-Taisha (Torii Gates)', wiki: 'Fushimi_Inari-taisha' },
      { name: 'Kinkaku-ji (Golden Pavilion)', wiki: 'Kinkaku-ji' },
      { name: 'Arashiyama Bamboo Grove', wiki: 'Arashiyama' },
      { name: 'Kiyomizu-dera Temple', wiki: 'Kiyomizu-dera' }
    ]
  },
  London: {
    mainWiki: 'Big_Ben',
    spots: [
      { name: 'Big Ben & Palace of Westminster', wiki: 'Big_Ben' },
      { name: 'Tower Bridge', wiki: 'Tower_Bridge' },
      { name: 'London Eye', wiki: 'London_Eye' },
      { name: 'Buckingham Palace', wiki: 'Buckingham_Palace' }
    ]
  },
  Istanbul: {
    mainWiki: 'Hagia_Sophia',
    spots: [
      { name: 'Hagia Sophia', wiki: 'Hagia_Sophia' },
      { name: 'The Blue Mosque (Sultanahmet)', wiki: 'Sultan_Ahmed_Mosque' },
      { name: 'Topkapı Palace', wiki: 'Topkap%C4%B1_Palace' },
      { name: 'Grand Bazaar', wiki: 'Grand_Bazaar,_Istanbul' }
    ]
  },
  'New York City': {
    mainWiki: 'Statue_of_Liberty',
    spots: [
      { name: 'Statue of Liberty', wiki: 'Statue_of_Liberty' },
      { name: 'Times Square', wiki: 'Times_Square' },
      { name: 'Central Park', wiki: 'Central_Park' },
      { name: 'Brooklyn Bridge', wiki: 'Brooklyn_Bridge' }
    ]
  },
  Maldives: {
    mainWiki: 'Maldives',
    spots: [
      { name: 'Malé Capital Island', wiki: 'Mal%C3%A9' },
      { name: 'Ari Atoll Overwater Lagoons', wiki: 'Ari_Atoll' },
      { name: 'Banana Reef Marine Sanctuary', wiki: 'Banana_Reef' },
      { name: 'Hulhumalé Beach', wiki: 'Hulhumal%C3%A9' }
    ]
  }
}

async function fetchWikiImageAndExtract(wikiSlug) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiSlug}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'OdysseyTravel/1.0 (verified landmark catalogue; contact@odyssey.com)' }
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
  console.log('Connected to MongoDB. Starting authentic Wikipedia photo extraction...')

  const destinations = await Destination.find({})
  console.log(`Found ${destinations.length} destinations.`)

  let successCount = 0

  for (const dest of destinations) {
    const entry = WIKI_SPOT_MAP[dest.name]
    if (!entry) {
      console.log(`Skipping ${dest.name} (no map entry)`)
      continue
    }

    console.log(`Processing: ${dest.name}...`)

    // 1. Fetch main verified image
    const mainData = await fetchWikiImageAndExtract(entry.mainWiki)
    if (mainData && mainData.imageUrl) {
      dest.imageUrl = mainData.imageUrl
    }

    // 2. Fetch verified spot images & descriptions
    const spotResults = []
    for (const spotInfo of entry.spots) {
      const spotData = await fetchWikiImageAndExtract(spotInfo.wiki)
      if (spotData && spotData.imageUrl) {
        spotResults.push({
          name: spotInfo.name,
          imageUrl: spotData.imageUrl,
          description: spotData.description || `Famous historical landmark in ${dest.name}.`
        })
      } else {
        // Fallback to destination main image if spot-specific page has no lead image
        spotResults.push({
          name: spotInfo.name,
          imageUrl: dest.imageUrl,
          description: `Famous must-see spot in ${dest.name}.`
        })
      }
    }

    dest.famousSpots = spotResults
    await dest.save()
    successCount++
    console.log(`✓ ${dest.name}: Updated with ${spotResults.length} authentic Wikimedia photos.`)
  }

  console.log(`\nSuccessfully updated ${successCount}/${destinations.length} destinations with original verified photos!`)
  await mongoose.disconnect()
}

run().catch(err => {
  console.error('Fatal error during photo verification:', err)
  process.exit(1)
})
