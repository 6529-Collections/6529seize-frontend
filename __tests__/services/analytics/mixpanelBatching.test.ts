import {
  guardMixpanelBatching,
  type BatchSdk,
} from "@/services/analytics/mixpanelBatching";

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

function setup() {
  let allowed = true;
  const makeBatcher = () => ({
    sendRequest: jest.fn(),
    enqueue: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue(true),
    flush: jest.fn<Promise<unknown>, [unknown?]>().mockResolvedValue(undefined),
    clear: jest.fn<Promise<unknown>, []>().mockResolvedValue(undefined),
  });
  const batchers = {
    events: makeBatcher(),
    people: makeBatcher(),
    groups: makeBatcher(),
  };
  const originals = Object.values(batchers).map((batcher) => ({ ...batcher }));
  const sdk: BatchSdk = {
    _batch_requests: true,
    request_batchers: batchers,
    stop_batch_senders: () => {
      sdk._batch_requests = false;
      Object.values(batchers).forEach((batcher) => {
        void batcher.clear();
      });
    },
  };
  const guard = guardMixpanelBatching(sdk, () => allowed);
  return {
    batchers,
    originals,
    sdk,
    guard,
    close: () => {
      allowed = false;
    },
  };
}

it.each(["enqueue", "flush"] as const)(
  "waits for pre-withdrawal %s writes before deleting all queues",
  async (operation) => {
    const { batchers, originals, guard, close } = setup();
    const pending = deferred();
    originals[0]?.[operation].mockReturnValueOnce(pending.promise);
    const write =
      operation === "enqueue"
        ? batchers.events.enqueue({})
        : batchers.events.flush();
    close();
    const clearing = guard.stopAndClear();
    for (const original of originals)
      expect(original.clear).not.toHaveBeenCalled();
    expect(await batchers.people.enqueue({})).toBe(false);
    expect(originals[1]?.enqueue).not.toHaveBeenCalled();
    pending.resolve();
    await write;
    await clearing;
    for (const original of originals) {
      expect(original.clear).toHaveBeenCalledTimes(1);
      expect(original[operation].mock.invocationCallOrder[0] ?? 0).toBeLessThan(
        original.clear.mock.invocationCallOrder[0] ?? 0
      );
    }
  }
);

it("waits for the other queues even when one persisted deletion rejects", async () => {
  const { originals, guard, close } = setup();
  const delayed = deferred();
  originals[0]?.clear.mockRejectedValueOnce(new Error("Deletion failed"));
  originals[2]?.clear.mockReturnValueOnce(delayed.promise);
  close();
  const result = jest.fn();
  const clearing = guard.stopAndClear();
  const observed = clearing.then(
    () => result("success"),
    () => result("failure")
  );
  // The middle queue has finished, but the failed barrier must retain the last queue.
  await originals[1]?.clear.mock.results[0]?.value;
  expect(result).not.toHaveBeenCalled();
  delayed.resolve();
  await observed;
  expect(result).toHaveBeenCalledWith("failure");
});

it("restores SDK methods and awaits started deletions after stopping throws", async () => {
  const { batchers, originals, sdk, guard, close } = setup();
  const delayed = deferred();
  originals[0]?.clear.mockReturnValueOnce(delayed.promise);
  sdk.stop_batch_senders = () => {
    void batchers.events.clear();
    throw new Error("Stop failed");
  };
  close();
  const clearing = guard.stopAndClear();
  const result = jest.fn();
  const observed = clearing.catch(() => result());
  expect(batchers.events.clear).toBe(originals[0]?.clear);
  await Promise.resolve();
  expect(result).not.toHaveBeenCalled();
  delayed.resolve();
  await observed;
  expect(result).toHaveBeenCalledTimes(1);
});
