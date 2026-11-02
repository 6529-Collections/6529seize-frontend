/**
 * - available: the proxy now answers 2xx, so the image loaded but did not
 *   decode, or appeared since the failure. It is worth one recovery attempt.
 * - retryable: the proxy is busy or was unreachable; try again with backoff.
 * - definitive: any other answer is final until someone asks to retry.
 */
export type DropMediaFailureKind = "available" | "retryable" | "definitive";

function classifyDropMediaStatus(status: number): DropMediaFailureKind {
  if (status >= 200 && status < 300) {
    return "available";
  }
  return status === 408 || status === 429 || status === 503
    ? "retryable"
    : "definitive";
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
