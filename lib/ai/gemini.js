/**
 * Shared Google Gemini client and helpers.
 *
 * Consolidates the five duplicate `new GoogleGenerativeAI(...)` +
 * `getGenerativeModel(...)` instantiations that previously lived in
 * actions/dashboard.js, actions/resume.js, actions/interview.js,
 * actions/cover-letter.js and lib/inngest/function.js.
 *
 * Also provides robust JSON parsing so a model that wraps its JSON in
 * markdown fences or appends trailing prose no longer crashes the page.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIServiceError } from "@/lib/errors";

// Google retires older Gemini models from the v1beta API over time
// (gemini-1.5-flash, then gemini-2.5-flash for new users). To avoid the app
// breaking each time, we try a chain of models and cache the first one that
// actually answers. If you set GEMINI_MODEL, it is tried first, then the
// chain is appended as a fallback.
const MODEL_CHAIN = [
  "gemini-3.5-flash", // newest stable flash — best quality
  "gemini-flash-latest", // alias to the current flash — future-proof
  "gemini-2.0-flash",
  "gemini-3.1-flash-lite", // lighter fallback
];

function resolveChain() {
  const override = process.env.GEMINI_MODEL?.trim();
  return override ? [override, ...MODEL_CHAIN] : MODEL_CHAIN;
}

let _client = null;
let _model = null;
let _resolvedName = null;

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new AIServiceError("AI is not configured. Set GEMINI_API_KEY.");
  }
  if (!_client) {
    _client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _client;
}

/**
 * Returns a cached, working model. Tries each model in the chain until one
 * successfully generates content, then caches it for subsequent calls. This
 * insulates the app from Google retiring/deprecating individual models.
 */
async function getWorkingModel() {
  if (_model) return _model;
  const client = getClient();
  const chain = resolveChain();
  const tried = [];

  for (const name of chain) {
    const model = client.getGenerativeModel({ model: name });
    try {
      // Cheap probe — confirms the model is both reachable and not gated.
      await model.generateContent("ok");
      _model = model;
      _resolvedName = name;
      console.info(`[NovaNest] Gemini model resolved: ${name}`);
      return _model;
    } catch (error) {
      tried.push(`${name}(${error?.message?.split("\n")[0] ?? "error"})`);
      // Continue to the next candidate.
    }
  }

  throw new AIServiceError(
    `No usable Gemini model. Tried: ${tried.join(" | ")}. Set GEMINI_MODEL to an available model.`
  );
}

/** @deprecated use getWorkingModel() — kept for any external callers. */
export function getGeminiModel() {
  return getClient().getGenerativeModel({ model: resolveChain()[0] });
}

/**
 * Extract the first balanced JSON object (or array) from a model response.
 * Strips ```json fences and any surrounding prose.
 */
export function parseJSONResponse(text) {
  if (text == null) {
    throw new AIServiceError("The AI service returned an empty response.");
  }

  let raw = String(text).trim();
  // Strip markdown code fences if present.
  raw = raw.replace(/^```(?:json|JSON)?\s*/m, "").replace(/```$/m, "").trim();

  // Fast path — already valid JSON.
  try {
    return JSON.parse(raw);
  } catch {
    // Fall through to balanced extraction.
  }

  const start = raw.search(/[[{]/);
  if (start === -1) {
    throw new AIServiceError("The AI response didn't contain valid JSON.");
  }

  const open = raw[start];
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        const slice = raw.slice(start, i + 1);
        try {
          return JSON.parse(slice);
        } catch {
          break;
        }
      }
    }
  }

  throw new AIServiceError("The AI response contained malformed JSON.");
}

/**
 * True if the error indicates the model is unavailable (retired/gated) or the
 * account is out of quota for it — i.e. worth trying a different model.
 */
function isModelUnavailable(error) {
  const msg = String(error?.message ?? "");
  return (
    msg.includes("404") ||
    msg.includes("not found") ||
    msg.includes("no longer available") ||
    msg.includes("not supported for generateContent") ||
    msg.includes("429") ||
    msg.includes("quota")
  );
}

/**
 * Generate text from a prompt. Returns the trimmed string.
 *
 * If the cached working model fails with an availability/quota error mid
 * session (Google retires models over time), the cache is cleared and the
 * chain is re-resolved once before giving up — so a retirement doesn't need
 * a server restart.
 */
export async function generateText(prompt) {
  try {
    const model = await getWorkingModel();
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() ?? "";
    return text.trim();
  } catch (error) {
    if (error instanceof AIServiceError) throw error;
    console.error("[NovaNest] Gemini generateText failed:", error?.message);

    // Re-resolve the chain once if the cached model became unavailable.
    if (isModelUnavailable(error) && _model) {
      console.warn("[NovaNest] Cached Gemini model unavailable; re-resolving chain.");
      _model = null;
      try {
        const model = await getWorkingModel();
        const result = await model.generateContent(prompt);
        const text = result?.response?.text?.() ?? "";
        return text.trim();
      } catch (retryError) {
        if (retryError instanceof AIServiceError) throw retryError;
        console.error("[NovaNest] Gemini generateText (retry) failed:", retryError?.message);
        throw new AIServiceError();
      }
    }

    throw new AIServiceError();
  }
}

/**
 * Generate JSON from a prompt. Returns the parsed object/array.
 */
export async function generateJSON(prompt) {
  const text = await generateText(prompt);
  return parseJSONResponse(text);
}