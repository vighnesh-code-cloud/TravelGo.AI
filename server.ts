import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { checkModelStatus, loadLMStudioConfig, LMStudioError } from "./server/lmStudio";
import {
  extractTripDetails,
  generateTravelPlan,
  getMissingFields,
  normalizeParams,
  sanitizeMessages,
  toConfirmedTrip,
} from "./server/travelPlanner";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json());

// LM Studio (OpenAI-compatible) configuration
const lmStudio = loadLMStudioConfig();
console.log(`[LM Studio] Using model '${lmStudio.model}' at ${lmStudio.baseUrl}`);

const FRIENDLY_ERRORS: Record<string, { status: number; message: string }> = {
  UNREACHABLE: {
    status: 503,
    message: "⚠️ I couldn't reach the local AI model. Please make sure LM Studio is open, its local server is started, and try again.",
  },
  MODEL_NOT_LOADED: {
    status: 503,
    message: "⚠️ LM Studio is running, but the configured Gemma model isn't loaded. Please load the model in LM Studio and try again.",
  },
  TIMEOUT: {
    status: 504,
    message: "⏳ The AI model took too long to respond. It may still be loading — please try again in a moment.",
  },
  TRUNCATED: {
    status: 502,
    message: "⚠️ The AI model's response was cut off. Try increasing the model's context length in LM Studio (8192 or more) and try again.",
  },
  BAD_RESPONSE: {
    status: 502,
    message: "⚠️ The AI model returned an incomplete or malformed response. Please try again.",
  },
  HTTP_ERROR: {
    status: 502,
    message: "⚠️ The AI model returned an error. Please check the server console and try again.",
  },
};

function describeAIError(error: unknown): { code: string; status: number; message: string } {
  const code = error instanceof LMStudioError ? error.code : "BAD_RESPONSE";
  return { code, ...(FRIENDLY_ERRORS[code] || FRIENDLY_ERRORS.BAD_RESPONSE) };
}

// Health check for the LM Studio connection (details are only logged server-side)
app.get("/api/model/status", async (_req: Request, res: Response) => {
  const { detail, ...status } = await checkModelStatus(lmStudio);
  if (detail) console.warn(`[LM Studio] Status check: ${detail}`);
  res.json(status);
});

// Conversational step: extract and merge trip details, ask for anything missing
app.post("/api/chat", async (req: Request, res: Response) => {
  const messages = sanitizeMessages(req.body?.messages);
  const currentParams = normalizeParams(req.body?.currentParams);

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "INVALID_REQUEST", reply: "Missing or invalid 'messages' parameter." });
  }

  try {
    const result = await extractTripDetails(lmStudio, messages, currentParams);
    console.log(`[LM Studio] Chat turn processed. Missing: ${result.missingFields.join(", ") || "none"}`);
    return res.json({ ...result, travelPlan: null });
  } catch (error: any) {
    const { code, status, message } = describeAIError(error);
    console.error(`[LM Studio] Chat request failed (${code}): ${error?.message}`);
    return res.status(status).json({
      error: code,
      reply: message,
      isComplete: false,
      collectedData: currentParams,
      missingFields: getMissingFields(currentParams),
    });
  }
});

// Itinerary step: called after the user confirms the collected trip details
app.post("/api/itinerary", async (req: Request, res: Response) => {
  const params = normalizeParams(req.body?.params);
  const trip = toConfirmedTrip(params);

  if (!trip) {
    return res.status(400).json({
      error: "MISSING_TRIP_DETAILS",
      message: "Some trip details are missing. Please complete them in the chat before generating the itinerary.",
      missingFields: getMissingFields(params),
    });
  }

  const startedAt = Date.now();
  try {
    console.log(`[LM Studio] Generating ${trip.duration}-day itinerary for ${trip.destination}...`);
    const travelPlan = await generateTravelPlan(lmStudio, trip);
    console.log(`[LM Studio] Itinerary generated in ${Math.round((Date.now() - startedAt) / 1000)}s`);
    return res.json({ travelPlan });
  } catch (error: any) {
    const { code, status, message } = describeAIError(error);
    console.error(`[LM Studio] Itinerary generation failed (${code}): ${error?.message}`);
    return res.status(status).json({ error: code, message });
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
