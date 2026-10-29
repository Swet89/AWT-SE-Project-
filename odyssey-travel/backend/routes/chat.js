const express = require('express')
const mongoose = require('mongoose')
const Destination = require('../models/Destination')
const User = require('../models/User')
const authenticate = require('../middleware/authenticate')
const { handleConciergeChat } = require('../services/conciergeEngine')

const router = express.Router()

// Style-specific activity archetypes for itinerary generation
const styleThemes = {
  Adventure: [
    {
      title: 'Wild Trails & High Vantage Points',
      morning: 'Outdoor trek & scenic valley overlook',
      afternoon: 'Local adventure sports & nature expedition',
      evening: 'Campfire gathering or twilight mountain cafe',
    },
    {
      title: 'River Rapids & Forest Trails',
      morning: 'Riverside exploration or eco-trail walk',
      afternoon: 'Kayaking, rafting, or cycling circuit',
      evening: 'Rustic local diner tasting energy-rich specialties',
    },
    {
      title: 'Hidden Caves & Off-the-Beaten-Path',
      morning:
        'Early morning trail to historic rock shelters or waterfalls',
      afternoon: 'Guided geo-walk or safari excursion',
      evening: 'Sunset stargazing viewpoint',
    },
  ],

  Cultural: [
    {
      title: 'Living Heritage & Monarchy Chronicles',
      morning: 'Historic fort or palace architecture tour',
      afternoon: 'Heritage museum & royal archive gallery',
      evening: 'Traditional classical music or puppet theatre performance',
    },
    {
      title: 'Spiritual Sanctuaries & Sacred Ghats',
      morning: 'Ancient temple or cathedral pilgrimage walk',
      afternoon: 'Artisan craft bazaar & brass/textile workshops',
      evening:
        'Evening ceremonial lamps ceremony or serene riverside prayer',
    },
    {
      title: 'Folklore, Flavors & Historic Quarters',
      morning: 'Old quarter heritage walking tour with local storyteller',
      afternoon: 'Traditional library or historic community mansion',
      evening: 'Centuries-old family-run feast house',
    },
  ],

  Foodie: [
    {
      title: 'Dawn Markets & Heritage Breakfast',
      morning: 'Bustling morning farmer bazaar & iconic breakfast stall',
      afternoon: 'Regional spice discovery & cooking masterclass',
      evening: 'Vibrant street-food trail through historic market lanes',
    },
    {
      title: 'Slow Dining & Coastal/Farm Flavors',
      morning: 'Artisan bakery & specialty plantation cafe',
      afternoon: 'Culinary tasting menu highlighting generational recipes',
      evening: 'Rooftop cocktail/mocktail terrace overlooking old city',
    },
    {
      title: 'Sweet Delicacies & Tea Traditions',
      morning: 'Historic confectionery & traditional tea/coffee tasting',
      afternoon: 'Local food bazaar & snack sampling circuit',
      evening: 'Celebrated heritage dinner at landmark institution',
    },
  ],

  Relaxed: [
    {
      title: 'Tranquil Gardens & Slow Mornings',
      morning: 'Botanical garden stroll or serene lakefront boardwalk',
      afternoon: 'Art gallery cafe & leisurely reading nook',
      evening: 'Sunset promenade & gentle seaside/riverside breeze',
    },
    {
      title: 'Wellness & Mindfulness',
      morning: 'Gentle sunrise yoga or meditation overlook',
      afternoon: 'Ayurvedic or thermal spa & aromatic herbal tea garden',
      evening: 'Quiet terrace dinner with soft acoustic ambience',
    },
    {
      title: 'Scenic Horizons & Golden Hours',
      morning: 'Slow breakfast overlooking misty hills or calm waters',
      afternoon: 'Scenic country drive or ferry crossing',
      evening: 'Panoramic sunset view from historic lighthouse or bastion',
    },
  ],

  Budget: [
    {
      title: 'Free Walking Tours & Historic Gateways',
      morning: 'Self-guided historic monument & civic garden trail',
      afternoon: 'Student district lunch canteen & public art street',
      evening: 'Sunset hill public viewpoint with city panoramas',
    },
    {
      title: 'Public Bazaars & Community Squares',
      morning: 'Historic market alleys & architectural photography walk',
      afternoon: 'Community temple dining hall or street snack stall',
      evening: 'Lively town square buskers & vibrant night market',
    },
    {
      title: 'Nature Parks & Cultural Centers',
      morning: 'Public botanical reserve or coastline promenade',
      afternoon: 'Municipal heritage museum (free admission hours)',
      evening:
        'Riverside stairs listening to live folk street performers',
    },
  ],

  Balanced: [
    {
      title: 'Icons & Essential Landmarks',
      morning: 'Signature UNESCO monument or iconic city landmark',
      afternoon: 'Authentic local tavern lunch & craft exploration',
      evening: 'Lively bazaar stroll with sunset photography',
    },
    {
      title: 'Hidden Lanes & Local Pulse',
      morning: 'Quiet neighbourhood walking tour & heritage shrines',
      afternoon: 'Renowned regional eatery & artisan co-operative',
      evening: 'Waterfront sunset viewpoint & street snack sampling',
    },
    {
      title: 'Nature, Culture & Reflections',
      morning: 'Scenic natural viewpoint, garden, or valley walk',
      afternoon: 'Local market discovery for souvenirs & spices',
      evening: 'Farewell celebratory dinner with traditional music',
    },
  ],
}

