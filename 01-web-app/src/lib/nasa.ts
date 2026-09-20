import "server-only";

import type { Apod, Result } from "./types";
import { err, ok } from "./types";
import { isValidDateString, isWithinArchive, todayInArchiveTime } from "./dates";
import { normalizeApod } from "./plates";

/**
 * The backend-for-frontend layer over NASA's APOD API.
 *
 * Everything in this module runs on the server. The `server-only` import above
 * turns any accidental import from a Client Component into a build error, so
 * the API key cannot reach the browser by mistake rather than by discipline.
 *
 * Three jobs:
 *   1. Hold the API key server-side.
 *   2. Cache by immutability — a plate from 2011 will never change, today's might.
 *   3. Survive NASA's rate limiting with bounded retries and honest failures.
 */

const APOD_ENDPOINT = "https://api.nasa.gov/planetary/apod";

/**
 * DEMO_KEY works without signup but is capped at 30 requests/hour/IP, which a
 * single archive page can exhaust. A personal key raises this to 1,000/hour.
 * Falling back keeps local development runnable with no setup.
 */
const API_KEY = process.env.NASA_API_KEY ?? "DEMO_KEY";

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 400;
const MAX_BACKOFF_MS = 4_000;

/** Historical plates have low churn but are not truly immutable; cache for 24h. */
const IMMUTABLE_TTL_SECONDS = 60 * 60 * 24;
/** Today's plate can still be revised or published late. Re-check periodically. */
const TODAY_TTL_SECONDS = 60 * 5;

/** Historical dates are immutable; today is not. */
function cacheTtlFor(date: string): number {
  return date === todayInArchiveTime() ? TODAY_TTL_SECONDS : IMMUTABLE_TTL_SECONDS;
}

/** Exponential backoff with jitter, so parallel retries do not synchronise. */
function backoffDelay(attempt: number): number {
  const exponential = Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS);
  return exponential + Math.random() * 150;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 429 and 5xx are worth retrying. 400 and 404 will answer the same way forever. */
function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

function buildUrl(params: Record<string, string>): string {
  const url = new URL(APOD_ENDPOINT);
  url.searchParams.set("api_key", API_KEY);
  // Asks NASA for a poster frame on video entries, which otherwise have no image.
  url.searchParams.set("thumbs", "true");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

/**
 * One upstream call, with bounded retries and a cache TTL chosen by the caller.
 *
 * Returns the parsed body on success. On failure it returns a typed error
 * rather than throwing, so callers must decide what the UI should say.
 */
/**
 * Parse a Retry-After header value into milliseconds.
 * Handles both integer-seconds ("120") and HTTP-date ("Fri, 01 Jan 2027 00:00:00 GMT").
 */
function parseRetryAfterMs(value: string | null): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  // Integer seconds
  if (/^\d+$/.test(trimmed)) {
    const ms = parseInt(trimmed, 10) * 1000;
    return Number.isFinite(ms) ? ms : null;
  }
  // HTTP-date format
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return Math.max(0, parsed - Date.now());
  }
  return null;
}

