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

        <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-white/[0.12] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
          <PlateImage
            src={poster}
            alt={plate.title}
            isVideo={isVideo}
            priority
            sizes="(min-width: 1280px) 1120px, 100vw"
          />

          {/* Floating action pill */}
          <a
            href={plate.hdurl ?? plate.url}
            target="_blank"
            rel="noreferrer noopener"
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/70 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-[11px] font-[family-name:var(--font-geist-mono)] text-white tracking-widest hover:border-[--amber] hover:shadow-[0_0_16px_rgba(212,144,58,0.3)]"
          >
            ↗ {isVideo ? "WATCH" : "FULL RES"}
          </a>
        </div>
      </figure>

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
