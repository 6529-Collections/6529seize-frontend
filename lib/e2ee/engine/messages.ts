import type { Payload } from "../payload";
import type { StoredMessage } from "../records";
import type { GroupRuntime } from "./store";

/** Contract section 6 receiver rules applied to the local timeline. */

export interface PayloadMeta {
  g: string;
  seq: number;
  serverTs: number;
  senderProfileId: string | null;
  senderDeviceKey: string | null;
  sigOk: boolean;
  epoch: number | null;
  body: string | null;
  sig: string | null;
  pending: boolean;
}

export const undecryptableId = (seq: number): string => `undecryptable-${seq}`;

function put(runtime: GroupRuntime, message: StoredMessage): void {
  runtime.messages.set(message.id, message);
  runtime.dirty.add(message.id);
}

export function placeholderMessage(meta: {
  g: string;
  seq: number;
  serverTs: number;
  epoch: number;
}): StoredMessage {
  return {
    id: undecryptableId(meta.seq),
    g: meta.g,
    seq: meta.seq,
    kind: "message",
    senderProfileId: null,
    senderDeviceKey: null,
    ts: meta.serverTs,
    serverTs: meta.serverTs,
    text: "",
    mentions: [],
    reply: null,
    attachments: [],
    editedAt: null,
    deleted: false,
    reactions: {},
    sigOk: false,
    undecryptable: true,
    pending: false,
    epoch: meta.epoch,
    body: null,
    sig: null,
  };
}

function applyMsg(
  runtime: GroupRuntime,
  payload: Extract<Payload, { t: "msg" }>,
  meta: PayloadMeta
): boolean {
  const existing = runtime.messages.get(payload.id);
  if (existing && !existing.pending) {
    return false;
  }
  put(runtime, {
    id: payload.id,
    g: meta.g,
    seq: meta.seq,
    kind: "message",
    senderProfileId: meta.senderProfileId,
    senderDeviceKey: meta.senderDeviceKey,
    ts: payload.ts,
    serverTs: meta.serverTs,
    text: payload.text,
    mentions: [...payload.mentions],
    reply: payload.reply ?? null,
    attachments: payload.att ? payload.att.map((att) => ({ ...att })) : [],
    editedAt: existing?.editedAt ?? null,
    deleted: existing?.deleted ?? false,
    reactions: existing?.reactions ?? {},
    sigOk: meta.sigOk,
    undecryptable: false,
    pending: meta.pending,
    epoch: meta.epoch,
    body: meta.body,
    sig: meta.sig,
  });
  return true;
}

/** Edit and delete only by a device of the original sender's profile. */
function sameAuthor(target: StoredMessage, meta: PayloadMeta): boolean {
  return (
    target.kind === "message" &&
    !target.undecryptable &&
    target.senderProfileId !== null &&
    target.senderProfileId === meta.senderProfileId
  );
}

function applyReaction(
  target: StoredMessage,
  reaction: string,
  profileId: string,
  on: boolean
): boolean {
  const current = target.reactions[reaction] ?? [];
  const has = current.includes(profileId);
  if (on === has) {
    return false;
  }
  const next = on ? [...current, profileId] : current.filter((id) => id !== profileId);
  const reactions = { ...target.reactions };
  if (next.length > 0) {
    reactions[reaction] = next;
  } else {
    delete reactions[reaction];
  }
  target.reactions = reactions;
  return true;
}

function applyTargeted(
  runtime: GroupRuntime,
  payload: Exclude<Payload, { t: "msg" }>,
  meta: PayloadMeta
): boolean {
  const target = runtime.messages.get(payload.target);
  if (!target || target.kind !== "message") {
    return false;
  }
  let changed = false;
  if (payload.t === "edit" || payload.t === "del") {
    if (!sameAuthor(target, meta) || target.deleted) {
      return false;
    }
    if (payload.t === "edit") {
      target.text = payload.text;
      target.mentions = [...payload.mentions];
      target.editedAt = payload.ts;
    } else {
      target.deleted = true;
      target.text = "";
      target.attachments = [];
      target.mentions = [];
    }
    changed = true;
  } else if (meta.senderProfileId !== null) {
    changed = applyReaction(
      target,
      payload.r,
      meta.senderProfileId,
      payload.t === "react"
    );
  }
  if (changed) {
    runtime.dirty.add(target.id);
  }
  return changed;
}

/**
 * Applies a payload to the timeline; returns whether anything changed.
 * Payloads failing the sender-signature check only render as messages
 * (flagged) and never edit, delete or react.
 */
export function applyPayload(
  runtime: GroupRuntime,
  payload: Payload,
  meta: PayloadMeta
): boolean {
  if (payload.t === "msg") {
    return applyMsg(runtime, payload, meta);
  }
  if (!meta.sigOk) {
    return false;
  }
  return applyTargeted(runtime, payload, meta);
}

export function searchMessages(
  runtimes: Iterable<GroupRuntime>,
  query: string
): StoredMessage[] {
  const needle = query.trim().toLocaleLowerCase();
  if (needle.length === 0) {
    return [];
  }
  const out: StoredMessage[] = [];
  for (const runtime of runtimes) {
    for (const message of runtime.messages.values()) {
      const searchable =
        message.kind === "message" && !message.deleted && !message.undecryptable;
      if (searchable && message.text.toLocaleLowerCase().includes(needle)) {
        out.push(message);
      }
    }
  }
  return out.sort((a, b) => b.serverTs - a.serverTs || b.seq - a.seq);
}