// Generate a local itinerary using destination data and travel preferences
function buildSmartLocalItinerary({
  destination,
  days,
  dailyBudgetINR,
  travelStyle,
  request,
}) {
  const attractions = Array.isArray(destination.attractions)
    ? destination.attractions.filter(Boolean)
    : []

  const destinationName = destination.name
  const interests = (request || '').trim()
  const style = String(travelStyle || 'Balanced').trim()
  const themePool = styleThemes[style] || styleThemes.Balanced

  // Calculate estimated costs for each part of the day
  const dailyEstimate = Math.round(dailyBudgetINR * 0.82)
  const morningCost = Math.round(dailyEstimate * 0.35)
  const afternoonCost = Math.round(dailyEstimate * 0.40)
  const eveningCost = dailyEstimate - morningCost - afternoonCost

  // Build the activities for each day
  const planDays = Array.from({ length: days }, (_, index) => {
    const attraction = attractions.length
      ? attractions[index % attractions.length]
      : `${destinationName} Landmark`

    const archetype = themePool[index % themePool.length]
    const dayNumber = index + 1

    return {
      day: dayNumber,
      theme: `Day ${dayNumber}: ${archetype.title}`,

      activities: [
        {
          time: 'Morning (08:30 – 12:00)',
          place: attraction,
          description: `Begin your morning with ${attraction}. ${archetype.morning}. Arrive early to beat mid-day lines and capture the softest natural lighting.`,
          estimatedCostINR: morningCost,
        },
        {
          time: 'Afternoon (12:30 – 16:30)',
          place: `${destinationName} Central Quarter & Culinary Circuit`,
          description: `Savor regional dishes tailored to your focus: ${interests || 'authentic local specialities'}. ${archetype.afternoon}. Take time to rest out of peak heat.`,
          estimatedCostINR: afternoonCost,
        },
        {
          time: 'Evening (17:30 – 21:30)',
          place: `${destinationName} Sunset Point & Evening Promenade`,
          description: `${archetype.evening}. Conclude your evening soaking in the twilight atmosphere and vibrant local culture.`,
          estimatedCostINR: eveningCost,
        },
      ],
    }
  })

  // Calculate the total estimated cost of all activities
  const totalEstimatedCostINR = planDays.reduce(
    (total, day) =>
      total +
      day.activities.reduce(
        (sum, act) => sum + act.estimatedCostINR,
        0,
      ),
    0,
  )

  return {
    title: `${days}-Day Curated ${destinationName} ${style} Odyssey`,
    summary: `A carefully curated ${days}-day ${style.toLowerCase()} journey through ${destinationName}, designed around: "${interests || 'comprehensive exploration'}". Balanced between iconic monuments, authentic food, and relaxed evenings.`,
    days: planDays,
    totalEstimatedCostINR,
    budgetNote: `Estimated daily spend is ₹${dailyEstimate.toLocaleString('en-IN')} per traveler (~82% of target budget). Covers entrance fees, local transport, mid-range meals, and experiential activities. Excludes interstate travel & stays.`,
    source: 'Odyssey Smart Travel Engine',
  }
}

