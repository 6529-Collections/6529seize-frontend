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
      let res;
      try {
        res = await fetch(event.request, opts);
      } catch {
        const method = event.request.method.toUpperCase();
        if (method !== "GET" && method !== "HEAD") {
          return new Response(null, { status: 502 });
        }
        const fallback = event.request.url.replace(/^(https?:\/\/)([^/]+)/, `$1${FALLBACK_HOST}`);
        res = await fetch(fallback, opts).catch(() => null);
        if (res?.ok) return res;
        return res || new Response(null, { status: 502 });
      }
      return res;
    })()
  );
});
