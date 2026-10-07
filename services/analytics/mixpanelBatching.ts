import type { BeforeSendHookPayload } from "mixpanel-browser";
import {
  sanitizeMixpanelEnvelope,
  sanitizeMixpanelIdentityEnvelope,
} from "./mixpanelPrivacy";

type SdkBatcher = {
  sendRequest: (
    payloads: unknown[],
    options: unknown,
    onResponse: (response: unknown) => void
  ) => void;
  enqueue: (item: unknown) => Promise<unknown>;
  flush: (options?: unknown) => Promise<unknown>;
  clear: () => Promise<unknown>;
};

export type BatchSdk = {
  _batch_requests: boolean;
  request_batchers: Partial<Record<"events" | "people" | "groups", SdkBatcher>>;
  stop_batch_senders: () => void;
};

export function guardMixpanelBatching(
  sdk: BatchSdk,
  canDeliver: () => boolean
): { stopAndClear: () => Promise<void> } {
  const writes = new Set<Promise<unknown>>();
  const batchers: SdkBatcher[] = [];
  const trackWrite = (operation: Promise<unknown>): Promise<unknown> => {
    writes.add(operation);
    // Both outcomes release bookkeeping without leaving an unhandled rejection.
    void operation.then(
      () => writes.delete(operation),
      () => writes.delete(operation)
    );
    return operation;
  };

  // In SDK 2.76.0 unsupported XHR/storage selects guarded direct delivery.
  const directOnly =
    Object.keys(sdk.request_batchers).length === 0 &&
    sdk._batch_requests === false;
  if (!directOnly) {
    for (const kind of ["events", "people", "groups"] as const) {
      const batcher = sdk.request_batchers[kind];
      if (!batcher) throw new Error(`Mixpanel ${kind} batcher unavailable`);
      batchers.push(batcher);
      const sendRequest = batcher.sendRequest.bind(batcher);
      const enqueue = batcher.enqueue.bind(batcher);
      const flush = batcher.flush.bind(batcher);
      batcher.enqueue = (item) =>
        canDeliver() ? trackWrite(enqueue(item)) : Promise.resolve(false);
      // flush includes the response and subsequent persisted removal/update writes.
      batcher.flush = (options) => trackWrite(flush(options));
      batcher.sendRequest = (payloads, options, onResponse) => {
        if (!canDeliver()) {
          onResponse(1);
          return;
        }
        const sanitized = payloads.map((payload) =>
          kind === "events"
            ? sanitizeMixpanelEnvelope(payload as BeforeSendHookPayload)
            : sanitizeMixpanelIdentityEnvelope(
                payload as Record<string, unknown>
              )
        );
        sendRequest(sanitized, options, onResponse);
      };
    }
  }

  return {
    stopAndClear: async () => {
      // stop_batch_senders ignores clear() promises. Capture them and defer actual
      // deletion until earlier enqueues/flushes cannot recreate withdrawn entries.
      const settledWrites = Promise.allSettled([...writes]);
      const clears: Promise<unknown>[] = [];
      const originalClears = batchers.map((batcher) => batcher.clear);
      batchers.forEach((batcher, index) => {
        const originalClear = originalClears[index];
        if (!originalClear) throw new Error("Mixpanel queue clear unavailable");
        batcher.clear = () => {
          const clearing = settledWrites.then(() =>
            originalClear.call(batcher)
          );
          clears.push(clearing);
          // The SDK discards the return value; the barrier handles this failure.
          void clearing.catch(() => undefined);
          return clearing;
        };
      });
      let stopped = false;
      try {
        sdk.stop_batch_senders();
        stopped = true;
      } catch {
        // Still wait for clears already started before allowing a failed retry.
      } finally {
        batchers.forEach((batcher, index) => {
          const originalClear = originalClears[index];
          if (originalClear) batcher.clear = originalClear;
        });
      }
      const results = await Promise.allSettled(clears);
      if (
        !stopped ||
        clears.length !== batchers.length ||
        results.some((result) => result.status === "rejected")
      ) {
        throw new Error("Mixpanel queues were not cleared");
      }
    },
  };
}
