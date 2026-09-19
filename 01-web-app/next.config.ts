import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /*
     * APOD images are served straight from NASA at full plate resolution —
     * several are 4000px wide and multiple megabytes. Routing them through
     * Next's optimiser is what keeps the archive grid cheap to load: each card
     * receives a resized, modern-format image instead of the original.
     *
     * Video entries have no image of their own; their poster frames come from
     * YouTube's thumbnail host, so both origins are allowed.
     */
    remotePatterns: [
      { protocol: "https", hostname: "apod.nasa.gov" },
      { protocol: "https", hostname: "www.youtube.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
