/** Polls one processing job serially; the deadline also aborts a stalled request. */
export function pollDocumentationProcessing({
  expiresAt,
  poll,
  onError,
}: {
  readonly expiresAt: number;
  readonly poll: (signal: AbortSignal) => Promise<boolean>;
  readonly onError: () => void;
}): () => void {
  const abort = new AbortController();
  let next: ReturnType<typeof setTimeout> | undefined;
  let ended = false;
  const stop = () => {
    ended = true;
    clearTimeout(next);
    clearTimeout(deadline);
    abort.abort();
  };
  const deadline = setTimeout(
    () => {
      if (ended) return;
      stop();
      onError();
    },
    Math.max(0, expiresAt - Date.now())
  );
  const run = async () => {
    try {
      const again = await poll(abort.signal);
      if (ended) return;
      if (!again) {
        stop();
        return;
      }
      next = setTimeout(() => {
        void run();
      }, 3000);
    } catch {
      if (ended) return;
      stop();
      onError();
    }
  };
  next = setTimeout(() => {
    void run();
  }, 3000);
  return stop;
}
