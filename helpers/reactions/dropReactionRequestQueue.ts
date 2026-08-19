type DropReactionRequest = (signal: AbortSignal) => Promise<void>;

interface DropReactionRequestOptions {
  readonly timeoutMs?: number;
}

const DROP_REACTION_REQUEST_TIMEOUT_MS = 15_000;

const requestTailByDrop = new Map<string, Promise<void>>();

const invokeRequest = async (
  request: DropReactionRequest,
  signal: AbortSignal
): Promise<void> => {
  await request(signal);
};

const runRequestWithTimeout = (
  request: DropReactionRequest,
  timeoutMs: number
): Promise<void> => {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      reject(new DOMException("Reaction request timed out", "TimeoutError"));
      controller.abort();
    }, timeoutMs);
  });

  const requestPromise = invokeRequest(request, controller.signal);

  return Promise.race([requestPromise, timeoutPromise]).finally(() => {
    if (timeoutId !== undefined) {
      globalThis.clearTimeout(timeoutId);
    }
  });
};

export const enqueueDropReactionRequest = (
  dropId: string,
  request: DropReactionRequest,
  options: DropReactionRequestOptions = {}
): Promise<void> => {
  const previousTail = requestTailByDrop.get(dropId);
  const runRequest = () =>
    runRequestWithTimeout(
      request,
      options.timeoutMs ?? DROP_REACTION_REQUEST_TIMEOUT_MS
    );
  const requestPromise = previousTail
    ? previousTail.then(runRequest)
    : runRequest();

  // Keep the queue tail fulfilled so one failed request cannot block the next.
  const settledTail = requestPromise.then(
    () => undefined,
    () => undefined
  );

  requestTailByDrop.set(dropId, settledTail);
  void settledTail.then(() => {
    if (requestTailByDrop.get(dropId) === settledTail) {
      requestTailByDrop.delete(dropId);
    }
  });

  return requestPromise;
};

export const __resetDropReactionRequestQueueForTests = (): void => {
  requestTailByDrop.clear();
};
