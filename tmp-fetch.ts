import { fetchPublicUrl } from "./lib/security/urlGuard";

const url = new URL("https://opensea.io/collection/thememes6529/");

const headers = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "accept-encoding": "gzip, deflate, br",
  "cache-control": "max-age=0",
  "sec-ch-ua": '"Chromium";v="124", "Not(A:Brand";v="24", "Google Chrome";v="124"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "cross-site",
  "sec-fetch-user": "?1",
  "sec-fetch-dest": "document",
  "upgrade-insecure-requests": "1",
} as const;

const options = {
  timeoutMs: 8000,
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  maxRedirects: 5,
};

(async () => {
  const response = await fetchPublicUrl(url, { headers }, options);
  console.log("status", response.status);
  console.log("content-type", response.headers.get("content-type"));
  const text = await response.text();
  console.log("length", text.length);
  console.log(text.slice(0, 400));
})();
