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

      <footer className="mt-24 border-t border-white/[0.07] pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex flex-col gap-3">
            <p className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.25em] text-white/50">
              About this archive
            </p>
            <p className="max-w-md font-[family-name:var(--font-geist-sans)] text-xs leading-relaxed text-white/40">
              Apogee is a date-addressable archive of NASA&apos;s Astronomy Picture of the Day (APOD), curated for discovery and contemplation of the cosmos.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:text-right">
            <p className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.25em] text-white/50">
              Resources
            </p>
            <nav className="flex flex-col sm:items-end gap-1.5 text-xs">
              <a
                href="https://apod.nasa.gov"
                target="_blank"
                rel="noreferrer noopener"
                className="text-[--arctic] hover:text-[--arctic]/80 transition-colors font-[family-name:var(--font-geist-mono)]"
              >
                NASA APOD ↗
              </a>
              <a
                href="https://science.nasa.gov/apod"
                target="_blank"
                rel="noreferrer noopener"
                className="text-[--arctic] hover:text-[--arctic]/80 transition-colors font-[family-name:var(--font-geist-mono)]"
              >
                Science.NASA.gov ↗
              </a>
            </nav>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-white/[0.07]">
          <p className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.2em] text-white/30">
            Images courtesy NASA APOD · MIT License · Apogee Archive
          </p>
        </div>
      </footer>
    </div>
  );
}