// Generate an itinerary using Google Gemini AI
// Requires GEMINI_API_KEY in the environment
async function generateGeminiItinerary({
  destination,
  days,
  dailyBudgetINR,
  travelStyle,
  request,
  apiKey,
}) {
  const prompt = `You are Odyssey Travel's master AI travel planner. Create an inspiring, highly realistic ${days}-day travel itinerary for ${destination.name}, ${destination.state || destination.country}.
Travel style: ${travelStyle}
Daily budget per person: ₹${dailyBudgetINR} INR
Special requests/interests: "${request}"
Top attractions available: ${(destination.attractions || []).join(', ')}.

Respond ONLY with valid JSON conforming to this exact schema (no markdown fences, no extra text):
{
  "title": "${days}-Day ${destination.name} ${travelStyle} Adventure",
  "summary": "2-3 sentences overview of this trip tailored to user preferences",
  "days": [
    {
      "day": 1,
      "theme": "Day 1 Theme Name",
      "activities": [
        {
          "time": "Morning (08:30 - 12:00)",
          "place": "Specific landmark or location name",
          "description": "Specific, practical traveler advice and what to experience",
          "estimatedCostINR": 1500
        },
        {
          "time": "Afternoon (12:30 - 16:30)",
          "place": "Specific restaurant, market or spot",
          "description": "Culinary suggestions and afternoon exploration",
          "estimatedCostINR": 1800
        },
        {
          "time": "Evening (17:30 - 21:00)",
          "place": "Evening viewpoint, walk, or dinner spot",
          "description": "Evening activities and sunset suggestions",
          "estimatedCostINR": 1200
        }
      ]
    }
  ],
  "totalEstimatedCostINR": 13500,
  "budgetNote": "Insightful budget guidance in 1-2 sentences."
}`

  // Send the itinerary prompt to the Gemini API
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini API responded with status ${response.status}`)
  }

  const result = await response.json()
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text

  if (!rawText) {
    throw new Error('Empty response from Gemini API')
  }

  const parsed = JSON.parse(rawText)
  parsed.source = 'Google Gemini AI'

  return parsed
}

// Generate an itinerary using OpenAI
// Requires OPENAI_API_KEY in the environment
async function generateOpenAIItinerary({
  destination,
  days,
  dailyBudgetINR,
  travelStyle,
  request,
  apiKey,
}) {
  const prompt = `You are Odyssey Travel's master AI travel planner. Create an inspiring, highly realistic ${days}-day travel itinerary for ${destination.name}, ${destination.state || destination.country}.
Travel style: ${travelStyle}
Daily budget per person: ₹${dailyBudgetINR} INR
Special requests/interests: "${request}"
Top attractions available: ${(destination.attractions || []).join(', ')}.

Respond ONLY with valid JSON conforming to this schema (no markdown, pure JSON):
{
  "title": "${days}-Day ${destination.name} ${travelStyle} Odyssey",
  "summary": "2-3 sentences overview",
  "days": [
    {
      "day": 1,
      "theme": "Day 1 Theme",
      "activities": [
        { "time": "Morning (08:30 - 12:00)", "place": "Specific spot", "description": "Practical tips", "estimatedCostINR": 1500 },
        { "time": "Afternoon (12:30 - 16:30)", "place": "Specific spot", "description": "Practical tips", "estimatedCostINR": 1800 },
        { "time": "Evening (17:30 - 21:00)", "place": "Specific spot", "description": "Practical tips", "estimatedCostINR": 1200 }
      ]
    }
  ],
  "totalEstimatedCostINR": 13500,
  "budgetNote": "Budget guidance"
}`

  // Send the itinerary prompt to the OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API responded with status ${response.status}`)
  }

  const result = await response.json()
  const content = result.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('Empty response from OpenAI')
  }

  const parsed = JSON.parse(content)
  parsed.source = `OpenAI (${process.env.OPENAI_MODEL || 'GPT-4o'})`

  return parsed
}

// Generate an itinerary using Anthropic Claude AI
// Requires ANTHROPIC_API_KEY in the environment
async function generateClaudeItinerary({
  destination,
  days,
  dailyBudgetINR,
  travelStyle,
  request,
  apiKey,
}) {
  const prompt = `You are Odyssey Travel's master AI travel planner. Create an inspiring, highly realistic ${days}-day travel itinerary for ${destination.name}, ${destination.state || destination.country}.
Travel style: ${travelStyle}
Daily budget per person: ₹${dailyBudgetINR} INR
Special requests/interests: "${request}"
Top attractions available: ${(destination.attractions || []).join(', ')}.

Respond ONLY with valid JSON conforming to this schema (no extra explanation, just valid JSON):
{
  "title": "${days}-Day ${destination.name} ${travelStyle} Journey",
  "summary": "2-3 sentences overview",
  "days": [
    {
      "day": 1,
      "theme": "Day 1 Theme",
      "activities": [
        { "time": "Morning (08:30 - 12:00)", "place": "Specific spot", "description": "Practical tips", "estimatedCostINR": 1500 },
        { "time": "Afternoon (12:30 - 16:30)", "place": "Specific spot", "description": "Practical tips", "estimatedCostINR": 1800 },
        { "time": "Evening (17:30 - 21:00)", "place": "Specific spot", "description": "Practical tips", "estimatedCostINR": 1200 }
      ]
    }
  ],
  "totalEstimatedCostINR": 13500,
  "budgetNote": "Budget guidance"
}`

  // Send the itinerary prompt to the Anthropic API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API responded with status ${response.status}`)
  }

  const result = await response.json()
  const content = result.content?.[0]?.text

  if (!content) {
    throw new Error('Empty response from Claude')
  }

  const parsed = JSON.parse(content)
  parsed.source = `Anthropic Claude AI`

  return parsed
}

