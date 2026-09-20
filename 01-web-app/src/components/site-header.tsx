"use client";

import Link from "next/link";
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
    <header className="masthead">
      <div className="max-w-[1120px] mx-auto px-6 sm:px-8 h-[52px] flex items-center justify-between">

        {/* Brand */}
        <Link
          href="/"
          className="font-[family-name:var(--font-fraunces)] text-xl tracking-[0.35em] uppercase text-white hover:text-[--text-1] transition-colors"
        >
          Apogee
        </Link>

        {/* Date navigation */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous plate"
            disabled={atStart}
            onClick={() => goTo(shiftDate(date, -1))}
            className="w-7 h-7 rounded flex items-center justify-center text-sm text-[--text-2] hover:text-[--text-1] hover:bg-white/5 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
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
            className="w-7 h-7 rounded flex items-center justify-center text-sm text-[--text-2] hover:text-[--text-1] hover:bg-white/5 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
          >
            →
          </button>

          <button
            type="button"
            aria-label="Go to today"
            disabled={atEnd}
            onClick={() => goTo(today)}
            className="px-2 py-1 text-xs font-[family-name:var(--font-geist-mono)] text-[--text-2] hover:text-[--text-1] hover:bg-white/5 rounded transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
          >
            Today
          </button>

          <button
            type="button"
            aria-label="Random plate"
            onClick={() => goTo(randomArchiveDate())}
            className="text-[--amber] hover:text-amber-300 text-xs font-[family-name:var(--font-geist-mono)] uppercase tracking-widest transition-colors"
          >
            Random
          </button>
        </div>

        {/* Plate counter */}
        <div
          className={`font-[family-name:var(--font-geist-mono)] text-[11px] tracking-[0.2em] text-[--arctic] transition-opacity ${isPending ? "opacity-50" : "opacity-100"}`}
        >
          Plate {plateNumber(date).toLocaleString("en-GB")}
        </div>
      </div>
    </header>
  );
}
