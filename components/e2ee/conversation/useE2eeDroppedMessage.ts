import { useState } from "react";
import type { E2eeMessage } from "@/lib/e2ee/types";

export interface E2eeDroppedMessage {
  readonly id: string;
  readonly text: string;
}

const pendingOwnMessages = (
  messages: readonly E2eeMessage[],
  selfProfileId: string | null
): ReadonlyMap<string, string> => {
  const pending = new Map<string, string>();
  for (const message of messages) {
    if (
      message.kind === "message" &&
      message.pending &&
      message.senderProfileId === selfProfileId
    ) {
      pending.set(message.id, message.text);
    }
  }
  return pending;
};

const keysOf = (map: ReadonlyMap<string, string>) => [...map.keys()].join(",");

/**
 * The engine retries network failures but removes an outgoing message the
 * delivery service refuses. This remembers this device's pending messages
 * and reports one that disappears without being sequenced, so the chat can
 * say so and offer its text back instead of letting it vanish.
 */
export function useE2eeDroppedMessage(
  messages: readonly E2eeMessage[],
  selfProfileId: string | null
): {
  readonly dropped: E2eeDroppedMessage | null;
  readonly dismiss: () => void;
} {
  const [pending, setPending] = useState<ReadonlyMap<string, string>>(
    () => new Map()
  );
  const [dropped, setDropped] = useState<E2eeDroppedMessage | null>(null);
  const current = pendingOwnMessages(messages, selfProfileId);
  if (keysOf(current) !== keysOf(pending)) {
    const present = new Set(messages.map((message) => message.id));
    let lost: E2eeDroppedMessage | null = null;
    for (const [id, text] of pending) {
      if (!present.has(id)) {
        lost = { id, text };
      }
    }
    setPending(current);
    if (lost) {
      setDropped(lost);
    }
  }
  return { dropped, dismiss: () => setDropped(null) };
}
