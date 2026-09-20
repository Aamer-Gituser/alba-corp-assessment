import { ARCHIVE_START, formatIndexDate, todayInArchiveTime } from "@/lib/dates";

export function SiteHeader() {
  return (
    <header className="observatory-chrome sticky top-0 z-40 border-b border-plate-edge/80 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-[3.5px] w-[3.5px] rounded-full bg-safelight/90 flex-shrink-0" />
        <a
          href="/"
          className="font-display text-lg tracking-widest text-emulsion hover:text-safelight transition-colors duration-200"
        >
          Apogee
        </a>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-graphite border border-white/5 bg-plate-black/40 px-3 py-1 rounded-[4px] hover:border-safelight/30 hover:text-emulsion transition-colors duration-200">
        Plate archive · {formatIndexDate(ARCHIVE_START)} — {formatIndexDate(todayInArchiveTime())}
      </p>
    </header>
  );
}
