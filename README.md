# Odyssey Travel

A Homer's-*Odyssey*-themed trip planner built on the MEAN stack (MongoDB, Express,
Angular, Node). Search flights/trains/buses/cruises/hotels, check the weather, chat with
an AI "Wayfinder" that can draft a day-by-day itinerary, try the one-shot "Contest of the
Bow" mini-game, and toggle dark mode.

Every external integration (OpenAI, OpenWeatherMap, Amadeus, etc.) runs in **demo mode**
with realistic mock data until you add a real API key, so the whole app works immediately
after setup with zero third-party accounts.

```
odyssey-travel-app/
├── backend/          Node/Express API + MongoDB models
├── frontend/          Angular 21 app
├── docker-compose.yml Optional one-command setup
└── README.md          You are here
```

---

## 1. Prerequisites

You need these installed on your machine:

| Tool | Version | Check with |
|---|---|---|
| Node.js | 20.x or later (18+ works, 20+ recommended) | `node -v` |
| npm | comes with Node | `npm -v` |
| MongoDB | 6.x or 7.x, **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster | `mongod --version` |

Optional:
- **Docker + Docker Compose** if you'd rather run everything in containers (see §4) —
  in that case you don't need MongoDB or the exact Node version installed locally.

> The Angular CLI does **not** need to be installed globally — `npx` (bundled with npm)
> runs it for you.

---

## 2. Get the code onto your machine

Unzip the project folder anywhere, then open a terminal in it. You'll run the backend
and frontend as two separate processes, so you'll want two terminal tabs/windows open
in `odyssey-travel-app/`.

---

## 3. Manual local setup (recommended for development)

### 3.1 Start MongoDB

**Option A — local MongoDB:**
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows
# Start the "MongoDB Server" service from Services, or run mongod.exe directly.
```

**Option B — MongoDB Atlas (no local install):**
1. Create a free cluster at https://www.mongodb.com/atlas.
2. Get its connection string (Atlas → Connect → Drivers) — it looks like
   `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/odyssey_travel`.
3. You'll paste this into `backend/.env` as `MONGO_URI` in the next step.

You can skip this step entirely and come back to it later — the app boots fine without
a database, it just returns a clear error on the sign-up/login/mini-game routes until
Mongo is reachable.

### 3.2 Configure and start the backend

```bash
cd backend
cp .env.example .env
npm install
```

Open `backend/.env` in an editor and fill in at least:
- `MONGO_URI` — leave the default if you started local MongoDB with defaults, or paste
  your Atlas string.
- `JWT_SECRET` — replace the placeholder with a real random string:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
  Paste the output in as `JWT_SECRET`.

Everything else in `.env` (`OPENAI_API_KEY`, `OPENWEATHER_API_KEY`, `AMADEUS_CLIENT_ID`,
etc.) can stay blank — see §6 for what each one unlocks.

Start the API:
```bash
npm run dev
```
You should see:
```
[db] connected to MongoDB
[server] Odyssey Travel API listening on http://localhost:4000
```
Leave this terminal running. Quick sanity check in a browser or with curl:
`http://localhost:4000/api/health` should return `{"status":"ok","database":"connected"}`.

### 3.3 Configure and start the frontend

In your **second terminal**:
```bash
cd frontend
npm install
npm start
```
This runs `ng serve` with a dev proxy that forwards any `/api/...` request to
`http://localhost:4000`, so the Angular app and the Node API talk to each other with no
CORS setup needed. Visit **http://localhost:4200** — you should see the homepage with
the animated hero, search bar, hot suggestions, and weather widget.

That's it — sign up for an account, search a route, check the weather, chat with the
Wayfinder, and try the Contest of the Bow.

---

## 4. Docker Compose setup (alternative)

If you'd rather not install Node or MongoDB locally:

