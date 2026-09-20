import type { Apod } from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function safeUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function plainText(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Normalizes an upstream payload before it reaches the UI. */
export function normalizeApod(value: unknown): Apod | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const date = typeof item.date === "string" ? item.date : "";
  const title = plainText(item.title);
  const explanation = plainText(item.explanation);
  const mediaType = typeof item.media_type === "string" ? item.media_type : "";
  const sourceUrl = safeUrl(item.url);
  if (!DATE_PATTERN.test(date) || !title || !explanation || !mediaType || !sourceUrl) return null;

  const hdurl = safeUrl(item.hdurl);
  const thumbnailUrl = safeUrl(item.thumbnail_url);
  const copyright = plainText(item.copyright);
  return {
    date,
    title,
    explanation,
    media_type: mediaType,
    url: sourceUrl,
    ...(hdurl ? { hdurl } : {}),
    ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}),
    ...(copyright ? { copyright } : {}),
  };
}

/**
 * The best still image for a plate.
 *
 * Lives outside the server-only BFF because both the server-rendered focal
 * plate and the client-rendered archive grid need it. It touches no secret and
 * makes no network call, so sharing it costs nothing.
 *
 * Video entries have no `url` image at all; NASA supplies `thumbnail_url` only
 * because the request asked for thumbnails. Returning null lets the UI render a
 * deliberate placeholder instead of a broken image.
 */
export function posterImage(plate: Apod): string | null {
  if (plate.media_type === "image") return plate.hdurl ?? plate.url ?? null;
  return plate.thumbnail_url ?? null;
}
