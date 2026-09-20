/**
 * A single Astronomy Picture of the Day entry, as returned by NASA's APOD API.
 *
 * Fields NASA documents but does not always send are optional here on purpose:
 * `hdurl` is missing for video entries, `copyright` only exists when the image
 * is not public domain, and `thumbnail_url` only appears when we ask for it.
 */
export type Apod = {
  date: string; // YYYY-MM-DD
  title: string;
  explanation: string;
  media_type: "image" | "video" | string;
  url: string;
  hdurl?: string;
  thumbnail_url?: string;
  copyright?: string;
  service_version?: string;
};

/**
 * Every way a plate request can fail, as a closed set.
 *
 * The UI renders a different message and a different recovery action for each
 * kind, so failures stay actionable instead of collapsing into one generic
 * "something went wrong" screen.
 */
export type ApodError =
  | { kind: "rate_limited"; retryAfterSeconds?: number }
  | { kind: "not_found"; date: string }
  | { kind: "out_of_range"; date: string }
  | { kind: "invalid_date"; date: string }
  | { kind: "upstream"; status: number }
  | { kind: "network" }
  | { kind: "invalid_response" }
  | { kind: "configuration" }
  | { kind: "timeout" };

/**
 * Normalised plate model used by UI components.
 *
 * This decouples the UI from the raw NASA API shape so that changes to the
 * upstream format only require a single mapping step.
 */
export type Plate = {
  date: string;
  title: string;
  explanationText: string;
  mediaType: "image" | "video" | "other";
  imageUrl: string | null;
  sourceUrl: string;
  hdImageUrl: string | null;
  alt: string;
  creditText: string | null;
};

/**
 * Result instead of throw.
 *
 * Upstream failure is an expected outcome for this app, not an exception: NASA
 * rate-limits aggressively and the archive has real gaps. Modelling it as a
 * value forces every call site to handle it.
 */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApodError };

export const ok = <T,>(data: T): Result<T> => ({ ok: true, data });
export const err = <T,>(error: ApodError): Result<T> => ({ ok: false, error });

/** Human-readable copy for each failure kind, in the catalogue's voice. */
export function describeError(error: ApodError): {
  title: string;
  detail: string;
} {
  switch (error.kind) {
    case "rate_limited":
      return {
        title: "The archive is rate-limiting requests",
        detail: error.retryAfterSeconds
          ? `NASA asked us to wait ${error.retryAfterSeconds}s before trying again.`
          : "NASA caps how often its archive can be read. Try again shortly.",
      };
    case "not_found":
      return {
        title: "No plate was filed for this date",
        detail: `The archive has a gap on ${error.date}. Pick a nearby date.`,
      };
    case "out_of_range":
      return {
        title: "That date is outside the archive",
        detail: "Plates run from 16 June 1995 to today.",
      };
    case "invalid_date":
      return {
        title: "That date could not be read",
        detail: "Dates use the format YYYY-MM-DD.",
      };
    case "upstream":
      return {
        title: "NASA's archive is not responding",
        detail: `The upstream service returned ${error.status}. This is on their end.`,
      };
    case "network":
      return {
        title: "Could not reach the archive",
        detail: "Check your connection, then try again.",
      };
    case "invalid_response":
      return {
        title: "Upstream data could not be read",
        detail: "The archive returned an unrecognised format.",
      };
    case "configuration":
      return {
        title: "Service unavailable",
        detail: "Check the deployment configuration.",
      };
    case "timeout":
      return {
        title: "Archive took too long to respond",
        detail: "The request timed out. Try again shortly.",
      };
  }
}
