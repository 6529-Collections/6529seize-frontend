import type { ApiDropSignedEvents } from "@/generated/models/ApiDropSignedEvents";
import { isRecord } from "@/lib/device-signing/displayed-content";

/** The most drops one batch read may name (the API's limit). */
export const SIGNED_EVENTS_BATCH_MAX_DROPS = 50;

/** What a batch read says about one requested drop. */
export type BatchedSignedEvents =
  /** The drop's events and the grants they reference. */
  | { readonly kind: "events"; readonly signedEvents: ApiDropSignedEvents }
  /** The batch left out some of its events: read it on its own. */
  | { readonly kind: "single" }
  /** The caller cannot read the drop (the single route answers 404). */
  | { readonly kind: "unavailable" }
  /** The response does not mention the drop. */
  | { readonly kind: "missing" };

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const idKey = (id: string): string => id.toLowerCase();

const lowerCaseString = (value: unknown): string | null =>
  typeof value === "string" ? idKey(value) : null;

/**
 * One drop of the batch in the shape of the single-drop route: its events
 * and the grants they reference (the batch lists grants once, at its top
 * level). Nothing else is changed; the events are verified in full later.
 */
function toSingleDropShape(
  drop: Readonly<Record<string, unknown>>,
  batchGrants: readonly unknown[]
): ApiDropSignedEvents {
  const events: readonly unknown[] = Array.isArray(drop["events"])
    ? drop["events"]
    : [];
  const ownGrants: readonly unknown[] = Array.isArray(drop["grants"])
    ? drop["grants"]
    : [];
  const authRefs = new Set(
    events.map((event) =>
      isRecord(event) ? lowerCaseString(event["auth_ref"]) : null
    )
  );
  const grants = [...batchGrants, ...ownGrants].filter((grant) => {
    const id = isRecord(grant) ? lowerCaseString(grant["id"]) : null;
    return id !== null && authRefs.has(id);
  });
  return { ...drop, grants } as ApiDropSignedEvents;
}

/**
 * Splits a batch response into what it says about each requested drop. The
 * response is untrusted like the single route's: this only routes its data
 * by drop id, and every drop's events are still verified in full. A drop
 * listed as truncated is read again on its own. A response that is not a
 * batch at all throws, which counts as a failed read.
 */
export function splitSignedEventsBatch(
  response: unknown,
  dropIds: readonly string[]
): Map<string, BatchedSignedEvents> {
  if (
    !isRecord(response) ||
    !Array.isArray(response["drops"]) ||
    !Array.isArray(response["grants"]) ||
    !isStringList(response["unavailable"]) ||
    !isStringList(response["truncated_drop_ids"])
  ) {
    throw new TypeError("Unexpected signed events batch response");
  }
  const requested = new Set(dropIds.map(idKey));
  const found = new Map<string, BatchedSignedEvents>();
  // The first answer for a requested drop counts; a truncated drop is
  // always read again on its own.
  const answer = (dropId: string, result: BatchedSignedEvents): void => {
    const key = idKey(dropId);
    if (requested.has(key) && !found.has(key)) {
      found.set(key, result);
    }
  };
  response["truncated_drop_ids"].forEach((dropId) =>
    answer(dropId, { kind: "single" })
  );
  const batchGrants: readonly unknown[] = response["grants"];
  response["drops"].forEach((drop: unknown) => {
    if (isRecord(drop) && typeof drop["drop_id"] === "string") {
      answer(drop["drop_id"], {
        kind: "events",
        signedEvents: toSingleDropShape(drop, batchGrants),
      });
    }
  });
  response["unavailable"].forEach((dropId) =>
    answer(dropId, { kind: "unavailable" })
  );
  return new Map(
    dropIds.map((dropId) => [
      dropId,
      found.get(idKey(dropId)) ?? { kind: "missing" },
    ])
  );
}
