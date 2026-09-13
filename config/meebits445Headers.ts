import { MEEBITS_445_VIEWER_PATH } from "../lib/media/meebits-445";

// The HTTP sandbox also isolates direct navigation to the compatibility copy.
// Keep the script hash in sync with public/artwork/the-memes/445.html.
export const meebits445Headers = {
  source: MEEBITS_445_VIEWER_PATH,
  headers: [
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'none'",
        "sandbox allow-scripts allow-downloads",
        "script-src 'sha256-H+6UL3T+Uz3W8OU7i2NGlnCoagb5GZ7zCvw9vL4oXZQ=' https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js",
        "connect-src https://api.exchange.coinbase.com/products/ETH-USD/stats",
        "style-src 'unsafe-inline' https://fonts.googleapis.com",
        "font-src https://fonts.gstatic.com",
        "img-src data: https://cdn.meebco.com",
        "base-uri 'none'",
        "form-action 'none'",
        "frame-ancestors 'self'",
      ].join("; "),
    },
    { key: "Referrer-Policy", value: "no-referrer" },
    { key: "X-Robots-Tag", value: "noindex" },
  ],
};
