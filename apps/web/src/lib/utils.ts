import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts a human-readable message from an API error.
 * Handles Axios error shapes returned by the backend's AllExceptionsFilter.
 */
export function extractApiError(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const e = err as Record<string, unknown>;
  const response = e["response"] as Record<string, unknown> | undefined;
  if (!response) return null;
  const body = response["data"] as Record<string, unknown> | undefined;
  if (!body) return null;
  const msg = body["message"];
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg)) return msg.join("; ");
  return null;
}

/**
 * Converts a date-only string (YYYY-MM-DD from an <input type="date">)
 * to a UTC midnight ISO string, avoiding local-timezone shifts.
 */
export function dateInputToUTC(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}
