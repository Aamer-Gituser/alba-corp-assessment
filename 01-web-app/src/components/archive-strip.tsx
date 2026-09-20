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

      <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {plates.map((plate) => (
          <li key={plate.date} className="archive-item">
            <Link
              href={`/?date=${plate.date}`}
              scroll={false}
              className="group block focus-visible:outline-offset-[-2px] bg-[#080b14] border border-white/[0.07] rounded-2xl overflow-hidden cursor-pointer archive-card-3d transition-all duration-300"
            >
              <div className="relative aspect-square overflow-hidden bg-[#050810]">
                {plate.media_type !== "image" ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900/40 via-black to-black">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg
                        className="w-full h-full text-cyan-500/60"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1"/>
                        <circle cx="12" cy="12" r="2" fill="currentColor"/>
                      </svg>
                      <div className="absolute inset-0 rounded-full radar-pulse" style={{background: 'radial-gradient(circle, rgba(100,210,255,0.3) 0%, transparent 70%)' }} />
                    </div>
                    <span className="absolute top-3 right-3 text-[9px] font-mono tracking-widest text-cyan-400/60 uppercase">Video</span>
                  </div>
                ) : (
                  <PlateImage
                    src={posterImage(plate)}
                    alt={plate.title}
                    isVideo={false}
                    sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
                  />
                )}
              </div>
              <div className="flex flex-col gap-1.5 p-4 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                <span className="font-mono text-[10px] text-cyan-300/80 tracking-widest font-semibold">
                  {formatIndexDate(plate.date)} · {plateNumber(plate.date).toLocaleString("en-GB")}
                </span>
                <span className="line-clamp-2 font-serif text-sm text-white group-hover:text-cyan-200 transition-colors duration-200 leading-snug">
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

      <div className="mt-10 flex justify-center">
        {status === "exhausted" ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-600">
            End of the archive
          </p>
        ) : (
          <button
            type="button"
            onClick={loadOlder}
            disabled={status === "loading"}
            className="vision-btn px-6 py-2.5 rounded-full text-sm font-mono tracking-wider"
          >
            {status === "loading" ? "⏳ Loading…" : "Load earlier plates"}
          </button>
        )}
      </div>
    </section>
  );
}

function SectionHeading() {
  return (
    <div className="flex items-center gap-3">
      <h2 className="font-mono text-xs uppercase tracking-widest text-graphite">
        Preceding plates
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-plate-edge to-plate-black" />
    </div>
  );
}
