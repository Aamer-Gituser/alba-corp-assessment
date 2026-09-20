import { FocalPlate } from "@/components/focal-plate";
import { ArchiveStrip } from "@/components/archive-strip";
import { ErrorNotice } from "@/components/notices";
import { SiteHeader } from "@/components/site-header";
import { clampToArchive, isValidDateString, precedingWindow, todayInArchiveTime } from "@/lib/dates";
import { getPlate, getPlateRange } from "@/lib/nasa";

const ARCHIVE_PAGE_SIZE = 8;

/**
 * The archive, composed on the server.
 *
 * The date comes from the URL, making every view addressable. An invalid or
 * out-of-range date silently falls back to today rather than erroring: a bad
 * link should still show someone the cosmos.
 */
export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: requested } = await searchParams;

  const focalDate =
    requested && isValidDateString(requested)
      ? clampToArchive(requested)
      : todayInArchiveTime();

  const window = precedingWindow(focalDate, ARCHIVE_PAGE_SIZE);

  // Both requests go out together; the grid must not wait on the focal plate.
  const [plateResult, archiveResult] = await Promise.all([
    getPlate(focalDate),
    getPlateRange(window.start, window.end),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1120px] px-5 pb-8 sm:px-8 sm:pb-12 pt-[84px]">
      <SiteHeader date={focalDate} />

      {plateResult.ok ? (
        <FocalPlate plate={plateResult.data} />
      ) : (
        <ErrorNotice error={plateResult.error} />
      )}

      <ArchiveStrip
        focalDate={focalDate}
        initialPlates={archiveResult.ok ? archiveResult.data : []}
        archiveError={archiveResult.ok ? undefined : archiveResult.error}
      />

      <footer className="mt-20 border-t border-plate-edge pt-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-graphite">
          Images courtesy NASA APOD ·{" "}
          <a
            href="https://apod.nasa.gov/apod/astropix.html"
            target="_blank"
            rel="noreferrer noopener"
            className="text-safelight transition-colors hover:underline"
          >
            Source archive ↗
          </a>
        </p>
      </footer>
    </div>
  );
}
