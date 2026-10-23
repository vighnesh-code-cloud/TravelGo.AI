import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json());

// Gemma / Ollama Configuration
const GEMMA_API_URL = (process.env.GEMMA_API_URL || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
const GEMMA_MODEL = process.env.GEMMA_MODEL || "gemma3:4b";
const GEMMA_API_KEY = process.env.GEMMA_API_KEY || "";

console.log(`[Gemma AI] Initialized configuration: URL=${GEMMA_API_URL}, Model=${GEMMA_MODEL}`);

// System Instruction for Gemma AI Travel Agent
const SYSTEM_INSTRUCTION = `You are TravelGo.AI, a conversational, intelligent, and premium AI Travel Assistant powered by the Gemma model.
Your mission is to help the user plan their ultimate travel experience.

Analyze the user's messages and preceding conversation to extract these 5 essential travel parameters:
1. Destination (city, country, or region, e.g., "Paris", "Goa", "Kyoto", "Ladakh")
2. Budget (Total budget in Indian Rupees ₹ INR, e.g., 50000)
3. Duration (Number of days, e.g., 5)
4. Travelers (Number of people, e.g., 2)
5. Experience style (One or more of: Adventure, Beaches, Mountains, Nature, Food, Shopping, Luxury, Budget, Family, Solo)

CRITICAL RULES:
- If the user provides multiple parameters in a message (e.g., "Plan a 5-day adventure trip for 2 in Goa under 40k"), extract ALL of them immediately. Do not ask redundant questions.
- If any parameters are missing, ask for them naturally, warmly, and concisely. Keep responses engaging with a travel-buddy tone.
- Always use Indian Rupees (₹ INR) for budgets and estimates. Convert foreign currencies if mentioned (1 USD ≈ 83 INR, 1 EUR ≈ 90 INR).
- When ALL 5 parameters are collected (or the user explicitly says to skip questions and plan), set "isComplete" to true and generate a full, realistic "travelPlan".
- If not all 5 parameters are collected yet, set "isComplete" to false, leave "travelPlan" as null, and provide a helpful "reply".

REQUIRED JSON RESPONSE FORMAT:
You MUST respond with valid JSON only. Do not add conversational text outside the JSON object.
Schema:
{
  "isComplete": boolean,
  "collectedData": {
    "destination": string or null,
    "budget": string or null,
    "duration": number or null,
    "travelers": number or null,
    "experience": string[] or []
  },
  "reply": string,
  "travelPlan": null or {
    "destination": string,
    "budget": number,
    "duration": number,
    "travelers": number,
    "experience": string[],
    "destinations": [
      {
        "name": string,
        "description": string,
        "reason": string,
        "matchingScore": number
      }
    ],
    "itinerary": [
      {
        "day": number,
        "title": string,
        "morning": { "activity": string, "attraction": string, "food": string },
        "afternoon": { "activity": string, "attraction": string, "food": string },
        "evening": { "activity": string, "attraction": string, "food": string },
        "dailyExpense": number
      }
    ],
    "budgetBreakdown": {
      "transport": number,
      "hotel": number,
      "food": number,
      "activities": number,
      "shopping": number,
      "emergency": number,
      "totalBudget": number,
      "estimatedCost": number,
      "remainingBudget": number
    },
    "packingList": [
      {
        "category": string,
        "items": [
          { "id": string, "name": string, "packed": false }
        ]
      }
    ],
    "hiddenGems": [
      { "name": string, "description": string }
    ],
    "restaurants": [
      { "name": string, "cuisine": string, "priceRange": string, "mustTry": string }
    ],
    "mustTryFoods": [
      { "name": string, "description": string }
    ],
    "safetyTips": string[],
    "scamsToAvoid": string[],
    "transportationTips": string[],
    "weatherAdvice": string,
    "bestVisitingHours": string,
    "moneySavingTips": string[]
  }
}`;

/**
 * Helper to call Gemma through Ollama or OpenAI-compatible endpoint
 */
async function queryGemma(messages: Array<{ role: string; content: string }>, currentParams: any): Promise<string> {
  const conversationTranscript = messages
    .map(m => `${m.role === "user" ? "User" : "TravelGo.AI Assistant"}: ${m.content}`)
    .join("\n\n");

  const promptContent = `Current state of captured travel parameters:
${JSON.stringify(currentParams || {}, null, 2)}

Full conversation history:
${conversationTranscript}

Now analyze this history, update the captured parameters, determine if all 5 are present, and output the required JSON. Remember: Output ONLY raw JSON matching the required schema.`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (GEMMA_API_KEY) {
    headers["Authorization"] = `Bearer ${GEMMA_API_KEY}`;
  }

  // Detect whether this is an OpenAI-compatible endpoint or Ollama native API
  const isOpenAICompatible = GEMMA_API_URL.includes("/v1") || GEMMA_API_URL.includes("groq") || GEMMA_API_URL.includes("together") || GEMMA_API_URL.includes("openrouter");

  if (isOpenAICompatible) {
    // OpenAI Chat Completions standard
    const endpoint = GEMMA_API_URL.endsWith("/chat/completions")
      ? GEMMA_API_URL
      : `${GEMMA_API_URL}/chat/completions`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: GEMMA_MODEL,
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content: promptContent }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemma OpenAI endpoint error (${response.status}): ${errorText}`);
      }

      const data: any = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response received from Gemma OpenAI endpoint");
      }
      return content;
    } finally {
      clearTimeout(timeout);
    }
  }

  // Native Ollama API: POST /api/chat with fallback to /api/generate
  const ollamaChatEndpoint = `${GEMMA_API_URL}/api/chat`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(ollamaChatEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: GEMMA_MODEL,
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: promptContent }
        ],
        format: "json",
        stream: false,
        options: {
          temperature: 0.3,
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      // If 404 or unsupported endpoint, try Ollama /v1/chat/completions
      if (response.status === 404) {
        const altEndpoint = `${GEMMA_API_URL}/v1/chat/completions`;
        const altResponse = await fetch(altEndpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: GEMMA_MODEL,
            messages: [
              { role: "system", content: SYSTEM_INSTRUCTION },
              { role: "user", content: promptContent }
            ],
            temperature: 0.3,
          })
        });
        if (altResponse.ok) {
          const altData: any = await altResponse.json();
          return altData.choices?.[0]?.message?.content || "";
        }
      }
      const errText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    return data.message?.content || "";
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error(`Gemma model inference timed out after 60 seconds. Ollama may be loading model '${GEMMA_MODEL}' into memory.`);
    }
    throw err;
  }
}

/**
 * Extracts and validates JSON from Gemma output
 */
function parseGemmaOutput(rawText: string): any {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty response from Gemma model.");
  }

  let cleaned = rawText.trim();
  // Strip Markdown JSON codeblocks if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }

  // Find first { and last }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    throw new Error(`Failed to parse Gemma output as JSON: ${err.message}. Raw output: ${cleaned.slice(0, 200)}...`);
  }

  // Ensure root properties exist
  if (typeof parsed.isComplete !== "boolean") {
    parsed.isComplete = Boolean(parsed.travelPlan);
  }

  if (!parsed.reply || typeof parsed.reply !== "string") {
    parsed.reply = parsed.isComplete 
      ? "Here is your customized travel itinerary!" 
      : "Could you tell me a bit more about your travel plans?";
  }

  if (!parsed.collectedData || typeof parsed.collectedData !== "object") {
    parsed.collectedData = {};
  }

  // If complete, ensure travelPlan structure is safe and complete
  if (parsed.isComplete && parsed.travelPlan) {
    const plan = parsed.travelPlan;
    plan.destination = plan.destination || parsed.collectedData.destination || "Destination";
    plan.budget = Number(plan.budget) || 50000;
    plan.duration = Number(plan.duration) || 5;
    plan.travelers = Number(plan.travelers) || 2;
    plan.experience = Array.isArray(plan.experience) ? plan.experience : ["Travel"];
    plan.destinations = Array.isArray(plan.destinations) ? plan.destinations : [];
    plan.itinerary = Array.isArray(plan.itinerary) ? plan.itinerary : [];
    
    // Ensure budgetBreakdown exists
    if (!plan.budgetBreakdown || typeof plan.budgetBreakdown !== "object") {
      const b = plan.budget;
      plan.budgetBreakdown = {
        transport: Math.round(b * 0.25),
        hotel: Math.round(b * 0.35),
        food: Math.round(b * 0.18),
        activities: Math.round(b * 0.10),
        shopping: Math.round(b * 0.07),
        emergency: Math.round(b * 0.05),
        totalBudget: b,
        estimatedCost: b,
        remainingBudget: 0
      };
    }

    if (!Array.isArray(plan.packingList)) plan.packingList = [];
    if (!Array.isArray(plan.hiddenGems)) plan.hiddenGems = [];
    if (!Array.isArray(plan.restaurants)) plan.restaurants = [];
    if (!Array.isArray(plan.mustTryFoods)) plan.mustTryFoods = [];
    if (!Array.isArray(plan.safetyTips)) plan.safetyTips = [];
    if (!Array.isArray(plan.scamsToAvoid)) plan.scamsToAvoid = [];
    if (!Array.isArray(plan.transportationTips)) plan.transportationTips = [];
    if (!Array.isArray(plan.moneySavingTips)) plan.moneySavingTips = [];
    plan.weatherAdvice = plan.weatherAdvice || "Check local seasonal weather before departure.";
    plan.bestVisitingHours = plan.bestVisitingHours || "Early morning and late afternoon.";
  }

  return parsed;
}

// Health check endpoint for Gemma / Ollama status
app.get("/api/model/status", async (req: Request, res: Response) => {
  try {
    const isOpenAI = GEMMA_API_URL.includes("/v1");
    const checkEndpoint = isOpenAI ? `${GEMMA_API_URL}/models` : `${GEMMA_API_URL}/api/tags`;
    
    const headers: Record<string, string> = {};
    if (GEMMA_API_KEY) headers["Authorization"] = `Bearer ${GEMMA_API_KEY}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const testRes = await fetch(checkEndpoint, { headers, signal: controller.signal });
    clearTimeout(timeout);

    if (testRes.ok) {
      return res.json({
        status: "connected",
        endpoint: GEMMA_API_URL,
        model: GEMMA_MODEL,
        ready: true
      });
    }

    return res.json({
      status: "unreachable",
      endpoint: GEMMA_API_URL,
      model: GEMMA_MODEL,
      ready: false,
      message: `Endpoint returned HTTP ${testRes.status}`
    });
  } catch (err: any) {
    return res.json({
      status: "disconnected",
      endpoint: GEMMA_API_URL,
      model: GEMMA_MODEL,
      ready: false,
      message: err.message
    });
  }
});

