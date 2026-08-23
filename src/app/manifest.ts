import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_SHORT_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8EC",
    theme_color: "#EC7416",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/brand/parshuram-mark-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/parshuram-mark-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
