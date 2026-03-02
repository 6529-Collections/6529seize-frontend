self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.hostname !== "arweave.net") return;
  if (event.request.mode === "navigate") return;

  // Safety: only handle normal asset GETs
  if (event.request.method !== "GET") return;
  if (event.request.headers.has("range")) return;

  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    const response = await fetch(request);

    if (response && (response.type === "opaque" || response.ok)) {
      return response;
    }

    return fetchFallback(request);
  } catch (err) {
    return fetchFallback(request);
  }
}

function fetchFallback(request) {
  const originalUrl = new URL(request.url);
  const fallbackUrl =
    "https://ar-io.net" +
    originalUrl.pathname +
    originalUrl.search +
    originalUrl.hash;

  return fetch(fallbackUrl);
}
