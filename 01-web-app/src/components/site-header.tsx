import { ARCHIVE_START, formatIndexDate, todayInArchiveTime } from "@/lib/dates";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-plate-black/80 border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-safelight shadow-[0_0_8px_#e8b057]" />
        <a
          href="/"
          className="font-display text-lg tracking-widest text-emulsion hover:text-safelight transition-colors duration-200"
        >
          Apogee
        </a>
      </div>

      <p className="font-mono text-[11px] tracking-widest text-slate-400 border border-white/10 px-2.5 py-1 rounded-[3px] bg-white/[0.02] hover:border-white/20 hover:text-slate-300 transition-colors duration-200">
        Archive · {formatIndexDate(ARCHIVE_START)} — {formatIndexDate(todayInArchiveTime())}
      </p>
    </header>
  );
}
