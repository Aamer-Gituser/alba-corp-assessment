"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  ARCHIVE_START,
  clampToArchive,
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
    <header className="masthead bg-[#06070a]/90 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50">
      <div className="max-w-[1120px] mx-auto px-6 sm:px-8 h-[52px] flex items-center justify-between">

        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-[family-name:var(--font-fraunces)] text-lg tracking-[0.25em] uppercase text-white hover:text-[--text-1] transition-colors"
        >
          A P O G E E
          <span className="inline-block w-[5px] h-[5px] rounded-full bg-[#e8b057] shadow-[0_0_10px_#e8b057] animate-pulse" aria-hidden />
        </Link>

        {/* Date navigation — VisionOS instrument dock */}
        <div className="hidden sm:block">
          <div className="vision-dock px-4 py-1.5 flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous plate"
              disabled={atStart}
              onClick={() => goTo(shiftDate(date, -1))}
              className="w-7 h-7 flex items-center justify-center text-sm text-white/60 hover:text-white hover:bg-white/10 active:scale-95 rounded-full transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ←
            </button>

            <label className="relative">
              <span className="sr-only">Choose a date to travel to</span>
              <input
                type="date"
                value={date}
                min={ARCHIVE_START}
                max={today}
                onChange={(e) => e.target.value && goTo(e.target.value)}
                className="[color-scheme:dark] cursor-pointer font-[family-name:var(--font-geist-mono)] text-xs text-[--arctic] bg-transparent px-2 py-1 rounded border-0 focus:outline-none focus:ring-1 focus:ring-[--arctic]/40"
              />
            </label>

            <button
              type="button"
              aria-label="Next plate"
              disabled={atEnd}
              onClick={() => goTo(shiftDate(date, 1))}
              className="w-7 h-7 flex items-center justify-center text-sm text-white/60 hover:text-white hover:bg-white/10 active:scale-95 rounded-full transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              →
            </button>

            <div className="w-px h-4 bg-white/10" aria-hidden />

            <button
              type="button"
              aria-label="Go to today"
              disabled={atEnd}
              onClick={() => goTo(today)}
              className="px-2.5 py-1 text-[11px] font-[family-name:var(--font-geist-mono)] text-white/50 hover:text-[#e8b057] hover:border-[#e8b057]/40 border border-transparent rounded-full transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Today
            </button>

            <button
              type="button"
              aria-label="Random plate"
              onClick={() => goTo(randomArchiveDate())}
              className="px-2.5 py-1 text-[11px] font-[family-name:var(--font-geist-mono)] text-[--amber] hover:text-[#e8b057] hover:border-[#e8b057]/40 border border-transparent rounded-full uppercase tracking-widest transition-all duration-150"
            >
              Random
            </button>
          </div>
        </div>

        {/* Plate counter */}
        <div
          className={`font-mono text-xs text-white/50 tracking-wider transition-opacity ${isPending ? "opacity-30" : "opacity-100"}`}
        >
          Plate {plateNumber(date).toLocaleString("en-GB")}
        </div>
      </div>
    </header>
  );
}
