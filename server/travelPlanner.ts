import type { DayItinerary, TravelParams, TravelPlan } from "../src/types";
import { chatCompletion, LMStudioConfig, LMStudioError } from "./lmStudio";

export const REQUIRED_FIELDS = ["destination", "budget", "duration", "travelers", "experience"] as const;
export type RequiredField = (typeof REQUIRED_FIELDS)[number];

const FIELD_QUESTIONS: Record<RequiredField, string> = {
  destination: "Where would you like to travel?",
  budget: "What is your total trip budget (in ₹ INR)?",
  duration: "How many days will the trip be?",
  travelers: "How many people are travelling?",
  experience: "What kind of experience do you prefer — e.g. Adventure, Relaxation, Sightseeing, Culture, Beaches, Mountains, Food?",
};

const MAX_DURATION = 30;
const MAX_TRAVELERS = 50;
const DAYS_PER_REQUEST = 3;

export class ItineraryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ItineraryValidationError";
  }
}

// ---------------------------------------------------------------------------
// Trip parameter normalisation
// ---------------------------------------------------------------------------

const USD_TO_INR = 83;
const EUR_TO_INR = 90;
const GBP_TO_INR = 105;

/** Parses budgets such as "₹1,25,000", "200000 rupees", "40k", "2 lakh", "$2000" into INR. */
export function parseBudgetAmount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
  if (typeof value !== "string") return null;
  const text = value.toLowerCase().replace(/,/g, "").trim();
  const match = text.match(/(\d+(?:\.\d+)?)\s*(k|thousand|l|lakh|lakhs|lac|lacs|cr|crore|crores|m|million)?\b/);
  if (!match) return null;
  let amount = parseFloat(match[1]);
  const unit = match[2];
  if (unit === "k" || unit === "thousand") amount *= 1_000;
  else if (unit && ["l", "lakh", "lakhs", "lac", "lacs"].includes(unit)) amount *= 100_000;
  else if (unit && ["cr", "crore", "crores"].includes(unit)) amount *= 10_000_000;
  else if (unit === "m" || unit === "million") amount *= 1_000_000;

  if (/\$|usd|dollar/.test(text)) amount *= USD_TO_INR;
  else if (/€|eur/.test(text)) amount *= EUR_TO_INR;
  else if (/£|gbp|pound/.test(text)) amount *= GBP_TO_INR;

  amount = Math.round(amount);
  return amount > 0 ? amount : null;
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function toPositiveInt(value: unknown, max: number): number | undefined {
  const n = typeof value === "string" ? parseInt(value, 10) : Number(value);
  if (!Number.isFinite(n)) return undefined;
  const int = Math.round(n);
  return int >= 1 && int <= max ? int : undefined;
}

/** Sanitises untrusted trip parameters (from the browser or the model). Invalid values are dropped. */
export function normalizeParams(raw: any): TravelParams {
  const params: TravelParams = {};
  if (!raw || typeof raw !== "object") return params;

  if (typeof raw.destination === "string") {
    const destination = raw.destination.trim().slice(0, 120);
    if (destination && !/^(null|none|unknown|n\/a)$/i.test(destination)) params.destination = destination;
  }
  const budget = parseBudgetAmount(raw.budget);
  if (budget) params.budget = formatINR(budget);

  const duration = toPositiveInt(raw.duration, MAX_DURATION);
  if (duration) params.duration = duration;

  const travelers = toPositiveInt(raw.travelers, MAX_TRAVELERS);
  if (travelers) params.travelers = travelers;

  const experienceList = Array.isArray(raw.experience)
    ? raw.experience
    : typeof raw.experience === "string"
      ? raw.experience.split(/[,&/]| and /i)
      : [];
  const experience = Array.from(
    new Set<string>(
      experienceList
        .filter((e: unknown): e is string => typeof e === "string")
        .map((e: string) => e.trim())
        .filter(Boolean)
        .map((e: string) => (e.charAt(0).toUpperCase() + e.slice(1)).slice(0, 40)),
    ),
  ).slice(0, 8);
  if (experience.length) params.experience = experience;

  return params;
}

