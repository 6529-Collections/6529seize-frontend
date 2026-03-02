const ARWEAVE_HOST = "arweave.net";
const FALLBACK_HOST = "ar-io.net";

function isArweaveRequest(url) {
  try {
    const u = new URL(url);
    return u.hostname === ARWEAVE_HOST || u.hostname === "www." + ARWEAVE_HOST;
  } catch {
    return false;
  }
}

function toFallbackUrl(url) {
  try {
    const u = new URL(url);
    u.hostname = FALLBACK_HOST;
    u.host = FALLBACK_HOST + (u.port ? ":" + u.port : "");
    return u.toString();
  } catch {
    return null;
  }
}

self.addEventListener("fetch", (event) => {
  if (!isArweaveRequest(event.request.url)) return;
  if (event.request.mode === "navigate") return;

  event.respondWith(
    (async () => {
      const opts = {
        method: event.request.method,
        headers: event.request.headers,
        credentials: "omit",
      };
      try {
        const res = await fetch(event.request, opts);
        if (res.ok) return res;
      } catch {}
      const fallback = toFallbackUrl(event.request.url);
      if (!fallback) return fetch(event.request);
      try {
        return await fetch(fallback, opts);
      } catch {
        return fetch(event.request);
      }
    })()
  );
});
