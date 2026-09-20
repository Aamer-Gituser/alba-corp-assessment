"use client";

import { useState } from "react";
import { formatIndexDate, formatLongDate, plateNumber } from "@/lib/dates";
import { posterImage } from "@/lib/plates";
import type { Apod } from "@/lib/types";

import { PlateImage } from "./plate-image";

/**
 * The plate in focus.
 *
 * The title is set above the image on purpose: NASA's titles are the most
 * characteristic thing in this archive ("A Perseid Below", "Rings Around the
 * Ring Nebula"), and putting them first means the page says something the
 * instant it renders, while the exposure is still developing underneath.
 */
export function FocalPlate({ plate }: { plate: Apod }) {
  const poster = posterImage(plate);
  const isVideo = plate.media_type !== "image";
  const hdSrc = plate.hdurl ?? plate.url;
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <article>
      {/* Plate meta line */}
      <div className="animate-entrance mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.35em] text-[--arctic]">
        <span>Plate {plateNumber(plate.date).toLocaleString("en-GB")}</span>
        <span className="text-white/15" aria-hidden>/</span>
        <time dateTime={plate.date}>{formatIndexDate(plate.date)}</time>
        <span className="flex-1 h-px bg-[--ruled] hidden sm:block" aria-hidden />
      </div>

      {/* Title */}
      <h1 className="animate-entrance font-[family-name:var(--font-fraunces)] text-5xl md:text-6xl lg:text-[5.5rem] leading-[1.05] text-[--text-1] font-normal tracking-tight mb-4">
        {plate.title}
      </h1>

      {/* Photographer credit */}
      {plate.copyright && (
        <p className="animate-entrance font-[family-name:var(--font-geist-mono)] text-sm italic text-[--text-2] mb-8">
          {plate.copyright.replace(/\s+/g, " ").trim()} · {formatLongDate(plate.date)}
        </p>
      )}

      {/* Full-width image with atmospheric glow */}
      <figure className="animate-entrance relative group mb-10">
        {/* Ambient aura */}
        <div className="focal-glow" aria-hidden />

        <div
          className="relative aspect-[4/3] sm:aspect-[16/9] w-full rounded-xl md:rounded-2xl overflow-hidden border border-white/[0.12] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] cursor-zoom-in"
          onClick={() => !isVideo && setLightboxOpen(true)}
          role={!isVideo ? "button" : undefined}
          aria-label={!isVideo ? "View full resolution image" : undefined}
          tabIndex={!isVideo ? 0 : undefined}
          onKeyDown={(e) => !isVideo && e.key === "Enter" && setLightboxOpen(true)}
        >
          <PlateImage
            key={poster ?? "missing"}
            src={poster}
            alt={plate.title}
            isVideo={isVideo}
            preload
            sizes="(min-width: 1280px) 1120px, 100vw"
          />

          {/* Floating action pills */}
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {!isVideo && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
                className="bg-black/70 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-[11px] font-[family-name:var(--font-geist-mono)] text-white tracking-widest hover:border-[--arctic] hover:shadow-[0_0_16px_rgba(77,182,200,0.3)] transition-all"
              >
                ⊞ EXPAND
              </button>
            )}
            <a
              href={hdSrc}
              target="_blank"
              rel="noreferrer noopener"
              onClick={(e) => e.stopPropagation()}
              className="bg-black/70 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-[11px] font-[family-name:var(--font-geist-mono)] text-white tracking-widest hover:border-[--amber] hover:shadow-[0_0_16px_rgba(212,144,58,0.3)] transition-all"
            >
              ↗ {isVideo ? "WATCH" : "FULL RES"}
            </a>
          </div>
        </div>
      </figure>

      {/* Fullscreen lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Full resolution image"
        >
          <button
            type="button"
            className="absolute top-5 right-6 text-white/60 hover:text-white font-[family-name:var(--font-geist-mono)] text-xs tracking-widest uppercase transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            ✕ Close
          </button>
          <a
            href={hdSrc}
            target="_blank"
            rel="noreferrer noopener"
            className="absolute top-5 left-6 text-[--amber] hover:text-amber-300 font-[family-name:var(--font-geist-mono)] text-xs tracking-widest uppercase transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            ↗ Open original
          </a>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hdSrc}
            alt={plate.title}
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.3em] text-white/30">
            {plate.title} · {formatIndexDate(plate.date)}
          </p>
        </div>
      )}


      {/* Explanation + telemetry */}
      <div className="animate-entrance grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <p className="text-base leading-[1.75] text-[--text-2] font-[family-name:var(--font-geist-sans)]">
          {plate.explanation}
        </p>

        <dl className="liquid-glass rounded-xl p-6 font-[family-name:var(--font-geist-mono)] h-fit">
          <div className="text-[--arctic] text-[11px] uppercase tracking-[0.3em] font-normal mb-5">Telemetry</div>
          <MetaRow label="Medium" value={isVideo ? "Video Stream" : "Photograph"} />
          <MetaRow label="Filed"  value={formatIndexDate(plate.date)} />
          <MetaRow label="Credit" value={plate.copyright ? plate.copyright.replace(/\s+/g, " ").trim() : "See source for image credit"} />
        </dl>
      </div>
    </article>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.07] py-2.5 last:border-0">
      <dt className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</dt>
      <dd className="text-[#ede7d9] font-medium text-xs text-right">{value}</dd>
    </div>
  );
}