```bash
cp .env.example .env
```
Edit `.env` at the project root and set at least `JWT_SECRET` (same random-string trick
as above). Then:
```bash
docker compose up --build
```
This builds and starts three containers: MongoDB, the Node API (port 4000), and the
Angular app served through nginx (port 8080). Visit **http://localhost:8080**.

To add real API keys in this mode, put them in the root `.env` file — `docker-compose.yml`
already passes all of them through to the backend container.

Stop everything with `docker compose down` (add `-v` to also wipe the Mongo data volume).

---

## 5. Adding your own media (optional)

The homepage hero looks for a background video and a background music track. Neither is
included (they'd bloat the download), and the app works fine without them:

- **Video**: drop an MP4 at `frontend/public/assets/video/aegean-loop.mp4`. If it's
  missing, the hero automatically falls back to an animated gradient in the theme colors.
- **Audio**: drop an MP3 at `frontend/public/assets/audio/odyssey-theme.mp3`. It is
  **not** set to autoplay (browsers block that), so nothing breaks if it's missing —
  the "Play the Sirens' song" button just won't produce sound until a file is there.

---

## 6. Third-party API keys (all optional — demo mode covers everything)

Every route below runs on realistic mock data (clearly labeled `demoMode: true` in API
responses and in the UI) until you add its key to `backend/.env`. Add them one at a time
as you like — nothing else breaks if some are missing.

| Feature | Env vars | Where to get a key | Notes |
|---|---|---|---|
| AI chatbot & itinerary planner | `OPENAI_API_KEY`, `OPENAI_MODEL` | https://platform.openai.com | `OPENAI_MODEL` defaults to `gpt-4o-mini` — set it to any chat model your account can access. |
| Live weather | `OPENWEATHER_API_KEY` | https://openweathermap.org/api | Free tier is enough for the current-weather endpoint used here. |
| Flights | `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`, `AMADEUS_ENV` | https://developers.amadeus.com | Real integration included (`backend/src/providers/flights.provider.js`) using the Flight Offers Search API. Only resolves a handful of demo city names to airport codes out of the box — see the `IATA_LOOKUP` table in that file, or wire up Amadeus's Airport & City Search API for full coverage. |
| Trains | `TRAIN_API_URL`, `TRAIN_API_KEY` | e.g. Rail Europe, SaveATrain | `backend/src/providers/trains.provider.js` is a generic adapter template — these providers typically require a signed contract, so you'll need to adjust the request/response mapping to match your actual provider's docs. |
| Buses | `BUS_API_URL`, `BUS_API_KEY` | e.g. Travelopro, Trawex | Same generic-adapter pattern, see `buses.provider.js`. |
| Cruises | `CRUISE_API_URL`, `CRUISE_API_KEY` | e.g. Travelopro Cruise API | Same pattern, see `cruises.provider.js`. |
| Hotels/rentals | `HOTEL_API_URL`, `HOTEL_API_KEY` | e.g. Booking.com Demand API, Expedia Rapid API | Same pattern, see `hotels.provider.js`. |
| Places autocomplete | `GOOGLE_PLACES_API_KEY` | https://console.cloud.google.com (Places API) | Without a key, autocomplete uses the small offline city list in `backend/src/data/places.json` — edit that file to add more cities instantly. |

---

## 7. Project structure in detail

```
backend/
  server.js                 entry point (loads .env, connects Mongo, starts Express)
  src/
    app.js                  Express app: middleware + route mounting
    config/db.js            Mongo connection (fails gracefully, never crashes the server)
    models/                 Mongoose schemas (User, Itinerary)
    middleware/              JWT auth guard, central error handler
    routes/                 One file per feature area (auth, travel, chatbot, weather, game, suggestions)
    providers/               One file per travel mode; each has a real-or-mock branch
    services/                 OpenAI (chat + itinerary) and OpenWeatherMap wrappers
    data/                    Bundled JSON (hot suggestions, offline city list)

frontend/
  src/app/
    core/
      models/                 Shared TypeScript interfaces matching the API responses
      services/               One Angular service per backend route group
      interceptors/           Attaches the JWT to outgoing requests
      guards/                  Blocks /game unless logged in
    shared/components/       Navbar, Footer, and the meander (Greek key) divider
    features/
      home/                    Video-background hero + embeds search/suggestions/weather
      search-bar/              Mode chips, autocomplete, date pickers
      hot-suggestions/         Trending-destinations rail
      weather-widget/          City lookup, deity-themed weather glyph
      chatbot/                 Floating AI widget + itinerary planner sub-flow
      search-results/          Results list for any travel mode
      mini-game/                Canvas archery game — "Contest of the Bow"
      dev-team/                Static team page (edit the array in dev-team.ts)
      auth/login, auth/signup  Reactive-forms login/signup
```

---

## 8. Building for production

**Backend:** it's already production-ready — `npm start` runs `node server.js` with no
build step. Set `NODE_ENV=production` in its `.env`.

**Frontend:**
```bash
cd frontend
npx ng build
```
Output lands in `frontend/dist/frontend/browser/` — deploy that folder to any static
host (nginx, S3+CloudFront, Netlify, etc.) and configure your web server to proxy
`/api/*` to wherever the backend is running (see `frontend/nginx.conf` for a working
example, also used by `docker-compose.yml`).

---

## 9. Notes on choices made while building this

A few places where practicality won out over the letter of the original plan spec —
worth knowing about if you extend this:

- **No autoplay background music.** Browsers block unmuted autoplay audio, so the
  soundtrack starts on a visible button click instead ("Play the Sirens' song").
- **Canvas mini-game instead of Phaser.** Keeps the bundle small and dependency-free.
  If you want the richer Phaser version described in the original plan, `npm install
  phaser` in `frontend/` and swap out `features/mini-game/mini-game.ts`.
- **No Angular Material.** The whole UI is hand-styled with CSS custom properties
  (`frontend/src/styles.scss`) for a distinct Greek/Aegean look — sun/dark themed via a
  `data-theme` attribute on `<html>`. Add Material back in if you'd prefer its component
  library.
- **Train/bus/cruise/hotel providers are adapter templates, not finished
  integrations.** Their real-world APIs each have different schemas and typically
  require a signed partner contract to get credentials, so those four files give you a
  correctly-shaped place to plug a real provider in rather than a guess at request/
  response fields that might be wrong. Flights (Amadeus) and weather (OpenWeatherMap)
  are fully wired to their real, documented public APIs.

---

## 10. Troubleshooting

**"The database is not connected" on signup/login/game routes** — MongoDB isn't
reachable. Confirm it's running (`mongod` locally, or that your Atlas `MONGO_URI` is
correct and your IP is allowlisted in Atlas's Network Access settings), then restart
`npm run dev` in `backend/`.

**Frontend loads but every search/weather call fails** — make sure the backend is
running on port 4000 first (`npm run dev` in `backend/`), *then* start the frontend.
`ng serve`'s proxy only forwards to a server that's already listening.

**"CORS" errors in the browser console** — this only happens if you're hitting the
backend directly instead of through the Angular dev server's proxy. Always load the app
from `http://localhost:4200` (not 4000) during development.

**Port already in use** — change `PORT` in `backend/.env`, or stop whatever else is
using 4000/4200/27017.

---

## 11. Tech stack summary

- **Frontend:** Angular 21 (standalone components, signals, new `@if`/`@for` control
  flow), plain RxJS for HTTP + autocomplete debouncing, hand-rolled SCSS design system.
- **Backend:** Node.js + Express, Mongoose/MongoDB, JWT auth (`jsonwebtoken` + `bcryptjs`),
  `helmet` + `express-rate-limit` for basic hardening, `pdfkit` for itinerary PDF export.
- **AI:** OpenAI Node SDK (chat completions) for the Wayfinder chatbot and itinerary
  planner, with a fully-functional offline fallback.
