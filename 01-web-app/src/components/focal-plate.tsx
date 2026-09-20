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
    <article className="animate-rise">
      <header className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs uppercase tracking-[0.22em] text-safelight">
          <span>Plate {plateNumber(plate.date).toLocaleString("en-GB")}</span>
          <span className="text-plate-edge" aria-hidden>
            /
          </span>
          <time dateTime={plate.date}>{formatIndexDate(plate.date)}</time>
        </div>

        <h1 className="font-display text-3xl leading-[1.05] text-emulsion sm:text-5xl lg:text-6xl font-normal tracking-tight">
          {plate.title}
        </h1>

        <p className="font-mono text-xs uppercase tracking-[0.15em] text-graphite">
          {formatLongDate(plate.date)}
          {plate.copyright && (
            <>
              <span className="mx-2 text-plate-edge" aria-hidden>
                ·
              </span>
              {plate.copyright.replace(/\s+/g, " ").trim()}
            </>
          )}
        </p>
      </header>

      <figure className="relative rounded-[4px] md:rounded-md border border-white/[0.08] shadow-[0_20px_70px_rgba(0,0,0,0.9)] overflow-hidden bg-plate-black aspect-4/3 w-full sm:aspect-16/9 group">
        <div className="absolute -inset-1 blur-3xl opacity-25 -z-10 bg-gradient-to-b from-safelight/20 via-cyanotype/15 to-transparent rounded-2xl pointer-events-none" />
        <PlateImage
          src={poster}
          alt={plate.title}
          isVideo={isVideo}
          priority
          sizes="(min-width: 1280px) 1120px, 100vw"
        />
      </figure>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <p className="max-w-[68ch] text-base leading-relaxed text-emulsion/85 font-light">
          {plate.explanation}
        </p>

        <dl className="h-fit bg-plate-slate/60 backdrop-blur-md border border-plate-edge rounded-lg p-5 font-mono text-[11px] uppercase tracking-[0.15em]">
          <MetaRow label="Medium" value={isVideo ? "Video" : "Photograph"} />
          <MetaRow label="Filed" value={formatIndexDate(plate.date)} />
          <MetaRow label="Credit" value={plate.copyright ? "Attributed" : "Public domain"} />
          <div className="mt-4 border-t border-plate-edge pt-4">
            <a
              href={plate.hdurl ?? plate.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-xs text-safelight hover:text-amber-300 flex items-center gap-1 transition-colors duration-200"
            >
              {isVideo ? "Watch at source ↗" : "View full resolution ↗"}
            </a>
          </div>
        </dl>
      </div>
    </article>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-plate-edge/50 py-2 last:border-0">
      <dt className="text-graphite">{label}</dt>
      <dd className="text-emulsion">{value}</dd>
    </div>
  );
}
