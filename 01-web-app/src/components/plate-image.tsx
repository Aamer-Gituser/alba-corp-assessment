"use client";

import Image from "next/image";
import { useState } from "react";

type PlateImageProps = {
  src: string | null;
  alt: string;
  sizes: string;
  preload?: boolean;
  /** Video entries get a marker, since their poster is a still of a moving plate. */
  isVideo?: boolean;
};

/**
 * A plate in its frame, with the three states an image can actually be in.
 *
 * Loading is not a spinner: it is an undeveloped plate — a dark, grainy surface
 * with a safelight sweep across it — and the photograph resolves out of it when
 * the bytes arrive. The developing animation is the app's signature, and it is
 * also the honest visual for "this exposure has not resolved yet".
 *
 * Failure is handled separately from loading because a broken plate is a real
 * outcome: NASA's older entries occasionally point at images that no longer
 * exist, and a permanently-shimmering box would be a lie.
 */
export function PlateImage({ src, alt, sizes, preload, isVideo }: PlateImageProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    src ? "loading" : "failed",
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-plate-slate">
      {status === "loading" && <UndevelopedPlate />}

      {status === "failed" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-graphite">
            plate unavailable
          </span>
          <span className="max-w-[24ch] text-sm text-graphite/70">
            {isVideo
              ? "This entry is a video with no still frame on file."
              : "The image for this entry could not be loaded."}
          </span>
        </div>
      )}

      {src && status !== "failed" && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          className={`object-cover ${status === "ready" ? "animate-develop" : "opacity-0"}`}
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("failed")}
        />
      )}

      {isVideo && status === "ready" && (
        <span className="absolute bottom-3 left-3 rounded-sm border border-plate-edge bg-plate-black/80 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cyanotype backdrop-blur-sm">
          motion plate
        </span>
      )}
    </div>
  );
}

/** An unexposed plate: flat emulsion with a safelight passing over it. */
function UndevelopedPlate() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-plate-slate" aria-hidden>
      <div className="animate-sweep absolute inset-y-0 -inset-x-1/4 bg-gradient-to-r from-transparent via-plate-edge to-transparent" />
    </div>
  );
}
