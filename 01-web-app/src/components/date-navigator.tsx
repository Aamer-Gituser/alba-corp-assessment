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
      className="inline-flex items-center gap-1.5 p-1.5 liquid-shield rounded-xl"
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
          className="[color-scheme:dark] cursor-pointer font-mono text-xs text-cosmic-cyan bg-black/30 px-2.5 py-1 rounded-lg border border-white/10 hover:border-cosmic-cyan/50 focus:outline-none focus:border-cosmic-cyan focus:bg-black/50 transition-colors duration-200 tracking-wider"
        />
      </label>

      <StepButton label="Next day" disabled={atEnd} onClick={() => goTo(shiftDate(date, 1))}>
        →
      </StepButton>

      <button
        type="button"
        onClick={() => goTo(today)}
        disabled={atEnd}
        className="text-xs font-mono text-emulsion/60 hover:text-emulsion px-2 py-1 disabled:cursor-not-allowed disabled:opacity-25 transition-colors duration-200"
      >
        Today
      </button>

      <button
        type="button"
        onClick={() => goTo(randomArchiveDate())}
        className="bg-safelight/10 border border-safelight/40 text-safelight hover:bg-safelight/20 text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-[0_0_12px_rgba(232,176,87,0.15)] active:scale-95 transition-all duration-200"
      >
        Random
      </button>

      <span
        aria-live="polite"
        className={`font-mono text-xs font-bold uppercase tracking-widest text-safelight transition-opacity duration-200 ${
          isPending ? "opacity-100" : "opacity-0"
        }`}
      >
        ⏳
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
      className="w-9 h-9 rounded-lg liquid-control text-emulsion flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}
