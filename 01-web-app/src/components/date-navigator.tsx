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
      className="bg-gradient-to-r from-plate-slate/90 to-plate-slate/70 backdrop-blur-xl border-2 border-cyanotype/60 rounded-xl p-3 inline-flex items-center gap-2.5 flex-wrap shadow-2xl shadow-cyanotype/20"
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
          className="[color-scheme:dark] cursor-pointer rounded-lg border-2 border-safelight/60 bg-plate-black/80 px-3 py-2 font-mono text-sm font-bold text-safelight hover:border-safelight focus:outline-none focus:border-cyanotype focus:ring-2 focus:ring-cyanotype/30 transition-all duration-200"
        />
      </label>

      <StepButton label="Next day" disabled={atEnd} onClick={() => goTo(shiftDate(date, 1))}>
        →
      </StepButton>

      <button
        type="button"
        onClick={() => goTo(today)}
        disabled={atEnd}
        className="rounded-lg px-4 py-2 text-xs font-mono font-bold text-emulsion hover:bg-cyanotype/20 hover:text-cyanotype border border-cyanotype/40 disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-200"
      >
        TODAY
      </button>

      <button
        type="button"
        onClick={() => goTo(randomArchiveDate())}
        className="border-2 border-safelight bg-safelight/20 text-safelight hover:bg-safelight/40 hover:shadow-lg hover:shadow-safelight/50 rounded-lg px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest active:scale-95 transition-all duration-200"
      >
        🎲 Random
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
      className="h-10 w-10 rounded-lg bg-plate-black border-2 border-cyanotype/60 text-emulsion hover:border-cyanotype hover:text-cyanotype hover:shadow-lg hover:shadow-cyanotype/40 active:scale-90 flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30 disabled:border-plate-edge font-bold text-lg"
    >
      {children}
    </button>
  );
}