/** Newer non-empty values win; previously collected values are never erased by missing ones. */
export function mergeParams(previous: TravelParams, next: TravelParams): TravelParams {
  const merged: TravelParams = { ...previous };
  for (const field of REQUIRED_FIELDS) {
    const value = next[field];
    if (Array.isArray(value) ? value.length > 0 : value !== undefined) {
      (merged as any)[field] = value;
    }
  }
  return merged;
}

export function getMissingFields(params: TravelParams): RequiredField[] {
  return REQUIRED_FIELDS.filter((field) => {
    const value = params[field];
    return Array.isArray(value) ? value.length === 0 : value === undefined || value === null || value === "";
  });
}

// ---------------------------------------------------------------------------
// Step 1: conversational extraction of trip details
// ---------------------------------------------------------------------------

const EXTRACTION_SYSTEM_PROMPT = `You are TravelGo.AI, a warm and concise AI travel assistant.
Your job in this step is ONLY to collect five trip details from the conversation:
1. destination - city, country or region (e.g. "Germany", "Goa", "Kyoto")
2. budget - TOTAL trip budget in Indian Rupees as a plain number string (e.g. "200000"). Convert other currencies (1 USD = 83 INR, 1 EUR = 90 INR). "40k" = "40000", "2 lakh" = "200000".
3. duration - number of days (integer)
4. travelers - number of people (integer). "solo"/"alone" = 1, "couple"/"me and my wife" = 2.
5. experience - list of preferred styles, e.g. ["Adventure"], ["Relaxation", "Sightseeing"], ["Culture"], ["Beaches"], ["Mountains"], ["Food"], ["Shopping"], ["Luxury"], ["Family"].

Rules:
- Extract every detail the user has given anywhere in the conversation. Keep details that are already known unless the user changes them.
- Use null (or [] for experience) only for details that are truly unknown.
- Do NOT write an itinerary in this step.
- Respond with JSON only.`;

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    destination: { type: ["string", "null"] },
    budget: { type: ["string", "null"] },
    duration: { type: ["integer", "null"] },
    travelers: { type: ["integer", "null"] },
    experience: { type: "array", items: { type: "string" }, maxItems: 6 },
  },
  required: ["destination", "budget", "duration", "travelers", "experience"],
  additionalProperties: false,
};

export interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

export function sanitizeMessages(raw: unknown): IncomingMessage[] | null {
  if (!Array.isArray(raw)) return null;
  return raw
    .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 2000) }))
    .slice(-16);
}

function parseModelJson(raw: string): any {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);
  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    throw new ItineraryValidationError(`Model output is not valid JSON (${err.message}): ${cleaned.slice(0, 200)}`);
  }
}

function describeKnown(params: TravelParams): string {
  return getMissingFields(params).length === REQUIRED_FIELDS.length ? "nothing yet" : JSON.stringify(params);
}

function describeField(field: RequiredField, params: TravelParams): string {
  switch (field) {
    case "destination": return `destination: ${params.destination}`;
    case "budget": return `budget: ${params.budget}`;
    case "duration": return `${params.duration} day${params.duration === 1 ? "" : "s"}`;
    case "travelers": return `${params.travelers} traveler${params.travelers === 1 ? "" : "s"}`;
    case "experience": return `${params.experience!.join(", ")} experience`;
  }
}

/** Acknowledges newly captured details and asks only for what is still missing. */
export function buildFollowUpReply(previous: TravelParams, current: TravelParams, missing: RequiredField[]): string {
  const newlyCaptured = REQUIRED_FIELDS.filter(
    (f) => !missing.includes(f) && JSON.stringify(previous[f]) !== JSON.stringify(current[f]),
  );
  const ack = newlyCaptured.length
    ? `Got it — ${newlyCaptured.map((f) => describeField(f, current)).join(", ")}. `
    : missing.length === REQUIRED_FIELDS.length
      ? ""
      : "Thanks! ";
  const questions = missing.map((f) => FIELD_QUESTIONS[f]);
  return `${ack}${questions.length > 1 ? "Just a few more details: " : ""}${questions.join(" ")}`;
}

export interface ExtractionResult {
  collectedData: TravelParams;
  missingFields: RequiredField[];
  isComplete: boolean;
  reply: string;
}

