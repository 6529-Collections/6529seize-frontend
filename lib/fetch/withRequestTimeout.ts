import { createFetchDeadline } from "./fetchDeadline";

/** Includes reading the response body, while preserving caller cancellation. */
export async function withRequestTimeout<T>(
  request: (signal: AbortSignal | undefined) => Promise<T>,
  {
    signal,
    timeoutMs,
  }: {
    readonly signal?: AbortSignal | undefined;
    readonly timeoutMs?: number | undefined;
  }
): Promise<T> {
  if (timeoutMs === undefined) return request(signal);

  const deadline = createFetchDeadline(
    signal,
    timeoutMs,
    () => new DOMException("The request timed out.", "TimeoutError")
  );
  try {
    return await deadline.run(() => request(deadline.signal));
  } finally {
    deadline.dispose();
  }
}