// API Endpoint for Chat Analysis & Content Generation via Gemma
app.post("/api/chat", async (req: Request, res: Response) => {
  const { messages, currentParams } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing or invalid 'messages' parameter." });
  }

  try {
    console.log(`[Gemma AI] Request received with ${messages.length} messages. Calling ${GEMMA_MODEL} at ${GEMMA_API_URL}...`);
    
    const rawGemmaOutput = await queryGemma(messages, currentParams);
    const parsedResult = parseGemmaOutput(rawGemmaOutput);

    console.log(`[Gemma AI] Successfully parsed model response. isComplete=${parsedResult.isComplete}`);
    return res.json(parsedResult);

  } catch (error: any) {
    console.error("[Gemma AI] Error processing request:", error.message);

    // Provide structured error detailing why Gemma failed (e.g. Ollama connection or model not loaded)
    const isConnRefused = error.message?.includes("ECONNREFUSED") || error.message?.includes("fetch failed");
    const isTimeout = error.message?.includes("timed out");

    let userFriendlyReply = "⚠️ Unable to contact the Gemma model.";
    if (isConnRefused) {
      userFriendlyReply = `⚠️ Could not connect to Ollama at ${GEMMA_API_URL}. Please ensure your local Ollama server is running (e.g., run 'ollama run ${GEMMA_MODEL}' in your terminal) or configure GEMMA_API_URL.`;
    } else if (isTimeout) {
      userFriendlyReply = `⏳ The Gemma model took too long to respond. The model may be initializing in memory. Please send your message again in a moment.`;
    } else {
      userFriendlyReply = `⚠️ Gemma Error: ${error.message}`;
    }

    return res.status(503).json({
      error: "Gemma inference failed",
      reply: userFriendlyReply,
      details: error.message,
      endpoint: GEMMA_API_URL,
      model: GEMMA_MODEL,
      isComplete: false,
      collectedData: currentParams || {}
    });
  }
});

// Serve static assets in production, otherwise Vite handles them
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // Setup Vite development server middleware
  const startVite = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  };
  startVite();
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TravelGo.AI Server running at http://localhost:${PORT}`);
});
