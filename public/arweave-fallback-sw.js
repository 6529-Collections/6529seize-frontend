const FALLBACK_HOST = "ar-io.net";

self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (!url.includes("arweave.net") || event.request.mode === "navigate") return;

  event.respondWith(
    (async () => {
      const opts = { method: event.request.method, headers: event.request.headers, credentials: "omit" };
      let res = await fetch(event.request, opts).catch(() => null);
      if (res?.ok) return res;
      const fallback = url.replace(/^(https?:\/\/)([^/]+)/, `$1${FALLBACK_HOST}`);
      res = await fetch(fallback, opts).catch(() => null);
      if (res?.ok) return res;
      return res || new Response(null, { status: 502 });
    })()
  );
});
