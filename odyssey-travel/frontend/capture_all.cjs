const puppeteer = require('puppeteer-core')
const jwt = require('jsonwebtoken')
const path = require('path')
const fs = require('fs')

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT_DIR = path.resolve('..', 'srs_assets')
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

const JWT_SECRET = 'supersecretjwtkey_odyssey_travel_dev_2026'
const TEST_USER = {
  id: '6ae1911e4b8cde6c7e292e38',
  name: 'Herman',
  email: 'hermanx2702@gmail.com',
}

const token = jwt.sign(
  { sub: TEST_USER.id, email: TEST_USER.email, type: 'access' },
  JWT_SECRET,
  { expiresIn: '2h' }
)

const DIAGRAMS = {
  'fig_01_use_case.png': `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff; padding: 25px; margin: 0; }
        .diagram-box { border: 2px solid #10232d; border-radius: 12px; padding: 20px; width: 880px; margin: 0 auto; background: #fafbfc; }
        .system-title { text-align: center; font-size: 20px; font-weight: 700; color: #10232d; margin-bottom: 20px; letter-spacing: 1px; }
        .actors-wrapper { display: flex; justify-content: space-between; align-items: stretch; position: relative; }
        .actor-col { width: 140px; display: flex; flex-direction: column; align-items: center; justify-content: space-around; gap: 30px; }
        .actor-card { text-align: center; }
        .actor-icon { font-size: 34px; }
        .actor-label { font-size: 13px; font-weight: 700; color: #10232d; margin-top: 5px; }
        .system-boundary { flex: 1; border: 2px dashed #b58b4a; border-radius: 10px; padding: 18px; margin: 0 20px; background: #ffffff; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .usecase-oval { border: 1.5px solid #205068; border-radius: 999px; padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 600; color: #10232d; background: #f0f7fa; box-shadow: 0 2px 4px rgba(0,0,0,0.04); display: flex; align-items: center; justify-content: center; }
        .usecase-oval.ai { border-color: #b58b4a; background: #fffbf0; color: #8a641d; }
      </style>
    </head>
    <body>
      <div class="diagram-box">
        <div class="system-title">ODYSSEY TRAVEL SYSTEM &mdash; USE CASE DIAGRAM</div>
        <div class="actors-wrapper">
          <div class="actor-col">
            <div class="actor-card">
              <div class="actor-icon">👤</div>
              <div class="actor-label">Traveler / Guest</div>
            </div>
            <div class="actor-card">
              <div class="actor-icon">🔐</div>
              <div class="actor-label">Registered Traveler</div>
            </div>
          </div>
          <div class="system-boundary">
            <div class="usecase-oval">Explore 3D Interactive Earth</div>
            <div class="usecase-oval">Search & Filter Destinations</div>
            <div class="usecase-oval ai">AI Natural Language Smart Search</div>
            <div class="usecase-oval">Inspect 2D Route Topology Map</div>
            <div class="usecase-oval ai">Generate Wayfinder AI Itinerary</div>
            <div class="usecase-oval">Export Itinerary as PDF / Print</div>
            <div class="usecase-oval">Live Multi-Modal Travel Search</div>
            <div class="usecase-oval">Simulate Razorpay Payment</div>
            <div class="usecase-oval">Print Travel Boarding Ticket</div>
            <div class="usecase-oval ai">Consult Odyssey AI Concierge</div>
            <div class="usecase-oval">Play Contest of the Bow (Coupon)</div>
            <div class="usecase-oval">Manage Traveler Profile & Past Trips</div>
          </div>
          <div class="actor-col">
            <div class="actor-card">
              <div class="actor-icon">🤖</div>
              <div class="actor-label">Odyssey AI Engine</div>
            </div>
            <div class="actor-card">
              <div class="actor-icon">💳</div>
              <div class="actor-label">Razorpay & Amadeus APIs</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
  'fig_02_activity.png': `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff; padding: 20px; margin: 0; }
        .flow-box { border: 2px solid #10232d; border-radius: 12px; padding: 20px; width: 880px; margin: 0 auto; background: #fafbfc; }
        .title { text-align: center; font-size: 19px; font-weight: 700; color: #10232d; margin-bottom: 20px; }
        .lanes { display: flex; gap: 15px; }
        .lane { flex: 1; border: 1px solid #dcdcdc; border-radius: 8px; background: #ffffff; padding: 12px; }
        .lane-header { font-weight: 700; font-size: 13px; text-align: center; padding-bottom: 8px; border-bottom: 2px solid #b58b4a; margin-bottom: 12px; color: #10232d; }
        .step { background: #f4f8fa; border: 1px solid #bcd5e0; border-radius: 6px; padding: 8px; text-align: center; font-size: 11px; font-weight: 600; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
        .step.decision { background: #fff8e8; border-color: #e5c378; }
        .step.ai { background: #fdf5e6; border-color: #b58b4a; color: #8a641d; font-weight: 700; }
        .arrow { text-align: center; font-size: 14px; color: #777; margin-bottom: 6px; }
      </style>
    </head>
    <body>
      <div class="flow-box">
        <div class="title">ACTIVITY DIAGRAM &mdash; VOYAGE PLANNING &amp; BOOKING WORKFLOW</div>
        <div class="lanes">
          <div class="lane">
            <div class="lane-header">Traveler / Client</div>
            <div class="step">Launch App &amp; Explore 3D Globe</div>
            <div class="arrow">&darr;</div>
            <div class="step">Input Natural Language Query (e.g. 'Beach under &#8377;40k')</div>
            <div class="arrow">&darr;</div>
            <div class="step">Select Destination &amp; View 2D Circuit Map</div>
            <div class="arrow">&darr;</div>
            <div class="step">Open Wayfinder &amp; Set Trip Preferences</div>
            <div class="arrow">&darr;</div>
            <div class="step">Select Flight/Hotel &amp; Initiate Booking</div>
            <div class="arrow">&darr;</div>
            <div class="step">Download PDF Ticket &amp; Itinerary</div>
          </div>
          <div class="lane">
            <div class="lane-header">Odyssey Core Engine</div>
            <div class="step">Authenticate &amp; Retrieve User Travel Profile</div>
            <div class="arrow">&darr;</div>
            <div class="step ai">Parse Intent, Month, Season &amp; Budget Thresholds</div>
            <div class="arrow">&darr;</div>
            <div class="step ai">Generate Optimal Multi-Day Topological Waypoints</div>
            <div class="arrow">&darr;</div>
            <div class="step">Compute Great-Circle Distances &amp; Transit Times</div>
            <div class="arrow">&darr;</div>
            <div class="step decision">Apply Contest Coupon Discount?</div>
            <div class="arrow">&darr;</div>
            <div class="step">Generate Secure 10-Digit PNR Code</div>
          </div>
          <div class="lane">
            <div class="lane-header">Database &amp; External APIs</div>
            <div class="step">MongoDB: Query 70+ Destinations &amp; Spots</div>
            <div class="arrow">&darr;</div>
            <div class="step">Leaflet / Esri: Stream Topographic Tiles</div>
            <div class="arrow">&darr;</div>
            <div class="step">OpenWeather: Fetch Real-Time Microclimate</div>
            <div class="arrow">&darr;</div>
            <div class="step">Amadeus Simulation: Query Flight / Stay Fares</div>
            <div class="arrow">&darr;</div>
            <div class="step">Razorpay Simulation: Process Payment Authorization</div>
            <div class="arrow">&darr;</div>
            <div class="step">MongoDB: Persist Itinerary &amp; Booking Record</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
  'fig_03_sequence.png': `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff; padding: 20px; margin: 0; }
        .seq-box { border: 2px solid #10232d; border-radius: 12px; padding: 20px; width: 880px; margin: 0 auto; background: #fafbfc; }
        .title { text-align: center; font-size: 19px; font-weight: 700; color: #10232d; margin-bottom: 20px; }
        .lifelines { display: flex; justify-content: space-between; border-bottom: 2px solid #b58b4a; padding-bottom: 10px; margin-bottom: 15px; }
        .actor { font-size: 12px; font-weight: 700; color: #10232d; text-align: center; width: 160px; }
        .messages { display: flex; flex-direction: column; gap: 10px; font-size: 11px; font-weight: 600; }
        .msg-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 12px; border-radius: 6px; background: #ffffff; border: 1px solid #e0e5e8; }
        .msg-arrow { color: #b58b4a; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="seq-box">
        <div class="title">SEQUENCE DIAGRAM &mdash; WAYFINDER AI ITINERARY GENERATION</div>
        <div class="lifelines">
          <div class="actor">Traveler</div>
          <div class="actor">Frontend (Vite/React)</div>
          <div class="actor">Express API Server</div>
          <div class="actor">Wayfinder AI Planner</div>
          <div class="actor">MongoDB Database</div>
        </div>
        <div class="messages">
          <div class="msg-row"><span>1. Submit planning parameters (Days, Budget, Style)</span> <span class="msg-arrow">&rarr; Frontend</span></div>
          <div class="msg-row"><span>2. POST /api/chat/itinerary (Bearer JWT Authorization)</span> <span class="msg-arrow">&rarr; Express Server</span></div>
          <div class="msg-row"><span>3. Verify JWT &amp; Retrieve User Travel Profile</span> <span class="msg-arrow">&rarr; MongoDB Database</span></div>
          <div class="msg-row"><span>4. Return Destination Data &amp; Travel Preferences</span> <span class="msg-arrow">&larr; MongoDB Database</span></div>
          <div class="msg-row"><span>5. Synthesize Contextual Multi-Day Itinerary Plan</span> <span class="msg-arrow">&rarr; Wayfinder Planner</span></div>
          <div class="msg-row"><span>6. Calculate Waypoint Spatial Topology &amp; Distance</span> <span class="msg-arrow">&larr; Wayfinder Planner</span></div>
          <div class="msg-row"><span>7. Return JSON Plan with Morning/Afternoon/Evening Stops</span> <span class="msg-arrow">&larr; Express Server</span></div>
          <div class="msg-row"><span>8. Render 2D Route Map &amp; Interactive Polyline on Leaflet Canvas</span> <span class="msg-arrow">&larr; Frontend</span></div>
          <div class="msg-row"><span>9. User clicks "Save Itinerary" &rarr; POST /api/itineraries</span> <span class="msg-arrow">&rarr; MongoDB Database</span></div>
          <div class="msg-row"><span>10. Return HTTP 201 Created with Itinerary Record ID</span> <span class="msg-arrow">&larr; Traveler</span></div>
        </div>
      </div>
    </body>
    </html>
  `,
  'fig_04_er_diagram.png': `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff; padding: 20px; margin: 0; }
        .er-box { border: 2px solid #10232d; border-radius: 12px; padding: 20px; width: 880px; margin: 0 auto; background: #fafbfc; }
        .title { text-align: center; font-size: 19px; font-weight: 700; color: #10232d; margin-bottom: 20px; }
        .entities-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .entity-card { background: #ffffff; border: 1.5px solid #10232d; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
        .entity-header { background: #10232d; color: #f5d796; padding: 7px 10px; font-weight: 700; font-size: 12px; text-align: center; }
        .entity-fields { padding: 9px; font-size: 11px; font-family: 'Consolas', monospace; color: #222; }
        .pk { color: #b58b4a; font-weight: bold; }
        .fk { color: #2080a0; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="er-box">
        <div class="title">ENTITY-RELATIONSHIP (ER) DIAGRAM &mdash; ODYSSEY SCHEMA ARCHITECTURE</div>
        <div class="entities-grid">
          <div class="entity-card">
            <div class="entity-header">USER</div>
            <div class="entity-fields">
              <div><span class="pk">PK</span> _id: ObjectId</div>
              <div>name: String</div>
              <div>email: String (Unique)</div>
              <div>passwordHash: String</div>
              <div>travelProfile: Object</div>
              <div>createdAt: Date</div>
            </div>
          </div>
          <div class="entity-card">
            <div class="entity-header">DESTINATION</div>
            <div class="entity-fields">
              <div><span class="pk">PK</span> _id: ObjectId</div>
              <div>name: String</div>
              <div>state: String</div>
              <div>country: String</div>
              <div>coordinates: {lat, lon}</div>
              <div>famousSpots: Array&lt;Spot&gt;</div>
              <div>budgetINR: Number</div>
            </div>
          </div>
          <div class="entity-card">
            <div class="entity-header">ITINERARY</div>
            <div class="entity-fields">
              <div><span class="pk">PK</span> _id: ObjectId</div>
              <div><span class="fk">FK</span> user: ObjectId &rarr; User</div>
              <div><span class="fk">FK</span> destination: ObjectId</div>
              <div>title: String</div>
              <div>days: Array&lt;DayPlan&gt;</div>
              <div>totalCostINR: Number</div>
            </div>
          </div>
          <div class="entity-card">
            <div class="entity-header">BOOKING</div>
            <div class="entity-fields">
              <div><span class="pk">PK</span> _id: ObjectId</div>
              <div><span class="fk">FK</span> user: ObjectId &rarr; User</div>
              <div>pnr: String (10-Digit)</div>
              <div>serviceType: String</div>
              <div>totalAmount: Number</div>
              <div>status: 'paid' | 'confirmed'</div>
            </div>
          </div>
          <div class="entity-card">
            <div class="entity-header">REVIEW</div>
            <div class="entity-fields">
              <div><span class="pk">PK</span> _id: ObjectId</div>
              <div><span class="fk">FK</span> user: ObjectId &rarr; User</div>
              <div><span class="fk">FK</span> destination: ObjectId</div>
              <div>rating: Number (1-5)</div>
              <div>comment: String</div>
              <div>createdAt: Date</div>
            </div>
          </div>
          <div class="entity-card">
            <div class="entity-header">COUPON / GAME_REWARD</div>
            <div class="entity-fields">
              <div><span class="pk">PK</span> code: String (Unique)</div>
              <div><span class="fk">FK</span> user: ObjectId &rarr; User</div>
              <div>score: Number (Axes Hit)</div>
              <div>discountPercent: Number (5-15%)</div>
              <div>redeemed: Boolean</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
  'fig_05_dfd.png': `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff; padding: 20px; margin: 0; }
        .dfd-box { border: 2px solid #10232d; border-radius: 12px; padding: 20px; width: 880px; margin: 0 auto; background: #fafbfc; }
        .title { text-align: center; font-size: 19px; font-weight: 700; color: #10232d; margin-bottom: 20px; }
        .level-section { margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 15px; }
        .level-title { font-weight: 700; color: #b58b4a; font-size: 13px; margin-bottom: 10px; text-transform: uppercase; }
        .dfd-row { display: flex; align-items: center; justify-content: space-around; gap: 15px; }
        .dfd-entity { border: 2px solid #10232d; padding: 10px 14px; font-weight: 700; font-size: 12px; background: #ffffff; border-radius: 6px; }
        .dfd-process { border: 2px solid #b58b4a; border-radius: 50%; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 700; font-size: 11px; background: #fffcf4; color: #10232d; }
        .dfd-store { border-top: 2px solid #205068; border-bottom: 2px solid #205068; padding: 8px 14px; font-weight: 700; font-size: 11px; background: #f0f7fa; }
        .data-stream { font-size: 10px; font-weight: 600; color: #555; text-align: center; max-width: 140px; }
      </style>
    </head>
    <body>
      <div class="dfd-box">
        <div class="title">DATA FLOW DIAGRAM (DFD) &mdash; LEVEL 0 &amp; LEVEL 1 ARCHITECTURE</div>
        <div class="level-section">
          <div class="level-title">DFD Level 0: Context Diagram</div>
          <div class="dfd-row">
            <div class="dfd-entity">Traveler / User</div>
            <div class="data-stream">&larr; Auth Credentials / Itinerary Requests &rarr;<br>&larr; Tickets, Plans &amp; Soundscapes &rarr;</div>
            <div class="dfd-process">0.0<br>Odyssey Travel AI Platform</div>
            <div class="data-stream">&larr; Payment Gateway / GDS Queries &rarr;<br>&larr; Weather &amp; Geodata Streams &rarr;</div>
            <div class="dfd-entity">External Gateways (Razorpay/Amadeus/Esri)</div>
          </div>
        </div>
        <div>
          <div class="level-title">DFD Level 1: Subsystem Data Flow</div>
          <div class="dfd-row">
            <div class="dfd-store">D1: Destinations Catalog</div>
            <div class="dfd-store">D2: User &amp; Preferences Store</div>
            <div class="dfd-store">D3: Bookings &amp; PNR Ledger</div>
            <div class="dfd-store">D4: Curated Itineraries Store</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
}

async function run() {
  console.log('Launching Puppeteer Chrome...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,840'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 840, deviceScaleFactor: 1.5 })

  console.log('Rendering 5 UML and Architectural Diagrams...')
  for (const [filename, html] of Object.entries(DIAGRAMS)) {
    const dest = path.join(OUT_DIR, filename)
    await page.setContent(html, { waitUntil: 'load' })
    await page.screenshot({ path: dest })
    console.log(`Saved: ${filename}`)
  }

  // Pre-inject authentication credentials into browser session
  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle2' })
  await page.evaluate((t, u) => {
    sessionStorage.setItem('odysseyAccessToken', t)
    sessionStorage.setItem('odysseyUser', JSON.stringify(u))
    window.dispatchEvent(new Event('odyssey-auth-change'))
  }, token, TEST_USER)

  const CAPTURES = [
    {
      name: 'fig_06_home_globe.png',
      url: 'http://127.0.0.1:5173/',
      waitMs: 1500,
    },
    {
      name: 'fig_07_destinations_catalog.png',
      url: 'http://127.0.0.1:5173/destinations',
      waitMs: 1200,
    },
    {
      name: 'fig_08_destination_details.png',
      url: 'http://127.0.0.1:5173/destinations/6ae06da2990760246cf4d6a1',
      action: async (p) => {
        await p.waitForSelector('.destination-details', { timeout: 10000 }).catch(() => {})
        await new Promise((r) => setTimeout(r, 1200))
      },
      waitMs: 1500,
    },
    {
      name: 'fig_09_interactive_route_map.png',
      url: 'http://127.0.0.1:5173/destinations/6ae06da2990760246cf4d6a1',
      action: async (p) => {
        await p.waitForSelector('.odyssey-route-map-section', { timeout: 10000 }).catch(() => {})
        await p.evaluate(() => {
          const mapEl = document.querySelector('.odyssey-route-map-section')
          if (mapEl) mapEl.scrollIntoView({ behavior: 'instant', block: 'center' })
        })
        await new Promise((r) => setTimeout(r, 2000))
      },
      waitMs: 2000,
    },
    {
      name: 'fig_10_wayfinder_planner.png',
      url: 'http://127.0.0.1:5173/wayfinder',
      waitMs: 1500,
    },
    {
      name: 'fig_11_travel_search.png',
      url: 'http://127.0.0.1:5173/search/flights',
      waitMs: 1500,
    },
    {
      name: 'fig_12_contest_bow.png',
      url: 'http://127.0.0.1:5173/contest',
      waitMs: 1500,
    },
    {
      name: 'fig_13_ai_concierge.png',
      url: 'http://127.0.0.1:5173/',
      action: async (p) => {
        await p.evaluate(() => {
          const toggle = document.querySelector('.odyssey-concierge-toggle, aside[aria-label="Odyssey AI Travel Concierge"] button')
          if (toggle) toggle.click()
        })
      },
      waitMs: 1000,
    },
    {
      name: 'fig_14_my_journeys.png',
      url: 'http://127.0.0.1:5173/journeys',
      waitMs: 1500,
    },
    {
      name: 'fig_15_contact_support.png',
      url: 'http://127.0.0.1:5173/contact',
      waitMs: 1200,
    },
    {
      name: 'fig_16_engineering_team.png',
      url: 'http://127.0.0.1:5173/team',
      waitMs: 1200,
    },
  ]

  for (const cap of CAPTURES) {
    console.log(`Capturing ${cap.name} from ${cap.url}...`)
    try {
      await page.goto(cap.url, { waitUntil: 'networkidle2', timeout: 15000 })
      if (cap.action) await cap.action(page)
      if (cap.waitMs) await new Promise((r) => setTimeout(r, cap.waitMs))
      const dest = path.join(OUT_DIR, cap.name)
      await page.screenshot({ path: dest })
      console.log(`Saved: ${cap.name}`)
    } catch (e) {
      console.error(`Failed ${cap.name}:`, e.message)
    }
  }

  await browser.close()
  console.log('Capture process finished successfully!')
}

run().catch((e) => {
  console.error('Fatal error:', e)
  process.exit(1)
})
