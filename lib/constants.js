/**
 * Shared non-action constants. Kept out of the `"use server"` action files
 * because Next.js forbids exporting anything but async functions from a
 * Server Action module.
 */

export const APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];