// POST endpoint for generating a personalized travel itinerary
router.post('/itinerary', authenticate, async (req, res) => {
  try {
    const {
      destinationId,
      days,
      dailyBudgetINR,
      travelStyle,
      request,
    } = req.body

    // Validate the selected destination ID
    if (!mongoose.isValidObjectId(destinationId)) {
      return res.status(400).json({
        message: 'Please select a valid destination.',
      })
    }

    const numberOfDays = Number(days)
    const dailyBudget = Number(dailyBudgetINR)

    // Validate the number of travel days
    if (
      !Number.isInteger(numberOfDays) ||
      numberOfDays < 1 ||
      numberOfDays > 10
    ) {
      return res.status(400).json({
        message: 'Choose between 1 and 10 days.',
      })
    }

    // Validate the daily travel budget
    if (
      !Number.isFinite(dailyBudget) ||
      dailyBudget < 500 ||
      dailyBudget > 500000
    ) {
      return res.status(400).json({
        message: 'Enter a valid daily budget in rupees.',
      })
    }

    // Validate the user's travel request
    if (
      typeof request !== 'string' ||
      request.trim().length < 5 ||
      request.length > 1000
    ) {
      return res.status(400).json({
        message: 'Describe the trip you want in at least 5 characters.',
      })
    }

    // Retrieve the destination from MongoDB
    const destination = await Destination.findById(destinationId)

    if (!destination) {
      return res.status(404).json({
        message: 'Destination not found.',
      })
    }

    // Load the user's travel profile to personalize the itinerary
    const userDoc = await User.findById(req.auth.userId).select(
      'travelProfile name',
    )

    const userProfile = userDoc?.travelProfile || {}

    let itinerary = null

    // Try available AI providers in sequence: Gemini, OpenAI, then Claude
    const enrichedRequest = `${request}. (User Preferences - Dietary: ${userProfile.dietaryPreference || 'Any'}, Pace: ${userProfile.preferredPace || 'Moderate'}, Interests: ${(userProfile.interests || []).join(', ')})`

    const effectiveStyle =
      travelStyle || userProfile.travelStyle || 'Balanced'

    // Attempt itinerary generation with Google Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        itinerary = await generateGeminiItinerary({
          destination,
          days: numberOfDays,
          dailyBudgetINR: dailyBudget,
          travelStyle: effectiveStyle,
          request: enrichedRequest,
          apiKey: process.env.GEMINI_API_KEY,
        })
      } catch (geminiError) {
        console.warn(
          'Gemini AI failed, trying next provider:',
          geminiError.message,
        )
      }
    }

    // Attempt itinerary generation with OpenAI if needed
    if (!itinerary && process.env.OPENAI_API_KEY) {
      try {
        itinerary = await generateOpenAIItinerary({
          destination,
          days: numberOfDays,
          dailyBudgetINR: dailyBudget,
          travelStyle: effectiveStyle,
          request: enrichedRequest,
          apiKey: process.env.OPENAI_API_KEY,
        })
      } catch (openaiError) {
        console.warn(
          'OpenAI failed, trying next provider:',
          openaiError.message,
        )
      }
    }

    // Attempt itinerary generation with Anthropic Claude if needed
    if (!itinerary && process.env.ANTHROPIC_API_KEY) {
      try {
        itinerary = await generateClaudeItinerary({
          destination,
          days: numberOfDays,
          dailyBudgetINR: dailyBudget,
          travelStyle: effectiveStyle,
          request: enrichedRequest,
          apiKey: process.env.ANTHROPIC_API_KEY,
        })
      } catch (claudeError) {
        console.warn(
          'Claude failed, using Smart Engine fallback:',
          claudeError.message,
        )
      }
    }

    // Use the local Smart Travel Engine if no AI provider succeeds
    if (!itinerary) {
      itinerary = buildSmartLocalItinerary({
        destination,
        days: numberOfDays,
        dailyBudgetINR: dailyBudget,
        travelStyle:
          travelStyle || userProfile.travelStyle || 'Balanced',
        request,
      })
    }

    // Return the generated itinerary with destination details
    return res.json({
      destinationId: String(destination._id),
      destinationName: destination.name,
      ...itinerary,
    })
  } catch (error) {
    console.error('Itinerary generation error:', error.message)

    return res.status(500).json({
      message: 'Could not create the itinerary. Please try again.',
    })
  }
})

