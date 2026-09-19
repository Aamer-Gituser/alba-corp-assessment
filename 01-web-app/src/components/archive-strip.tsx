"use client";

import Link from "next/link";
import { useState } from "react";

import { formatIndexDate, plateNumber, precedingWindow } from "@/lib/dates";
import { posterImage } from "@/lib/plates";
import type { Apod } from "@/lib/types";

import { EmptyNotice } from "./notices";
import { PlateImage } from "./plate-image";

const PAGE_SIZE = 12;

type ArchiveStripProps = {
  focalDate: string;
  initialPlates: Apod[];
};

/**
 * The plates filed immediately before the one in focus.
 *
 * The first page is rendered on the server so the grid is never empty on
 * arrival. Further pages are fetched from our own route handler, which means
 * the browser still never learns the NASA key or talks to NASA directly.
 */
export function ArchiveStrip({ focalDate, initialPlates }: ArchiveStripProps) {
  const [plates, setPlates] = useState(initialPlates);
  const [status, setStatus] = useState<"idle" | "loading" | "exhausted">("idle");
  const [failure, setFailure] = useState<string | null>(null);

  const oldest = plates.at(-1)?.date ?? focalDate;

  async function loadOlder() {
    setStatus("loading");
    setFailure(null);

    const { start, end } = precedingWindow(oldest, PAGE_SIZE);
    if (end < start) {
      setStatus("exhausted");
      return;
    }

    try {
      const response = await fetch(`/api/apod?start=${start}&end=${end}`);
      const body = await response.json();

      if (!response.ok) {
        setFailure(body?.error?.detail ?? "The archive could not be read.");
        setStatus("idle");
        return;
      }

      const older: Apod[] = body.plates ?? [];
      if (older.length === 0) {
        setStatus("exhausted");
        return;
      }

      setPlates((current) => [...current, ...older]);
      setStatus("idle");
    } catch {
      setFailure("Could not reach the archive. Check your connection.");
      setStatus("idle");
    }
  }

  if (plates.length === 0) {
    return (
      <section className="mt-16">
        <SectionHeading />
        <EmptyNotice message="No earlier plates are on file for this range" />
      </section>
    );
  }

  return (
    <section className="mt-16">
      <SectionHeading />

      <ul className="mt-6 grid grid-cols-2 gap-px border border-plate-edge bg-plate-edge sm:grid-cols-3 lg:grid-cols-4">
        {plates.map((plate) => (
          <li key={plate.date} className="bg-plate-black">
            <Link
              href={`/?date=${plate.date}`}
              scroll={false}
              className="group block focus-visible:outline-offset-[-2px]"
            >
              <div className="relative aspect-square">
                <PlateImage
                  src={posterImage(plate)}
                  alt={plate.title}
                  isVideo={plate.media_type !== "image"}
                  sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
                />
              </div>
              <div className="flex flex-col gap-1 p-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyanotype">
                  {formatIndexDate(plate.date)} · {plateNumber(plate.date).toLocaleString("en-GB")}
                </span>
                <span className="line-clamp-2 font-display text-sm leading-snug text-emulsion/85 transition-colors group-hover:text-safelight">
                  {plate.title}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {failure && (
        <p role="alert" className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-safelight">
          {failure}
        </p>
      )}

      <div className="mt-6 flex justify-center">
        {status === "exhausted" ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-graphite">
            End of the archive
          </p>
        ) : (
          <button
            type="button"
            onClick={loadOlder}
            disabled={status === "loading"}
            className="rounded-sm border border-plate-edge px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-graphite transition-colors hover:border-safelight/50 hover:text-emulsion disabled:opacity-50"
          >
            {status === "loading" ? "Retrieving…" : "Load earlier plates"}
          </button>
        )}
      </div>
    </section>
  );
}

function SectionHeading() {
  return (
    <h2 className="font-mono text-[10px] uppercase tracking-[0.25em] text-graphite">
      Preceding plates
    </h2>
  );
}
