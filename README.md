# TravelGo.AI

AI travel-planning assistant. You chat with it about your trip and it builds a day-by-day itinerary with a budget breakdown, packing list, food suggestions and travel tips. Trips are saved in the browser's local storage.

The AI runs **locally** with **Google Gemma 3 4B Instruct (QAT, GGUF)** served by **[LM Studio](https://lmstudio.ai)** through its OpenAI-compatible Chat Completions API. All model calls go through the Node/Express backend (`server.ts`). The browser never talks to LM Studio directly.

## How it works

1. **Chat** (`POST /api/chat`): the backend asks Gemma to pull the trip details out of the conversation: destination, total budget (₹ INR), duration, number of travelers and preferred experience. The server merges them with details already collected, so nothing gets lost, and asks only for what's still missing.
2. **Confirm**: when all five details are known, the chat shows a confirmation card. Click **OK, Generate Itinerary** (or **Edit Details**).
3. **Generate** (`POST /api/itinerary`): the backend asks Gemma for a structured itinerary using LM Studio's `json_schema` structured output. It generates the overview first, then the days in small batches. Every response is checked before it reaches the UI, and a malformed response is retried once. Nothing is filled in with made-up data.
4. **Save**: the finished trip is saved once (per trip ID) to `localStorage` (`travelgo_trips`) with the full itinerary and the confirmed details. You can reopen it from **Saved Trips**, print it with **Print Itinerary**, or delete it.

If generation fails (LM Studio not running, model not loaded, timeout, cut-off or malformed output), the chat keeps your details and shows a **Retry** button.

`GET /api/model/status` reports whether LM Studio is reachable and the configured model is available.

## Run locally on Windows

### 1. Prerequisites
- [Node.js](https://nodejs.org) 20 or newer
- [LM Studio](https://lmstudio.ai) with **Gemma 3 4B Instruct QAT** downloaded (model identifier `gemma-3-4b-it-qat`)

### 2. Start the LM Studio server
1. Open LM Studio and go to the **Developer** tab.
2. Load `gemma-3-4b-it-qat`. In the load settings, set **Context Length** to **8192** or more. The default 4096 can cut off itinerary responses.
3. Click **Start Server**. It should be listening on `http://127.0.0.1:1234`.
4. Check it from PowerShell:
   ```powershell
   Invoke-RestMethod http://127.0.0.1:1234/v1/models
   ```
   The list should include `gemma-3-4b-it-qat`. If the identifier is different, put that value in `LM_STUDIO_MODEL`.

### 3. Configure and run TravelGo.AI
```powershell
git clone https://github.com/vighnesh-code-cloud/TravelGo.AI.git
cd TravelGo.AI
npm install
Copy-Item .env.example .env   # skip if you already have a .env, then just add the LM_STUDIO_* lines
npm run dev
```
Open http://localhost:3000.

`.env` settings (see `.env.example`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `LM_STUDIO_BASE_URL` | `http://127.0.0.1:1234/v1` | LM Studio OpenAI-compatible base URL |
| `LM_STUDIO_MODEL` | `gemma-3-4b-it-qat` | Model identifier as listed by `/v1/models` |
| `LM_STUDIO_TIMEOUT_MS` | `180000` | Per-request timeout (raise it on slow machines) |
| `LM_STUDIO_API_KEY` | _(empty)_ | Only if you enabled auth on the LM Studio server |
| `PORT` | `3000` | TravelGo.AI server port |

`.env` is git-ignored. Never commit it.

### 4. Quick checks
```powershell
# Is LM Studio reachable from the backend?
Invoke-RestMethod http://localhost:3000/api/model/status

# One chat turn
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/chat -ContentType 'application/json' -Body '{"messages":[{"role":"user","content":"I want to visit Germany. My budget is 200000 rupees. We are three people travelling for seven days, and we prefer adventure activities."}],"currentParams":{}}'
```

### Production build
```powershell
npm run build
$env:NODE_ENV="production"; npm start
```

### Troubleshooting
- **"I couldn't reach the local AI model"**: the LM Studio server isn't running, or `LM_STUDIO_BASE_URL` is wrong.
- **"the configured Gemma model isn't loaded"**: load the model in LM Studio, or fix `LM_STUDIO_MODEL`.
- **"response was cut off"**: increase the model's context length in LM Studio.
- **Timeouts**: the first request after loading is slower. Retry, or raise `LM_STUDIO_TIMEOUT_MS`.

Costs in generated itineraries are AI estimates. Prices, availability and bookings are not checked.
