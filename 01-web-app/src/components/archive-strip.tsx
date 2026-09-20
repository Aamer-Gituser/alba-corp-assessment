"use client";

import Link from "next/link";
import { useState } from "react";

import { formatIndexDate, plateNumber, precedingWindow } from "@/lib/dates";
import { posterImage } from "@/lib/plates";
import type { Apod, ApodError } from "@/lib/types";

import { EmptyNotice } from "./notices";
import { PlateImage } from "./plate-image";

const PAGE_SIZE = 8;

type ArchiveStripProps = {
  focalDate: string;
  initialPlates: Apod[];
  archiveError?: ApodError;
};

/**
 * The plates filed immediately before the one in focus.
 *
 * The first page is rendered on the server so the grid is never empty on
 * arrival. Further pages are fetched from our own route handler, which means
 * the browser still never learns the NASA key or talks to NASA directly.
 */
export function ArchiveStrip({ focalDate, initialPlates, archiveError }: ArchiveStripProps) {
  const [plates, setPlates] = useState(initialPlates.slice(0, PAGE_SIZE));
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
        {archiveError ? (
          <p role="alert" className="mt-6 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.18em] text-[--text-2]">
            Archive contact sheet unavailable · {archiveError.kind}
          </p>
        ) : (
          <EmptyNotice message="No earlier plates are on file for this range" />
        )}
      </section>
    );
  }

  return (
    <section className="mt-16">
      <SectionHeading />

      <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plates.map((plate) => (
          <li key={plate.date}>
            <Link
              href={`/?date=${plate.date}`}
              scroll={true}
              className="group block bg-[#0c0e15]/70 backdrop-blur-md border border-white/[0.08] rounded-lg overflow-hidden archive-card-3d focus-visible:outline focus-visible:outline-2 focus-visible:outline-[--arctic] focus-visible:outline-offset-2"
              onClick={() => {
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
              }}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#070810]">
                {plate.media_type !== "image" ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[--arctic]/10 via-black to-black">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <svg
                        className="w-full h-full text-[--arctic]/40"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1"/>
                        <circle cx="12" cy="12" r="2" fill="currentColor"/>
                      </svg>
                      <div className="absolute inset-0 rounded-full radar-pulse" style={{background: 'radial-gradient(circle, rgba(77,182,200,0.25) 0%, transparent 70%)'}} />
                    </div>
                    <span className="absolute top-3 right-3 text-[9px] font-[family-name:var(--font-geist-mono)] tracking-widest text-[--arctic]/50 uppercase">Video</span>
                  </div>
                ) : (
                  <div className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-105">
                    <PlateImage
                      src={posterImage(plate)}
                      alt={plate.title}
                      isVideo={false}
                      sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5 p-4">
                <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-[--arctic] tracking-widest">
                  {formatIndexDate(plate.date)}
                </span>
                <span className="line-clamp-2 font-[family-name:var(--font-fraunces)] text-sm text-[--text-1] leading-snug">
                  {plate.title}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {failure && (
        <p role="alert" className="mt-4 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.18em] text-[--text-2]">
          {failure}
        </p>
      )}

      <div className="mt-10 flex justify-center">
        {status === "exhausted" ? (
          <p className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.28em] text-[--text-2]">
            End of the archive
          </p>
        ) : (
          <button
            type="button"
            onClick={loadOlder}
            disabled={status === "loading"}
            className="px-8 py-2.5 text-sm font-[family-name:var(--font-geist-mono)] tracking-wider liquid-glass rounded-full text-white/60 hover:text-white hover:border-[#e8b057]/50 hover:shadow-[0_0_20px_rgba(232,176,87,0.2)] transition-all duration-300 disabled:opacity-40"
          >
            {status === "loading" ? "Loading…" : "Load earlier plates"}
          </button>
        )}
      </div>
    </section>
  );
}

function SectionHeading() {
  return (
    <div className="flex items-center gap-4">
      <h2 className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.3em] text-[--text-2] whitespace-nowrap">
        Preceding Plates
      </h2>
      <div className="flex-1 h-px bg-[--ruled]" />
    </div>
  );
}
