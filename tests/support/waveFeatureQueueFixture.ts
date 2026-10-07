import mixpanel from "mixpanel-browser";
import type { BatchSdk } from "@/services/analytics/mixpanelBatching";

type Kind = "events" | "people" | "groups";
type FixtureBatcher = NonNullable<BatchSdk["request_batchers"][Kind]> & {
  queue: { clear: () => Promise<void> };
};
const releases = new Map<Kind, () => void>();
const getBatcher = (kind: Kind): FixtureBatcher => {
  const sdk = mixpanel as typeof mixpanel & {
    request_batchers: Record<Kind, FixtureBatcher>;
  };
  return sdk.request_batchers[kind];
};

export const queueFixture = {
  seedPendingQueues: async () => {
    const payloads = {
      events: {
        event: "Withdrawn fixture event",
        properties: {
          token: "synthetic-wave-feature-pilot",
          distinct_id: "529",
          fixture_marker: "withdrawn",
        },
      },
      people: {
        $token: "synthetic-wave-feature-pilot",
        $distinct_id: "529",
        $set: { fixture_marker: "withdrawn" },
      },
      groups: {
        $token: "synthetic-wave-feature-pilot",
        $group_key: "fixture-group",
        $group_id: "fixture-group-id",
        $set: { fixture_marker: "withdrawn" },
      },
    };
    await Promise.all(
      (Object.keys(payloads) as Kind[]).map((kind) =>
        getBatcher(kind).enqueue(payloads[kind])
      )
    );
  },
  holdQueueClears: () => {
    for (const kind of ["events", "people", "groups"] as const) {
      const queue = getBatcher(kind).queue;
      const clear = queue.clear.bind(queue);
      queue.clear = () => {
        queue.clear = clear;
        return new Promise<void>((resolve) => {
          releases.set(kind, resolve);
        }).then(clear);
      };
    }
  },
  pendingQueueClears: () => [...releases.keys()],
  releaseQueueClear: (kind: Kind) => {
    releases.get(kind)?.();
    releases.delete(kind);
  },
  failQueueClearOnce: () => {
    const queue = getBatcher("events").queue;
    const clear = queue.clear.bind(queue);
    queue.clear = () => {
      queue.clear = clear;
      return Promise.reject(new Error("Synthetic queue deletion failure"));
    };
  },
};
