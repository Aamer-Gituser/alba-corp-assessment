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
      className="bg-plate-slate/80 backdrop-blur-md border border-plate-edge rounded-lg p-1.5 inline-flex items-center gap-1.5 flex-wrap"
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
          className="[color-scheme:dark] cursor-pointer rounded-[4px] border border-plate-edge bg-plate-black/80 px-3 py-1.5 font-mono text-xs text-safelight hover:border-safelight/40 focus:outline-none focus:border-safelight transition-colors duration-200"
        />
      </label>

      <StepButton label="Next day" disabled={atEnd} onClick={() => goTo(shiftDate(date, 1))}>
        →
      </StepButton>

      <button
        type="button"
        onClick={() => goTo(today)}
        disabled={atEnd}
        className="rounded-[4px] px-2.5 py-1 text-xs font-mono text-graphite hover:text-emulsion disabled:cursor-not-allowed disabled:opacity-35 transition-colors duration-200"
      >
        Today
      </button>

      <button
        type="button"
        onClick={() => goTo(randomArchiveDate())}
        className="border border-safelight/40 bg-safelight/[0.08] text-safelight hover:bg-safelight/[0.16] rounded-[4px] px-3 py-1 text-xs font-mono uppercase tracking-wider active:scale-95 transition-all duration-200"
      >
        Random plate
      </button>

      <span
        aria-live="polite"
        className={`font-mono text-[10px] uppercase tracking-[0.15em] text-graphite transition-opacity duration-200 ${
          isPending ? "opacity-100" : "opacity-0"
        }`}
      >
        Retrieving…
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
      className="h-8 w-8 rounded-[4px] bg-plate-black/60 border border-plate-edge text-emulsion hover:border-safelight/40 hover:text-safelight active:scale-95 flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-plate-edge disabled:hover:text-emulsion"
    >
      {children}
    </button>
  );
}
