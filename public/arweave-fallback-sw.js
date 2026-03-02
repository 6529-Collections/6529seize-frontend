const FALLBACK_HOST = "ar-io.net";

function isArweaveRequest(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h === "arweave.net" || h.endsWith(".arweave.net");
  } catch {
    return false;
  }
}

self.addEventListener("fetch", (event) => {
  if (!isArweaveRequest(event.request.url) || event.request.mode === "navigate") return;

  event.respondWith(
    (async () => {
      const opts = { method: event.request.method, headers: event.request.headers, credentials: "omit" };
      const method = event.request.method.toUpperCase();
      if (method !== "GET" && method !== "HEAD") {
        return fetch(event.request);
      }
      try {
        const res = await fetch(event.request, opts);
        if (res?.ok) return res;
      } catch {}
      const fallback = event.request.url.replace(/^(https?:\/\/)([^/]+)/, `$1${FALLBACK_HOST}`);
      return Response.redirect(fallback, 302);
    })()
  );
});
