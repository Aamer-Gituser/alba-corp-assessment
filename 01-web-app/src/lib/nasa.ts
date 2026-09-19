import "server-only";

import type { Apod, Result } from "./types";
import { err, ok } from "./types";
import { isValidDateString, isWithinArchive, todayInArchiveTime } from "./dates";

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

/** A plate that is already published can never change, so cache it for a year. */
const IMMUTABLE_TTL_SECONDS = 60 * 60 * 24 * 365;
/** Today's plate can still be revised or published late. Re-check periodically. */
const TODAY_TTL_SECONDS = 60 * 15;

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
async function requestApod<T>(
  params: Record<string, string>,
  ttlSeconds: number,
): Promise<Result<T>> {
  let lastStatus = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(buildUrl(params), {
        // Next's Data Cache. A cache hit never touches NASA, which is what keeps
        // the app inside the rate limit under normal traffic.
        next: { revalidate: ttlSeconds },
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        return ok((await response.json()) as T);
      }

      lastStatus = response.status;

      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after"));
        // Out of attempts: surface the wait NASA asked for instead of hiding it.
        if (attempt === MAX_ATTEMPTS) {
          return err({
            kind: "rate_limited",
            retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : undefined,
          });
        }
        // Honour Retry-After when present, but never block a request for minutes.
        const wait = Number.isFinite(retryAfter)
          ? Math.min(retryAfter * 1000, MAX_BACKOFF_MS)
          : backoffDelay(attempt);
        await sleep(wait);
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

      await sleep(backoffDelay(attempt));
    } catch {
      // Network-level failure: DNS, TLS, socket reset, or a dropped connection.
      if (attempt === MAX_ATTEMPTS) return err({ kind: "network" });
      await sleep(backoffDelay(attempt));
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

