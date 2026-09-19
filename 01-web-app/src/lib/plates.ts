import type { Apod } from "./types";

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
  if (plate.media_type === "image") return plate.url ?? null;
  return plate.thumbnail_url ?? null;
}
