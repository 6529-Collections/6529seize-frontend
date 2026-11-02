import { getAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import type { MetadataRoute } from "next";

// The site is black end to end: `html`/`body` paint #000000 (styles/globals.css)
// and the brand mark is white on black, so both manifest colors match it.
const BRAND_COLOR = "#000000";

// `display: "browser"` keeps every launch in a normal browser tab. The app is
// not designed for a chrome-less window (wallet connection, external links and
// the navigation shell all assume browser UI), and the native iOS/Android shell
// is a Capacitor WebView that ignores web manifests entirely. Switch to
// "standalone" only after that mode is QA'd.
export default function manifest(): MetadataRoute.Manifest {
  const environment = getAppEnvironment(publicEnv.BASE_ENDPOINT);

  return {
    id: "/",
    name: environment.title,
    short_name: environment.isProduction ? "6529" : environment.title,
    lang: DEFAULT_LOCALE,
    start_url: "/",
    scope: "/",
    display: "browser",
    background_color: BRAND_COLOR,
    theme_color: BRAND_COLOR,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
