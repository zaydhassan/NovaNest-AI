/**
 * Centralized error types for server actions.
 *
 * Server actions should throw instances of AppError. The `toPublicMessage`
 * helper converts an unknown caught error into a safe, user-facing string
 * without leaking internals (SQL messages, stack traces, upstream API
 * payloads). Internal details are logged server-side only.
 */

export class AppError extends Error {
  constructor(message, { code = "APP_ERROR", status = 500, cause } = {}) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    if (cause !== undefined) this.cause = cause;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You must be signed in to do that.") {
    super(message, { code: "UNAUTHORIZED", status: 401 });
  }
}

export class UserNotFoundError extends AppError {
  constructor(message = "We couldn't find your account.") {
    super(message, { code: "USER_NOT_FOUND", status: 404 });
  }
}

export class ValidationError extends AppError {
  constructor(message = "The information you provided isn't valid.") {
    super(message, { code: "VALIDATION", status: 400 });
  }
}

export class RateLimitError extends AppError {
  constructor(message = "You're doing that a bit too fast. Please try again shortly.") {
    super(message, { code: "RATE_LIMIT", status: 429 });
  }
}

export class AIServiceError extends AppError {
  constructor(message = "The AI service is unavailable right now. Please try again.") {
    super(message, { code: "AI_SERVICE", status: 502 });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "We couldn't find what you were looking for.") {
    super(message, { code: "NOT_FOUND", status: 404 });
  }
}

/**
 * Convert any thrown value into a safe, user-facing message.
 * Internal details are logged but never returned to the client.
 */
export function toPublicMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error instanceof AppError) {
    return error.message;
  }
  // Never leak raw Error.message to the client — it may contain DB/AI internals.
  if (process.env.NODE_ENV !== "production") {
    console.error("[NovaNest] Internal error:", error);
  } else {
    console.error("[NovaNest] Internal error:", error?.name, error?.message);
  }
  return fallback;
}

/**
 * Wrap an async server action so that thrown errors are normalized to a
 * safe public message. Use for actions called from client components via
 * `useFetch` so toasts never leak internals.
 */
export function withErrorHandling(fn, fallback) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const message = toPublicMessage(error, fallback);
      const safe = new Error(message);
      safe.code = error instanceof AppError ? error.code : "INTERNAL";
      throw safe;
    }
  };
}