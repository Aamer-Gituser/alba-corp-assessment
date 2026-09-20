import { ARCHIVE_START, formatIndexDate, todayInArchiveTime } from "@/lib/dates";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-plate-slate/95 backdrop-blur-xl border-b-2 border-safelight/40 px-6 py-5 flex items-center justify-between shadow-2xl">
      <div className="flex items-center gap-4">
        <div className="h-4 w-4 rounded-full bg-gradient-to-r from-safelight to-cyanotype animate-pulse shadow-lg shadow-safelight/50" />
        <a
          href="/"
          className="font-display text-3xl font-bold tracking-widest text-emulsion hover:text-safelight hover:drop-shadow-lg transition-all duration-300"
        >
          Apogee
        </a>
      </div>

      <div className="font-mono text-xs uppercase tracking-[0.3em] text-safelight bg-plate-black/60 border border-safelight/50 px-4 py-2.5 rounded-lg backdrop-blur-md hover:bg-safelight/10 hover:shadow-lg hover:shadow-safelight/30 transition-all duration-300">
        📡 Archive · {formatIndexDate(ARCHIVE_START)} — {formatIndexDate(todayInArchiveTime())}
      </div>
    </header>
  );
}
