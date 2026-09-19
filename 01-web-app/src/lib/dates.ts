/**
 * Date handling for the plate archive.
 *
 * The important quirk: NASA publishes a new APOD on US Eastern time, not UTC
 * and certainly not on the visitor's clock. A visitor in Dubai (UTC+4) asking
 * for "today" just after midnight local is asking for a date that has not been
 * published yet, and the API answers 404. Every "today" in this app is
 * therefore Eastern time, which keeps the default view on a date that exists.
 */

/** The first Astronomy Picture of the Day. The archive has no plates before this. */
export const ARCHIVE_START = "1995-06-16";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date in US Eastern time, as YYYY-MM-DD. */
export function todayInArchiveTime(): string {
  // en-CA formats as YYYY-MM-DD, which is exactly the shape the API wants.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** True when the string is a real calendar date in YYYY-MM-DD form. */
export function isValidDateString(date: string): boolean {
  if (!DATE_PATTERN.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  // Rejects impossible dates that Date would otherwise roll over, e.g. 2026-02-31.
  return parsed.toISOString().slice(0, 10) === date;
}

/** True when the date exists and falls inside the published archive. */
export function isWithinArchive(date: string): boolean {
  if (!isValidDateString(date)) return false;
  return date >= ARCHIVE_START && date <= todayInArchiveTime();
}

/** Moves a date by a number of days, staying in YYYY-MM-DD. */
export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Pulls a date back inside the archive bounds. */
export function clampToArchive(date: string): string {
  const today = todayInArchiveTime();
  if (date < ARCHIVE_START) return ARCHIVE_START;
  if (date > today) return today;
  return date;
}

/** A uniformly random date from the archive. Powers the "random plate" control. */
export function randomArchiveDate(): string {
  const start = Date.parse(`${ARCHIVE_START}T00:00:00Z`);
  const end = Date.parse(`${todayInArchiveTime()}T00:00:00Z`);
  const span = Math.floor((end - start) / 86_400_000);
  return shiftDate(ARCHIVE_START, Math.floor(Math.random() * (span + 1)));
}

/**
 * The window of dates shown beneath the focal plate: the days immediately
 * preceding it, newest first, never running past the start of the archive.
 */
export function precedingWindow(date: string, size: number): { start: string; end: string } {
  const end = shiftDate(date, -1);
  const start = clampToArchive(shiftDate(date, -size));
  return { start, end };
}

/** "16 June 1995" — the catalogue's display form. */
export function formatLongDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** "1995.06.16" — the catalogue's index form, for mono data rows. */
export function formatIndexDate(date: string): string {
  return date.replace(/-/g, ".");
}

/**
 * A stable plate number derived from the date: how many days since the first
 * plate. Real, not decorative, and it matches the catalogue framing.
 */
export function plateNumber(date: string): number {
  const days = Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${ARCHIVE_START}T00:00:00Z`)) / 86_400_000,
  );
  return days + 1;
}
