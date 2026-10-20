// AI chatbot + itinerary planner. Uses the official OpenAI Node SDK when
// OPENAI_API_KEY is set; otherwise falls back to a deterministic, themed
// canned response so the chatbot UI is fully testable without any key.

let OpenAI;
try {
  // Optional at require-time so the app still boots if the package were removed.
  OpenAI = require('openai');
} catch {
  OpenAI = null;
}

function getClient() {
  if (!OpenAI || !process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const SYSTEM_PROMPT = `You are "The Wayfinder", the AI travel concierge for Odyssey Travel,
a Homer's-Odyssey-themed trip planning site. Be warm, concise, and practical. You may use
light, tasteful Odyssey/Greek-mythology flavor in your phrasing, but always prioritize
genuinely useful, accurate travel advice over the theme. Keep replies under ~120 words
unless the user asks for detail.`;

async function chat(message, history = []) {
  const client = getClient();
  if (!client) {
    return { reply: cannedReply(message), demoMode: true };
  }

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: 300,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    return { reply: reply || cannedReply(message), demoMode: false };
  } catch (err) {
    console.warn('[chatbot] OpenAI call failed, falling back to canned reply:', err.message);
    return { reply: cannedReply(message), demoMode: true };
  }
}

function cannedReply(message) {
  return (
    `The Oracle is resting (no OPENAI_API_KEY configured), but here's a plain answer: ` +
    `for "${message.slice(0, 80)}", I'd suggest checking the search bar above for live ` +
    `routes and prices, and the hot suggestions for inspiration. Add an OpenAI key in the ` +
    `backend .env to unlock full conversational planning.`
  );
}

async function planItinerary({ destination, days, interests, startDate }) {
  const dayCount = Math.min(Math.max(Number(days) || 5, 1), 21);
  const client = getClient();

  if (client) {
    try {
      const prompt = `Create a ${dayCount}-day travel itinerary for ${destination}.
Traveler interests: ${interests || 'general sightseeing'}.
${startDate ? `Trip starts ${startDate}.` : ''}
Respond ONLY with strict JSON, no markdown fences, matching this TypeScript type:
{ "summary": string, "days": { "day": number, "title": string, "activities": string[] }[] }
Keep each day to 3-5 short activity strings.`;

      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: 900,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.days) && parsed.days.length > 0) {
        return { destination, summary: parsed.summary || '', days: parsed.days, demoMode: false };
      }
    } catch (err) {
      console.warn('[itinerary] OpenAI call failed, falling back to template plan:', err.message);
    }
  }

  return { destination, ...templateItinerary(destination, dayCount, interests), demoMode: true };
}

function templateItinerary(destination, dayCount, interests) {
  const themes = [
    'Arrival & first wander',
    'Old town & landmarks',
    'Coastline & viewpoints',
    'Local food crawl',
    'Museum & history day',
    'Day trip out of town',
    'Markets & souvenirs',
    'Slow morning, big sunset',
  ];
  const days = Array.from({ length: dayCount }, (_, i) => ({
    day: i + 1,
    title: themes[i % themes.length],
    activities: [
      `Explore a highlight of ${destination}`,
      interests ? `Something tied to: ${interests}` : 'A locally recommended spot',
      i % 2 === 0 ? 'Relaxed lunch by the water' : 'Evening stroll through the old streets',
    ],
  }));

  return {
    summary: `A template ${dayCount}-day outline for ${destination}. Add OPENAI_API_KEY in the backend .env for a fully AI-generated, personalized plan.`,
    days,
  };
}

module.exports = { chat, planItinerary };
