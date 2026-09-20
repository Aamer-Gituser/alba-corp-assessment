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

      {/* Full-width image */}
      <figure className="animate-entrance relative group mb-10">
        <div className="plate-frame aspect-[4/3] sm:aspect-[16/9] w-full">
          <PlateImage
            src={poster}
            alt={plate.title}
            isVideo={isVideo}
            priority
            sizes="(min-width: 1280px) 1120px, 100vw"
          />

          {/* Floating action */}
          <a
            href={plate.hdurl ?? plate.url}
            target="_blank"
            rel="noreferrer noopener"
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 backdrop-blur border border-white/20 rounded px-3 py-1.5 text-[11px] font-[family-name:var(--font-geist-mono)] text-white tracking-widest hover:border-[--amber]"
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

        <dl className="telemetry-pod">
          <div className="text-[--arctic] font-semibold mb-4">Telemetry</div>
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
    <div className="flex items-baseline justify-between gap-4 border-b border-[--ruled] py-2.5 last:border-0">
      <dt className="text-[--text-2]">{label}</dt>
      <dd className="text-[--text-1] font-semibold">{value}</dd>
    </div>
  );
}