// POST endpoint for conversational AI travel assistance
router.post('/message', authenticate, async (req, res) => {
  try {
    const {
      message,
      conversationHistory = [],
      destinationId,
    } = req.body || {}

    // Validate the incoming chat message
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        message: 'Please provide a message.',
      })
    }

    const trimmedMsg = message.trim()

    // Retrieve the user's profile for personalized responses
    const userDoc = await User.findById(req.auth.userId).select(
      'name travelProfile',
    )

    const userProfile = userDoc?.travelProfile || {}

    // Retrieve optional destination information
    let destinationInfo = null

    if (destinationId && mongoose.isValidObjectId(destinationId)) {
      destinationInfo = await Destination.findById(destinationId)
    }

    // Use Gemini for live conversational responses when configured
    if (process.env.GEMINI_API_KEY) {
      try {
        const systemPrompt = `You are Odyssey AI, a sophisticated, knowledgeable, and empathetic luxury travel concierge and smart tourism planner.
User Name: ${userDoc?.name || 'Traveler'}
User Travel Profile: Style: ${userProfile.travelStyle || 'Balanced'}, Dietary: ${userProfile.dietaryPreference || 'None'}, Typical Budget/Day: ₹${userProfile.typicalBudgetPerDayINR || 5000}, Interests: ${(userProfile.interests || []).join(', ') || 'General'}, Past Trips: ${(userProfile.pastTrips || []).map((t) => t.destination).join(', ') || 'None reported'}.
${destinationInfo ? `Current Destination in Focus: ${destinationInfo.name}, ${destinationInfo.country}. Description: ${destinationInfo.description}. Highlights: ${(destinationInfo.attractions || []).join(', ')}. Nearest Airport: ${destinationInfo.nearestAirport}.` : ''}

Provide helpful, stylish, and practical travel answers. Give structured recommendations, packing tips, budget breakdown advice, or cultural etiquette when asked. Keep responses engaging and concise (2-4 paragraphs).`

        // Prepare the initial conversation context
        const contents = [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
          {
            role: 'model',
            parts: [
              {
                text: "Hello! I am your Odyssey AI Travel Concierge. How may I guide your upcoming voyage today?",
              },
            ],
          },
        ]

        // Add recent conversation history, limited to the last six turns
        if (Array.isArray(conversationHistory)) {
          for (const item of conversationHistory.slice(-6)) {
            if (item.sender === 'user') {
              contents.push({
                role: 'user',
                parts: [{ text: item.text }],
              })
            } else if (
              item.sender === 'assistant' ||
              item.sender === 'ai'
            ) {
              contents.push({
                role: 'model',
                parts: [{ text: item.text }],
              })
            }
          }
        }

        // Add the current user message
        contents.push({
          role: 'user',
          parts: [{ text: trimmedMsg }],
        })

        // Send the conversation to the Gemini API
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

        const geminiRes = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
            },
          }),
        })

        // Return the Gemini response when generation succeeds
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json()
          const reply =
            geminiData.candidates?.[0]?.content?.parts?.[0]?.text

          if (reply) {
            return res.json({
              reply,
              source: 'Google Gemini AI',
              suggestedActions: [
                'Plan 3-day itinerary here',
                'Find flights & hotels',
                'What are packing essentials?',
              ],
            })
          }
        }
      } catch (geminiError) {
        console.warn(
          'Conversational Gemini call failed:',
          geminiError.message,
        )
      }
    }

    // Fall back to the local concierge engine when Gemini is unavailable
    const localResult = await handleConciergeChat({
      message: trimmedMsg,
      conversationHistory,
      destinationId: destinationId || destinationInfo?._id,
      userDoc,
    })

    // Return the local concierge response
    return res.json({
      reply: localResult.reply,
      source: 'Odyssey Smart Concierge Engine',
      suggestedActions: localResult.suggestedActions,
    })
  } catch (error) {
    console.error('Chat message processing error:', error.message)

    return res.status(500).json({
      message: 'AI concierge is taking a brief rest. Please try again.',
    })
  }
})

// Export the router for use in the Express application
module.exports = router