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
      className="flex flex-wrap items-center gap-2"
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
          className="[color-scheme:dark] cursor-pointer rounded-sm border border-plate-edge bg-plate-slate px-3 py-2 font-mono text-sm text-safelight transition-colors hover:border-safelight/50"
        />
      </label>

      <StepButton label="Next day" disabled={atEnd} onClick={() => goTo(shiftDate(date, 1))}>
        →
      </StepButton>

      <button
        type="button"
        onClick={() => goTo(today)}
        disabled={atEnd}
        className="rounded-sm border border-plate-edge px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-graphite transition-colors hover:border-safelight/50 hover:text-emulsion disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-plate-edge disabled:hover:text-graphite"
      >
        Today
      </button>

      <button
        type="button"
        onClick={() => goTo(randomArchiveDate())}
        className="rounded-sm border border-safelight/40 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-safelight transition-colors hover:bg-safelight hover:text-plate-black"
      >
        Random plate
      </button>

      <span
        aria-live="polite"
        className={`font-mono text-[11px] uppercase tracking-[0.18em] text-graphite transition-opacity ${
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
      className="h-10 w-10 rounded-sm border border-plate-edge text-emulsion transition-colors hover:border-safelight/50 hover:text-safelight disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-plate-edge disabled:hover:text-emulsion"
    >
      {children}
    </button>
  );
}
