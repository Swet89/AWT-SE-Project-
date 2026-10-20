// Deterministic "demo mode" data generator shared by every provider.
//
// Any provider whose real API key is missing falls back to this. Results
// are seeded from the search params (not truly random) so a given search
// always returns the same options, which makes the demo feel stable and
// makes UI screenshots reproducible.

const CARRIERS = {
  flights: ['Ithaca Airlines', 'Argonaut Air', 'Aeolus Airways', 'Phaeacian Skyways'],
  trains: ['Poseidon Rail', 'Hermes Express', 'Ithacan Line', 'Nestor Rail'],
  buses: ['Cyclops Coach', "Circe's Charter", 'Laestrygonian Lines', 'Wanderer Bus Co.'],
  cruises: ['Argonaut Cruises', 'Wine-Dark Voyages', 'Calypso Cruise Co.', "Scylla & Charybdis Line"],
  hotels: ["Alcinous's Palace Hotel", 'Ithaca Grand', "Nestor's Inn", "Circe's Retreat"],
};

const CURRENCIES = ['USD', 'EUR', 'GBP'];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

// mulberry32 seeded PRNG — small, fast, good enough for demo data.
function seededRandom(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function randomTime(rand) {
  const h = Math.floor(rand() * 24);
  const m = Math.floor(rand() * 12) * 5;
  return `${pad(h)}:${pad(m)}`;
}

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function durationLabel(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function generateOptions(mode, params) {
  const { origin = '', destination, departDate = '' } = params;
  const seedStr = `${mode}|${origin}|${destination}|${departDate}`;
  const rand = seededRandom(hashString(seedStr));
  const carriers = CARRIERS[mode] || CARRIERS.flights;
  const count = 4;

  const results = [];
  for (let i = 0; i < count; i += 1) {
    const carrier = carriers[i % carriers.length];
    const currency = CURRENCIES[Math.floor(rand() * CURRENCIES.length)];
    const basePrice = mode === 'hotels' ? 60 : mode === 'cruises' ? 300 : 40;
    const priceSpread = mode === 'hotels' ? 240 : mode === 'cruises' ? 900 : 260;
    const price = Math.round(basePrice + rand() * priceSpread);

    if (mode === 'hotels') {
      results.push({
        id: `${mode}-${i}-${hashString(seedStr + i)}`,
        provider: 'Demo Lodging Network',
        carrier,
        from: 'Booking',
        to: destination,
        price,
        currency,
        notes: `${1 + Math.floor(rand() * 4)}-night stay near the harbor \u00b7 ${
          rand() > 0.5 ? 'Free cancellation' : 'Breakfast included'
        }`,
      });
      continue;
    }

    const departTime = randomTime(rand);
    const cruiseDays = 2 + Math.floor(rand() * 6);
    const durationMinutes =
      mode === 'flights'
        ? 60 + Math.floor(rand() * 600)
        : mode === 'cruises'
          ? 60 * 24 * cruiseDays
          : 60 + Math.floor(rand() * 480);
    const arriveTime =
      mode === 'cruises' ? departTime : addMinutes(departTime, durationMinutes);
    const stops = mode === 'flights' ? Math.floor(rand() * 3) : mode === 'trains' ? Math.floor(rand() * 2) : 0;

    results.push({
      id: `${mode}-${i}-${hashString(seedStr + i)}`,
      provider: 'Demo Travel Network',
      carrier,
      from: origin || 'Nearest hub',
      to: destination,
      departTime,
      arriveTime,
      duration: mode === 'cruises' ? `${cruiseDays} day${cruiseDays > 1 ? 's' : ''}` : durationLabel(durationMinutes),
      stops,
      price,
      currency,
      notes: mode === 'cruises' ? `${cruiseDays}-night voyage \u00b7 ${rand() > 0.5 ? 'All-inclusive dining' : 'Balcony cabin available'}` : undefined,
    });
  }

  return results.sort((a, b) => a.price - b.price);
}

module.exports = { generateOptions };
