/**
 * Server-only crypto helpers. Kept OUT of `lib/utils.js` (which is imported by
 * client components for `cn`) so `node:crypto` never lands in a client bundle.
 *
 * Used by the GitHub Project Analyzer (M7) to store a one-way sha256 of a
 * user-supplied Personal Access Token — the PAT itself is never persisted.
 */
import { createHash } from "node:crypto";

/** SHA-256 hex digest of a string. */
export function sha256(value) {
  return createHash("sha256").update(String(value ?? ""), "utf8").digest("hex");
}