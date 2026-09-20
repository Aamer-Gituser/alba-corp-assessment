import { ARCHIVE_START, formatIndexDate, todayInArchiveTime } from "@/lib/dates";

export function SiteHeader() {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(94%,1200px)] liquid-shield rounded-2xl px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 ring-2 ring-yellow-400/20 shadow-[0_0_12px_#ff9f0a]" />
        <a
          href="/"
          className="font-serif text-lg tracking-tight text-emulsion hover:text-cyan-300 transition-colors"
        >
          Apogee
        </a>
      </div>

      <p className="font-mono text-[11px] tracking-widest text-emulsion/90">
        {formatIndexDate(ARCHIVE_START)} ⇄ {formatIndexDate(todayInArchiveTime())}
      </p>
    </header>
  );
}
