export type HomeArtworkStartup = {
  take: (
    url: string,
    headers: Headers,
    signal?: AbortSignal | null
  ) => Promise<Response | null> | null;
};

/** Adopt a document's early GET once; normal API auth and error handling stay upstream. */
export async function fetchWithHomeArtworkStartup(
  url: string,
  init: RequestInit
): Promise<Response> {
  const startup =
    typeof window === "undefined"
      ? undefined
      : (Reflect.get(globalThis, "__6529HomeArtworkStartup") as
          | HomeArtworkStartup
          | undefined);
  if (
    (init.method ?? "GET") !== "GET" ||
    (init.credentials ?? "same-origin") !== "same-origin" ||
    (init.body !== null && init.body !== undefined) ||
    !startup
  ) {
    return globalThis.fetch(url, init);
  }

  init.signal?.throwIfAborted();
  const pending = startup.take(url, new Headers(init.headers), init.signal);
  if (!pending) return globalThis.fetch(url, init);

  let onAbort: (() => void) | undefined;
  const aborted = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(init.signal?.reason);
    init.signal?.addEventListener("abort", onAbort, { once: true });
  });
  try {
    const response = await Promise.race([pending, aborted]);
    init.signal?.throwIfAborted();
    return response ?? (await globalThis.fetch(url, init));
  } finally {
    if (onAbort) init.signal?.removeEventListener("abort", onAbort);
  }
}
