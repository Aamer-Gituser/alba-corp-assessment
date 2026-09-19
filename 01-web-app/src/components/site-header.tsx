import { ARCHIVE_START, formatIndexDate, todayInArchiveTime } from "@/lib/dates";

export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-plate-edge pb-4">
      <a
        href="/"
        className="font-display text-xl tracking-tight text-emulsion transition-colors hover:text-safelight"
      >
        Apogee
      </a>
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-graphite">
        Plate archive · {formatIndexDate(ARCHIVE_START)} — {formatIndexDate(todayInArchiveTime())}
      </p>
    </header>
  );
}