/** Validate raw JSON matches the expected Apod shape. */
async function requestApod<T>(
  params: Record<string, string>,
  ttlSeconds: number,
): Promise<Result<T>> {
  if (API_KEY === "DEMO_KEY" && process.env.NODE_ENV === "production") {
    console.warn("[nasa] DEMO_KEY in use in production — set NASA_API_KEY for a higher rate limit.");
  }

  let lastStatus = 0;
  const budgetStart = Date.now();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(buildUrl(params), {
        // Next's Data Cache. A cache hit never touches NASA, which is what keeps
        // the app inside the rate limit under normal traffic.
        next: { revalidate: ttlSeconds },
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      clearTimeout(timeoutHandle);

      if (response.ok) {
        const raw: unknown = await response.json();
        if (Array.isArray(raw)) {
          const normalized = raw.map(normalizeApod);
          if (!normalized.every((item): item is Apod => item !== null)) {
            return err({ kind: "invalid_response" });
          }
          return ok(normalized as T);
        } else {
          const normalized = normalizeApod(raw);
          if (!normalized) return err({ kind: "invalid_response" });
          return ok(normalized as T);
        }
      }

      lastStatus = response.status;

      if (response.status === 403) {
        return err({ kind: "configuration" });
      }

      if (response.status === 429) {
        const waitMs = parseRetryAfterMs(response.headers.get("retry-after"));
        // Out of attempts: surface the wait NASA asked for instead of hiding it.
        if (attempt === MAX_ATTEMPTS) {
          return err({
            kind: "rate_limited",
            retryAfterSeconds: waitMs != null ? Math.ceil(waitMs / 1000) : undefined,
          });
        }
        const effectiveWait = waitMs ?? backoffDelay(attempt);
        // If waiting would exhaust the total budget, give up immediately.
        if (Date.now() - budgetStart + effectiveWait > 12000) {
          return err({
            kind: "rate_limited",
            retryAfterSeconds: waitMs != null ? Math.ceil(waitMs / 1000) : undefined,
          });
        }
        await sleep(effectiveWait);
        continue;
      }

      if (response.status === 404) {
        return err({ kind: "not_found", date: params.date ?? "" });
      }

      if (response.status === 400) {
        // APOD answers 400 for dates before the archive starts or in the future.
        return err({ kind: "out_of_range", date: params.date ?? "" });
      }

      if (!isRetryable(response.status) || attempt === MAX_ATTEMPTS) {
        return err({ kind: "upstream", status: response.status });
      }

      const waitMs = backoffDelay(attempt);
      if (Date.now() - budgetStart + waitMs > 12000) return err({ kind: "timeout" });
      await sleep(waitMs);
    } catch (e) {
      clearTimeout(timeoutHandle);
      // AbortError means our timeout fired.
      if (e instanceof Error && e.name === "AbortError") {
        if (attempt === MAX_ATTEMPTS) return err({ kind: "timeout" });
        const waitMs = backoffDelay(attempt);
        if (Date.now() - budgetStart + waitMs > 12000) return err({ kind: "timeout" });
        await sleep(waitMs);
        continue;
      }
      // Network-level failure: DNS, TLS, socket reset, or a dropped connection.
      if (attempt === MAX_ATTEMPTS) return err({ kind: "network" });
      const waitMs = backoffDelay(attempt);
      if (Date.now() - budgetStart + waitMs > 12000) return err({ kind: "timeout" });
      await sleep(waitMs);
    }
  }

  return err(lastStatus ? { kind: "upstream", status: lastStatus } : { kind: "network" });
}

/** Fetches the plate for a single date, validating the date before spending a request. */
export async function getPlate(date: string): Promise<Result<Apod>> {
  if (!isValidDateString(date)) return err({ kind: "invalid_date", date });
  if (!isWithinArchive(date)) return err({ kind: "out_of_range", date });

  return requestApod<Apod>({ date }, cacheTtlFor(date));
}

/**
 * Fetches an inclusive range of plates, newest first.
 *
 * NASA returns ranges oldest-first and silently omits dates it has no plate
 * for, so the result is reversed here and callers must not assume a length.
 */
export async function getPlateRange(start: string, end: string): Promise<Result<Apod[]>> {
  if (!isValidDateString(start) || !isValidDateString(end)) {
    return err({ kind: "invalid_date", date: `${start}..${end}` });
  }
  if (start > end) return err({ kind: "invalid_date", date: `${start}..${end}` });
  if (!isWithinArchive(start) || !isWithinArchive(end)) {
    return err({ kind: "out_of_range", date: `${start}..${end}` });
  }

  // A range that includes today must follow today's shorter TTL, or a stale
  // response could pin the newest plate for a year.
  const ttl = end === todayInArchiveTime() ? TODAY_TTL_SECONDS : IMMUTABLE_TTL_SECONDS;

  const result = await requestApod<Apod[]>({ start_date: start, end_date: end }, ttl);
  if (!result.ok) return result;

  const plates = Array.isArray(result.data) ? result.data : [];
  return ok([...plates].sort((a, b) => b.date.localeCompare(a.date)));
}
