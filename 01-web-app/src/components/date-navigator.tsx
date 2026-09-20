"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  ARCHIVE_START,
  clampToArchive,
  randomArchiveDate,
  shiftDate,
  todayInArchiveTime,
} from "@/lib/dates";

type DateNavigatorProps = {
  date: string;
};

/**
 * The time-travel control, and the app's only piece of shared state.
 *
 * The selected date lives in the URL rather than in component state, so every
 * view of the archive is a link. Sending someone `?date=1996-04-12` sends them
 * the plate, not the homepage — which is the whole point of an archive you can
 * cite. Navigation is wrapped in a transition so the current plate stays on
 * screen, dimmed, while the next one is fetched on the server.
 */
export function DateNavigator({ date }: DateNavigatorProps) {
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
    <div
      className="inline-flex items-center gap-2 p-1 bg-plate-black/90 border border-plate-edge rounded-md shadow-lg"
      data-pending={isPending ? "" : undefined}
    >
      <StepButton
        label="Previous day"
        disabled={atStart}
        onClick={() => goTo(shiftDate(date, -1))}
      >
        ←
      </StepButton>

      <label className="relative">
        <span className="sr-only">Choose a date to travel to</span>
        <input
          type="date"
          value={date}
          min={ARCHIVE_START}
          max={today}
          onChange={(event) => event.target.value && goTo(event.target.value)}
          className="[color-scheme:dark] cursor-pointer font-mono text-xs text-safelight bg-black/50 px-3 py-1.5 rounded-[3px] border border-white/5 hover:border-safelight/40 focus:outline-none focus:border-safelight transition-colors duration-200"
        />
      </label>

      <StepButton label="Next day" disabled={atEnd} onClick={() => goTo(shiftDate(date, 1))}>
        →
      </StepButton>

      <button
        type="button"
        onClick={() => goTo(today)}
        disabled={atEnd}
        className="text-xs font-mono text-slate-400 hover:text-emulsion px-2.5 py-1 disabled:cursor-not-allowed disabled:opacity-35 transition-colors duration-200"
      >
        Today
      </button>

      <button
        type="button"
        onClick={() => goTo(randomArchiveDate())}
        className="bg-safelight/10 border border-safelight/40 text-safelight hover:bg-safelight/20 text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-[3px] shadow-[0_0_12px_rgba(232,176,87,0.15)] active:scale-95 transition-all duration-200"
      >
        Random
      </button>

      <span
        aria-live="polite"
        className={`font-mono text-xs font-bold uppercase tracking-widest text-safelight transition-opacity duration-200 ${
          isPending ? "opacity-100" : "opacity-0"
        }`}
      >
        ⏳ Loading…
      </span>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="w-8 h-8 rounded-[4px] bg-white/[0.03] border border-white/10 text-emulsion hover:border-safelight/50 hover:text-safelight active:scale-95 flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/10"
    >
      {children}
    </button>
  );
}
