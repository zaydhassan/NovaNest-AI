import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIServiceError } from "@/lib/errors";

const MODEL_CHAIN = [
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-3.1-flash-lite",
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

async function getWorkingModel() {
  if (_model) return _model;
  const client = getClient();
  const chain = resolveChain();
  const tried = [];

  for (const name of chain) {
    const model = client.getGenerativeModel({ model: name });
    try {
      await model.generateContent("ok");
      _model = model;
      _resolvedName = name;
      console.info(`[NovaNest] Gemini model resolved: ${name}`);
      return _model;
    } catch (error) {
      tried.push(`${name}(${error?.message?.split("\n")[0] ?? "error"})`);
    }
  }

  throw new AIServiceError(
    `No usable Gemini model. Tried: ${tried.join(" | ")}. Set GEMINI_MODEL to an available model.`
  );
}

export function getGeminiModel() {
  return getClient().getGenerativeModel({ model: resolveChain()[0] });
}

export function parseJSONResponse(text) {
  if (text == null) {
    throw new AIServiceError("The AI service returned an empty response.");
  }

  let raw = String(text).trim();
  raw = raw.replace(/^```(?:json|JSON)?\s*/m, "").replace(/```$/m, "").trim();

  try {
    return JSON.parse(raw);
  } catch {
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

export async function generateText(prompt) {
  try {
    const model = await getWorkingModel();
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() ?? "";
    return text.trim();
  } catch (error) {
    if (error instanceof AIServiceError) throw error;
    console.error("[NovaNest] Gemini generateText failed:", error?.message);

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

export async function generateJSON(prompt) {
  const text = await generateText(prompt);
  return parseJSONResponse(text);
}

export async function* generateTextStream(prompt, { signal } = {}) {
  const streamOnce = async function* (model) {
    const result = await model.generateContentStream(prompt);
    for await (const chunk of result.stream) {
      if (signal?.aborted) return;
      const text = chunk?.text?.();
      if (text) yield text;
    }
  };

  try {
    const model = await getWorkingModel();
    yield* streamOnce(model);
    return;
  } catch (error) {
    if (error instanceof AIServiceError) throw error;
    console.error("[NovaNest] Gemini generateTextStream failed:", error?.message);

    if (isModelUnavailable(error) && _model) {
      console.warn("[NovaNest] Cached Gemini model unavailable; re-resolving chain (stream).");
      _model = null;
      try {
        const model = await getWorkingModel();
        yield* streamOnce(model);
        return;
      } catch (retryError) {
        if (retryError instanceof AIServiceError) throw retryError;
        console.error(
          "[NovaNest] Gemini generateTextStream (retry) failed:",
          retryError?.message
        );
      }
    }
  }

  const text = await generateText(prompt);
  if (text) yield text;
}