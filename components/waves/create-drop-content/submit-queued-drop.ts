import type { ApiDrop } from "@/generated/models/ApiDrop";
import {
  postIdempotentDrop,
  withoutClientDropId,
} from "@/services/api/idempotent-drop-create";
import type { QueuedDropMutationBody } from "./drop-submission.types";

/** Sends one queued drop: a competition entry, or a drop create. */
export function submitQueuedDrop(
  body: QueuedDropMutationBody
): Promise<ApiDrop> {
  // A competition entry carries its own idempotency key.
  if (body.nativeEntrySubmit) {
    return body.nativeEntrySubmit(withoutClientDropId(body.drop));
  }
  return postIdempotentDrop(body.drop);
}