export async function extractTripDetails(
  config: LMStudioConfig,
  messages: IncomingMessage[],
  currentParams: TravelParams,
): Promise<ExtractionResult> {
  const transcript = messages.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
  const userPrompt = `Trip details already known: ${describeKnown(currentParams)}

Conversation so far:
${transcript}

Return the updated trip details as JSON.`;

  const raw = await chatCompletion(config, {
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    jsonSchema: { name: "trip_details", schema: EXTRACTION_SCHEMA },
    temperature: 0.2,
    maxTokens: 200,
  });

  const parsed = parseModelJson(raw);
  const collectedData = mergeParams(currentParams, normalizeParams(parsed));
  const missingFields = getMissingFields(collectedData);
  const isComplete = missingFields.length === 0;

  const reply = isComplete
    ? "Great, I have everything I need! Please review your trip details below and click OK to generate your itinerary."
    : buildFollowUpReply(currentParams, collectedData, missingFields);

  return { collectedData, missingFields, isComplete, reply };
}

// ---------------------------------------------------------------------------
// Step 2: itinerary generation (after the user confirms)
// ---------------------------------------------------------------------------

export interface ConfirmedTrip {
  destination: string;
  budgetAmount: number;
  duration: number;
  travelers: number;
  experience: string[];
}

export function toConfirmedTrip(params: TravelParams): ConfirmedTrip | null {
  if (getMissingFields(params).length) return null;
  return {
    destination: params.destination!,
    budgetAmount: parseBudgetAmount(params.budget)!,
    duration: params.duration!,
    travelers: params.travelers!,
    experience: params.experience!,
  };
}

const PLANNER_SYSTEM_PROMPT = `You are TravelGo.AI, an expert travel planner. Plan realistic trips that fit the traveller's total budget, group size, duration and preferred experiences.
- All amounts are rough estimates in Indian Rupees (INR) for the whole group, as integers.
- Never claim that prices, availability or bookings have been checked or reserved; these are planning estimates only.
- Use real, well-known places, attractions, dishes and areas for the destination.
- Keep every text field short (one sentence).
- Respond with JSON only.`;

function tripSummary(trip: ConfirmedTrip): string {
  return `Destination: ${trip.destination}
Total budget: ${formatINR(trip.budgetAmount)} for the whole group
Duration: ${trip.duration} days
Travelers: ${trip.travelers}
Preferred experience: ${trip.experience.join(", ")}`;
}

const str = { type: "string" };
const int = { type: "integer" };
const strList = (min: number, max: number) => ({ type: "array", items: str, minItems: min, maxItems: max });
const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const OVERVIEW_SCHEMA = obj({
  destinations: { type: "array", minItems: 1, maxItems: 2, items: obj({ name: str, description: str, reason: str, matchingScore: int }) },
  budgetBreakdown: obj({ transport: int, hotel: int, food: int, activities: int, shopping: int, emergency: int }),
  packingList: { type: "array", minItems: 2, maxItems: 4, items: obj({ category: str, items: strList(2, 6) }) },
  hiddenGems: { type: "array", minItems: 1, maxItems: 3, items: obj({ name: str, description: str }) },
  restaurants: { type: "array", minItems: 1, maxItems: 4, items: obj({ name: str, cuisine: str, priceRange: str, mustTry: str }) },
  mustTryFoods: { type: "array", minItems: 1, maxItems: 4, items: obj({ name: str, description: str }) },
  safetyTips: strList(1, 4),
  scamsToAvoid: strList(1, 3),
  transportationTips: strList(1, 4),
  weatherAdvice: str,
  bestVisitingHours: str,
  moneySavingTips: strList(1, 4),
});

const slotSchema = obj({ activity: str, attraction: str, food: str });

function daysSchema(count: number) {
  return obj({
    days: {
      type: "array",
      minItems: count,
      maxItems: count,
      items: obj({ day: int, title: str, morning: slotSchema, afternoon: slotSchema, evening: slotSchema, dailyExpense: int }),
    },
  });
}

function requireText(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim()) throw new ItineraryValidationError(`Missing text at ${path}`);
  return value.trim();
}

function requireAmount(value: unknown, path: string): number {
  const n = typeof value === "string" ? Number(value.replace(/[^\d.]/g, "")) : Number(value);
  if (!Number.isFinite(n) || n < 0) throw new ItineraryValidationError(`Invalid amount at ${path}`);
  return Math.round(n);
}

