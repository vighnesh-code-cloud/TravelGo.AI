/**
 * Minimal client for LM Studio's OpenAI-compatible Chat Completions API.
 * https://lmstudio.ai/docs/app/api/endpoints/openai
 */

export interface LMStudioConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
}

export type LMStudioErrorCode =
  | "UNREACHABLE"
  | "TIMEOUT"
  | "MODEL_NOT_LOADED"
  | "HTTP_ERROR"
  | "TRUNCATED"
  | "BAD_RESPONSE";

export class LMStudioError extends Error {
  constructor(public code: LMStudioErrorCode, message: string, public status?: number) {
    super(message);
    this.name = "LMStudioError";
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface JsonSchemaFormat {
  name: string;
  schema: Record<string, unknown>;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  jsonSchema?: JsonSchemaFormat;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export function loadLMStudioConfig(env: NodeJS.ProcessEnv = process.env): LMStudioConfig {
  const baseUrl = (env.LM_STUDIO_BASE_URL || "http://127.0.0.1:1234/v1")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/chat\/completions$/, "");
  const timeoutMs = Number(env.LM_STUDIO_TIMEOUT_MS);
  return {
    baseUrl,
    model: (env.LM_STUDIO_MODEL || "gemma-3-4b-it-qat").trim(),
    apiKey: (env.LM_STUDIO_API_KEY || "").trim(),
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 180000,
  };
}

function buildHeaders(config: LMStudioConfig): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;
  return headers;
}

const NETWORK_ERROR_CODES = new Set(["ECONNREFUSED", "ENOTFOUND", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH", "EAI_AGAIN", "UND_ERR_SOCKET"]);

function toLMStudioError(err: any, config: LMStudioConfig, timeoutMs: number): LMStudioError {
  if (err instanceof LMStudioError) return err;
  const causeCode = err?.cause?.code || err?.code;
  if (err?.name === "AbortError" || err?.name === "TimeoutError" || causeCode === "UND_ERR_HEADERS_TIMEOUT" || causeCode === "UND_ERR_BODY_TIMEOUT") {
    return new LMStudioError("TIMEOUT", `LM Studio did not respond within ${Math.round(timeoutMs / 1000)}s`);
  }
  if (NETWORK_ERROR_CODES.has(causeCode) || err?.message === "fetch failed") {
    return new LMStudioError("UNREACHABLE", `Cannot connect to LM Studio at ${config.baseUrl} (${causeCode || err?.message})`);
  }
  return new LMStudioError("BAD_RESPONSE", err?.message || String(err));
}

function looksLikeModelNotLoaded(status: number, body: string): boolean {
  const text = body.toLowerCase();
  return (
    status === 404 ||
    text.includes("no models loaded") ||
    text.includes("model not found") ||
    text.includes("not loaded") ||
    (text.includes("model") && (text.includes("not found") || text.includes("does not exist") || text.includes("failed to load")))
  );
}

export async function chatCompletion(config: LMStudioConfig, options: ChatCompletionOptions): Promise<string> {
  const timeoutMs = options.timeoutMs ?? config.timeoutMs;
  const body: Record<string, unknown> = {
    model: config.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.4,
    // Streaming keeps the connection active during long CPU generations, so Node's
    // built-in 300s fetch header timeout never applies; timeoutMs bounds the whole request.
    stream: true,
  };
  if (options.maxTokens) body.max_tokens = options.maxTokens;
  if (options.jsonSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: { name: options.jsonSchema.name, strict: true, schema: options.jsonSchema.schema },
    };
  }

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: buildHeaders(config),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw toLMStudioError(err, config, timeoutMs);
  }

  if (!response.ok) {
    let text = "";
    try {
      text = await response.text();
    } catch (err) {
      throw toLMStudioError(err, config, timeoutMs);
    }
    const snippet = text.slice(0, 500);
    if (looksLikeModelNotLoaded(response.status, text)) {
      throw new LMStudioError("MODEL_NOT_LOADED", `Model '${config.model}' is not available in LM Studio (HTTP ${response.status}): ${snippet}`, response.status);
    }
    throw new LMStudioError("HTTP_ERROR", `LM Studio returned HTTP ${response.status}: ${snippet}`, response.status);
  }

  let content = "";
  let finishReason: string | null = null;
  try {
    for await (const chunk of readServerSentEvents(response)) {
      if (chunk?.error) {
        const message = typeof chunk.error === "string" ? chunk.error : chunk.error?.message || JSON.stringify(chunk.error);
        if (looksLikeModelNotLoaded(400, message)) throw new LMStudioError("MODEL_NOT_LOADED", `Model '${config.model}' is not available in LM Studio: ${message}`);
        throw new LMStudioError("HTTP_ERROR", `LM Studio reported an error: ${message}`);
      }
      // LM Studio answers with whichever model is loaded when the requested ID is unknown
      if (typeof chunk?.model === "string" && !sameModel(chunk.model, config.model)) {
        throw new LMStudioError("MODEL_NOT_LOADED", `Requested model '${config.model}' but LM Studio responded with '${chunk.model}'`);
      }
      const choice = chunk?.choices?.[0];
      if (typeof choice?.delta?.content === "string") content += choice.delta.content;
      if (choice?.finish_reason) finishReason = choice.finish_reason;
    }
  } catch (err) {
    response.body?.cancel().catch(() => {});
    throw toLMStudioError(err, config, timeoutMs);
  }

  if (finishReason === "length") {
    throw new LMStudioError("TRUNCATED", "The model's response was cut off (finish_reason=length). Increase the model's context length in LM Studio.");
  }
  if (!content.trim()) {
    throw new LMStudioError("BAD_RESPONSE", "LM Studio returned an empty completion.");
  }
  return content;
}

function sameModel(actual: string, requested: string): boolean {
  const norm = (id: string) => id.toLowerCase().split("/").pop()!.replace(/@.*$/, "");
  return norm(actual) === norm(requested);
}

async function* readServerSentEvents(response: Response): AsyncGenerator<any> {
  if (!response.body) throw new LMStudioError("BAD_RESPONSE", "LM Studio returned an empty response body.");
  const decoder = new TextDecoder();
  let buffer = "";
  for await (const bytes of response.body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(bytes, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        yield JSON.parse(payload);
      } catch {
        throw new LMStudioError("BAD_RESPONSE", `LM Studio sent an unreadable stream chunk: ${payload.slice(0, 200)}`);
      }
    }
  }
}

export interface ModelStatus {
  ready: boolean;
  status: "ready" | "model_not_loaded" | "unreachable" | "error";
}

export async function checkModelStatus(config: LMStudioConfig): Promise<ModelStatus & { detail?: string }> {
  try {
    const res = await fetch(`${config.baseUrl}/models`, { headers: buildHeaders(config), signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { ready: false, status: "error", detail: `HTTP ${res.status}` };
    const data: any = await res.json();
    const ids: string[] = Array.isArray(data?.data) ? data.data.map((m: any) => String(m?.id)) : [];
    const available = ids.includes(config.model);
    return available
      ? { ready: true, status: "ready" }
      : { ready: false, status: "model_not_loaded", detail: `Model '${config.model}' not in [${ids.join(", ")}]` };
  } catch (err: any) {
    const e = toLMStudioError(err, config, 5000);
    return { ready: false, status: e.code === "UNREACHABLE" || e.code === "TIMEOUT" ? "unreachable" : "error", detail: e.message };
  }
}
