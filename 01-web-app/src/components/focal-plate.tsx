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
      <header className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs uppercase tracking-[0.25em] text-cyan-400/90 font-semibold">
          <span>Plate {plateNumber(plate.date).toLocaleString("en-GB")}</span>
          <span className="text-white/20" aria-hidden>
            /
          </span>
          <time dateTime={plate.date}>{formatIndexDate(plate.date)}</time>
        </div>

        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-white font-normal tracking-tight">
          {plate.title}
        </h1>

        {plate.copyright && (
          <p className="font-mono text-sm italic text-zinc-400">
            {plate.copyright.replace(/\s+/g, " ").trim()} · {formatLongDate(plate.date)}
          </p>
        )}
      </header>

      <figure className="relative">
        <div className="focal-bloom" />
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/[0.12] shadow-[0_30px_90px_rgba(0,0,0,0.85)] bg-plate-black aspect-4/3 w-full sm:aspect-16/9 group">
          <PlateImage
            src={poster}
            alt={plate.title}
            isVideo={isVideo}
            priority
            sizes="(min-width: 1280px) 1120px, 100vw"
          />

          {/* Floating Action Pill */}
          <a
            href={plate.hdurl ?? plate.url}
            target="_blank"
            rel="noreferrer noopener"
            className="focal-action-pill group-hover:opacity-100"
          >
            ↗ {isVideo ? "Watch" : "View Full Res"}
          </a>
        </div>
      </figure>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <p className="max-w-[72ch] text-base leading-relaxed text-zinc-300 font-light">
          {plate.explanation}
        </p>

        <dl className="h-fit bg-white/[0.03] backdrop-blur-lg border border-white/[0.08] rounded-2xl p-6 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
          <div className="text-cyan-400/80 font-semibold mb-4">Telemetry</div>
          <MetaRow label="Medium" value={isVideo ? "Video Stream" : "Photograph"} />
          <MetaRow label="Filed" value={formatIndexDate(plate.date)} />
          <MetaRow label="Credit" value={plate.copyright ? "Attributed" : "Public domain"} />
        </dl>
      </div>
    </article>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.05] py-2.5 last:border-0">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-200 font-semibold">{value}</dd>
    </div>
  );
}