function requireList<T>(value: unknown, path: string, map: (item: any, i: number) => T, min = 1): T[] {
  if (!Array.isArray(value) || value.length < min) throw new ItineraryValidationError(`Expected at least ${min} item(s) at ${path}`);
  return value.map(map);
}

type Overview = Omit<TravelPlan, "destination" | "budget" | "duration" | "travelers" | "experience" | "itinerary">;

export function validateOverview(data: any, trip: ConfirmedTrip): Overview {
  if (!data || typeof data !== "object") throw new ItineraryValidationError("Overview is not an object");
  const b = data.budgetBreakdown || {};
  const categories = {
    transport: requireAmount(b.transport, "budgetBreakdown.transport"),
    hotel: requireAmount(b.hotel, "budgetBreakdown.hotel"),
    food: requireAmount(b.food, "budgetBreakdown.food"),
    activities: requireAmount(b.activities, "budgetBreakdown.activities"),
    shopping: requireAmount(b.shopping, "budgetBreakdown.shopping"),
    emergency: requireAmount(b.emergency, "budgetBreakdown.emergency"),
  };
  const estimatedCost = Object.values(categories).reduce((a, c) => a + c, 0);
  if (estimatedCost <= 0) throw new ItineraryValidationError("Budget breakdown is empty");

  const textList = (v: unknown, p: string) => requireList(v, p, (s, i) => requireText(s, `${p}[${i}]`));

  return {
    destinations: requireList(data.destinations, "destinations", (d, i) => ({
      name: requireText(d?.name, `destinations[${i}].name`),
      description: requireText(d?.description, `destinations[${i}].description`),
      reason: requireText(d?.reason, `destinations[${i}].reason`),
      matchingScore: Math.max(0, Math.min(100, Math.round(Number(d?.matchingScore) || 0))),
    })),
    budgetBreakdown: {
      ...categories,
      totalBudget: trip.budgetAmount,
      estimatedCost,
      remainingBudget: trip.budgetAmount - estimatedCost,
    },
    packingList: requireList(data.packingList, "packingList", (c, ci) => ({
      category: requireText(c?.category, `packingList[${ci}].category`),
      items: textList(c?.items, `packingList[${ci}].items`).map((name, ii) => ({ id: `pack-${ci}-${ii}`, name, packed: false })),
    })),
    hiddenGems: requireList(data.hiddenGems, "hiddenGems", (g, i) => ({
      name: requireText(g?.name, `hiddenGems[${i}].name`),
      description: requireText(g?.description, `hiddenGems[${i}].description`),
    })),
    restaurants: requireList(data.restaurants, "restaurants", (r, i) => ({
      name: requireText(r?.name, `restaurants[${i}].name`),
      cuisine: requireText(r?.cuisine, `restaurants[${i}].cuisine`),
      priceRange: requireText(r?.priceRange, `restaurants[${i}].priceRange`),
      mustTry: requireText(r?.mustTry, `restaurants[${i}].mustTry`),
    })),
    mustTryFoods: requireList(data.mustTryFoods, "mustTryFoods", (f, i) => ({
      name: requireText(f?.name, `mustTryFoods[${i}].name`),
      description: requireText(f?.description, `mustTryFoods[${i}].description`),
    })),
    safetyTips: textList(data.safetyTips, "safetyTips"),
    scamsToAvoid: textList(data.scamsToAvoid, "scamsToAvoid"),
    transportationTips: textList(data.transportationTips, "transportationTips"),
    weatherAdvice: requireText(data.weatherAdvice, "weatherAdvice"),
    bestVisitingHours: requireText(data.bestVisitingHours, "bestVisitingHours"),
    moneySavingTips: textList(data.moneySavingTips, "moneySavingTips"),
  };
}

