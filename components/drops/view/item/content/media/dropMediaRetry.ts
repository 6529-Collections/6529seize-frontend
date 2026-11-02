/**
 * - available: the proxy now answers 2xx, so the image loaded but did not
 *   decode, or appeared since the failure. It is worth one recovery attempt.
 * - upstream: the source host failed or timed out (5xx). Worth a couple of
 *   attempts, since the proxy keeps such failures only for a few seconds.
 * - retryable: the proxy is busy or was unreachable; try again with backoff.
 * - definitive: the proxy refused the source (4xx); final until someone asks
 *   to retry.
 */
export type DropMediaFailureKind =
  | "available"
  | "upstream"
  | "retryable"
  | "definitive";

function classifyDropMediaStatus(status: number): DropMediaFailureKind {
  if (status >= 200 && status < 300) {
    return "available";
  }
  if (status === 408 || status === 429 || status === 503) {
    return "retryable";
  }
  return status >= 500 ? "upstream" : "definitive";
}

/**
 * An image element cannot read the status of a failed load, so ask the
 * same-origin proxy once. Its failures are briefly cached server-side, so a
 * definitive failure answers without new work. A network failure is retryable.
 */
export async function probeDropMediaFailure(
  url: string,
  signal: AbortSignal
): Promise<DropMediaFailureKind> {
  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      credentials: "same-origin",
      signal,
    });
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
    return "retryable";
  }
  try {
    await response.body?.cancel();
  } catch {
    // The status is all this probe needs.
  }
  return classifyDropMediaStatus(response.status);
}
