"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  ARCHIVE_START,
  clampToArchive,
  formatIndexDate,
  plateNumber,
  randomArchiveDate,
  shiftDate,
  todayInArchiveTime,
} from "@/lib/dates";

type SiteHeaderProps = {
  date: string;
};

export function SiteHeader({ date }: SiteHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const today = todayInArchiveTime();
  const goTo = (next: string) => {
    const target = clampToArchive(next);
    if (target === date) return;
    startTransition(() => router.push(`/?date=${target}`, { scroll: false }));
  };

  const atStart = date <= ARCHIVE_START;
  const atEnd = date >= today;

  return (
    <header className="fixed top-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="vision-dock pointer-events-auto rounded-full px-5 py-2.5 flex items-center justify-between gap-6 md:gap-10 w-full max-w-5xl">

        {/* Brand: Apogee with Cosmic Beacon */}
        <div className="flex items-center gap-3 min-w-fit">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 shadow-[0_0_10px_#ff9f0a]"></span>
          </span>
          <a
            href="/"
            className="font-serif text-lg tracking-wide text-white hover:text-cyan-300 transition-colors duration-200 font-medium"
          >
            Apogee
          </a>
        </div>

        {/* Integrated Navigation Pod */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] rounded-lg border border-white/[0.1]">
          <ControlButton
            label="Previous day"
            disabled={atStart}
            onClick={() => goTo(shiftDate(date, -1))}
            aria-label="Previous plate"
          >
            ←
          </ControlButton>

          <label className="relative px-2 py-1">
            <span className="sr-only">Choose a date to travel to</span>
            <input
              type="date"
              value={date}
              min={ARCHIVE_START}
              max={today}
              onChange={(e) => e.target.value && goTo(e.target.value)}
              className="[color-scheme:dark] cursor-pointer font-mono text-xs text-cyan-300/90 bg-transparent px-1 rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
            />
          </label>

          <ControlButton
            label="Next day"
            disabled={atEnd}
            onClick={() => goTo(shiftDate(date, 1))}
            aria-label="Next plate"
          >
            →
          </ControlButton>

          <ControlButton
            label="Today"
            disabled={atEnd}
            onClick={() => goTo(today)}
            className="text-xs font-mono text-zinc-300 hover:text-white"
          >
            Today
          </ControlButton>

          <ControlButton
            label="Random plate"
            onClick={() => goTo(randomArchiveDate())}
            className="vision-btn-amber text-xs font-mono font-semibold"
          >
            🎲
          </ControlButton>
        </div>

        {/* Archive Telemetry Pill */}
        <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-zinc-300 ml-auto min-w-fit">
          <span className="text-cyan-400/80">Plate</span>
          <span>{plateNumber(date).toLocaleString("en-GB")}</span>
        </div>

        {/* Loading Indicator */}
        {isPending && (
          <span className="absolute left-1/2 -translate-x-1/2 bottom-1 text-[10px] font-mono tracking-widest text-amber-400">
            ⏳
          </span>
        )}
      </div>
    </header>
  );
}

function ControlButton({
  label,
  disabled,
  onClick,
  children,
  className,
  ...props
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={className || "vision-btn w-8 h-8 rounded-lg flex items-center justify-center text-sm"}
      {...props}
    >
      {children}
    </button>
  );
}