export function validateDays(data: any, startDay: number, count: number): DayItinerary[] {
  const days = data?.days;
  if (!Array.isArray(days) || days.length !== count) {
    throw new ItineraryValidationError(`Expected ${count} day(s) starting at day ${startDay}, got ${Array.isArray(days) ? days.length : "none"}`);
  }
  const slot = (s: any, p: string) => ({
    activity: requireText(s?.activity, `${p}.activity`),
    attraction: requireText(s?.attraction, `${p}.attraction`),
    food: requireText(s?.food, `${p}.food`),
  });
  return days.map((d: any, i: number) => {
    const dayNumber = startDay + i;
    const p = `day ${dayNumber}`;
    return {
      day: dayNumber,
      title: requireText(d?.title, `${p}.title`),
      morning: slot(d?.morning, `${p}.morning`),
      afternoon: slot(d?.afternoon, `${p}.afternoon`),
      evening: slot(d?.evening, `${p}.evening`),
      dailyExpense: requireAmount(d?.dailyExpense, `${p}.dailyExpense`),
    };
  });
}

/** Runs a structured request, retrying once if the model output is malformed or incomplete. */
async function generateValidated<T>(
  label: string,
  run: () => Promise<string>,
  validate: (data: any) => T,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return validate(parseModelJson(await run()));
    } catch (err) {
      lastError = err;
      const retryable = err instanceof ItineraryValidationError || (err instanceof LMStudioError && err.code === "BAD_RESPONSE");
      console.warn(`[LM Studio] ${label} attempt ${attempt} failed: ${(err as Error).message}`);
      if (!retryable) break;
    }
  }
  throw lastError;
}

export async function generateTravelPlan(config: LMStudioConfig, trip: ConfirmedTrip): Promise<TravelPlan> {
  const summary = tripSummary(trip);

  const overview = await generateValidated(
    "overview",
    () =>
      chatCompletion(config, {
        messages: [
          { role: "system", content: PLANNER_SYSTEM_PROMPT },
          {
            role: "user",
            content: `${summary}

Create the trip overview:
- destinations: 1-2 areas/cities within ${trip.destination} that best match the preferences, with a matchingScore from 0-100.
- budgetBreakdown: split the total budget across transport, hotel, food, activities, shopping and emergency. The six amounts should add up to roughly ${formatINR(trip.budgetAmount)}.
- packingList, hiddenGems, restaurants, mustTryFoods, safetyTips, scamsToAvoid, transportationTips, weatherAdvice, bestVisitingHours, moneySavingTips.`,
          },
        ],
        jsonSchema: { name: "trip_overview", schema: OVERVIEW_SCHEMA },
        temperature: 0.5,
        maxTokens: 2000,
      }),
    (data) => validateOverview(data, trip),
  );

  const itinerary: DayItinerary[] = [];
  const perDayBudget = Math.round((overview.budgetBreakdown.estimatedCost - overview.budgetBreakdown.emergency) / trip.duration);

  for (let start = 1; start <= trip.duration; start += DAYS_PER_REQUEST) {
    const count = Math.min(DAYS_PER_REQUEST, trip.duration - start + 1);
    const end = start + count - 1;
    const previous = itinerary.length
      ? `Already planned: ${itinerary.map((d) => `Day ${d.day}: ${d.title}`).join("; ")}. Do not repeat these.`
      : "";
    const days = await generateValidated(
      `days ${start}-${end}`,
      () =>
        chatCompletion(config, {
          messages: [
            { role: "system", content: PLANNER_SYSTEM_PROMPT },
            {
              role: "user",
              content: `${summary}
Focus areas: ${overview.destinations.map((d) => d.name).join(", ")}
${previous}

Write the day-by-day plan for days ${start} to ${end} of ${trip.duration} (exactly ${count} day objects, numbered ${start}-${end}).
${start === 1 ? "Day 1 includes arrival. " : ""}${end === trip.duration ? `Day ${trip.duration} includes departure. ` : ""}Each day has a short title and morning/afternoon/evening slots with an activity, a specific attraction or place, and a food suggestion. dailyExpense is the estimated spend for the whole group that day (around ${formatINR(perDayBudget)}).`,
            },
          ],
          jsonSchema: { name: "itinerary_days", schema: daysSchema(count) },
          temperature: 0.6,
          maxTokens: 400 * count + 200,
        }),
      (data) => validateDays(data, start, count),
    );
    itinerary.push(...days);
  }

  return {
    destination: trip.destination,
    budget: trip.budgetAmount,
    duration: trip.duration,
    travelers: trip.travelers,
    experience: trip.experience,
    ...overview,
    itinerary,
  };
}
