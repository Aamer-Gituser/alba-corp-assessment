import { NextResponse } from "next/server";

import { getPlateRange } from "@/lib/nasa";
import { describeError } from "@/lib/types";

/**
 * The only route the browser is allowed to call for archive data.
 *
 * The client never holds the NASA key and never talks to api.nasa.gov. It asks
 * this handler for a date range; the handler validates the range, calls the
 * cached BFF, and returns either plates or a typed error the UI can render.
 */

/** How many days a single request may ask for. Bounds the upstream cost. */
const MAX_RANGE_DAYS = 40;

/** Maps a failure kind to the HTTP status that honestly describes it. */
const STATUS_BY_ERROR_KIND: Record<string, number> = {
  rate_limited: 429,
  not_found: 404,
  out_of_range: 400,
  invalid_date: 400,
  upstream: 502,
  network: 504,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json(
      { error: { title: "Missing date range", detail: "Provide both start and end." } },
      { status: 400 },
    );
  }

  const spanDays =
    (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000;

  if (!Number.isFinite(spanDays) || spanDays < 0 || spanDays > MAX_RANGE_DAYS) {
    return NextResponse.json(
      {
        error: {
          title: "Range too wide",
          detail: `Ask for at most ${MAX_RANGE_DAYS} days at a time.`,
        },
      },
      { status: 400 },
    );
  }

  const result = await getPlateRange(start, end);

  if (!result.ok) {
    return NextResponse.json(
      { error: describeError(result.error), kind: result.error.kind },
      { status: STATUS_BY_ERROR_KIND[result.error.kind] ?? 500 },
    );
  }

  return NextResponse.json(
    { plates: result.data },
    {
      // The BFF already caches upstream. This lets Vercel's edge hold the
      // composed response too, and serve a stale copy while revalidating.
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400",
      },
    },
  );
}
