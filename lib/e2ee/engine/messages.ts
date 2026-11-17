import { isDuplicateImport } from "./imported";
import {
  isValidPollBallot,
  type MsgPayload,
  type Payload,
  type PollPayload,
} from "../payload";
import type { SignedVersion, StoredGroup, StoredMessage } from "../records";
import { verifiedPollRoster } from "./poll-roster";
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

function messageContent(
  record: StoredGroup,
  payload: MsgPayload | PollPayload,
  epoch: number | null
): Pick<
  StoredMessage,
  "text" | "mentions" | "reply" | "attachments" | "poll" | "imported"
> | null {
  if (payload.t === "poll") {
    const eligibleDeviceKeys = verifiedPollRoster(
      record,
      epoch,
      payload.rosterHash
    );
    if (!eligibleDeviceKeys) return null;
    return {
      text: payload.poll.question,
      mentions: [],
      reply: null,
      attachments: [],
      poll: { ...payload.poll, eligibleDeviceKeys, ballots: {}, closed: false },
    };
  }
  return {
    text: payload.text,
    mentions: [...payload.mentions],
    reply: payload.reply ?? null,
    attachments: payload.att?.map((attachment) => ({ ...attachment })) ?? [],
    ...(payload.imp ? { imported: payload.imp } : {}),
  };
}

function applyMsg(
  runtime: GroupRuntime,
  payload: MsgPayload | PollPayload,
  meta: PayloadMeta
): boolean {
  const existing = runtime.messages.get(payload.id);
  if (existing && !existing.pending) {
    return false;
  }
  if (
    payload.t === "msg" &&
    payload.imp &&
    isDuplicateImport(runtime, payload.id, payload.imp)
  )
    return false;
  const content = messageContent(runtime.record, payload, meta.epoch);
  if (!content) return false;
  put(runtime, {
    id: payload.id,
    g: meta.g,
    seq: meta.seq,
    kind: "message",
    senderProfileId: meta.senderProfileId,
    senderDeviceKey: meta.senderDeviceKey,
    ts: payload.ts,
    serverTs: meta.serverTs,
    ...content,
    editedAt: existing?.editedAt ?? null,
    ...(existing?.latestEdit === undefined
      ? {}
      : { latestEdit: existing.latestEdit }),
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

/** The applied payload's own signed copy, or null when there is none. */
function signedVersion(meta: PayloadMeta): SignedVersion | null {
  if (
    meta.body === null ||
    meta.sig === null ||
    meta.epoch === null ||
    meta.senderDeviceKey === null
  ) {
    return null;
  }
  return {
    epoch: meta.epoch,
    body: meta.body,
    sig: meta.sig,
    senderDeviceKey: meta.senderDeviceKey,
  };
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
  const next = on
    ? [...current, profileId]
    : current.filter((id) => id !== profileId);
  const reactions = { ...target.reactions };
  if (next.length > 0) {
    reactions[reaction] = next;
  } else {
    delete reactions[reaction];
  }
  target.reactions = reactions;
  return true;
}

function applyPollUpdate(
  target: StoredMessage,
  payload: Extract<Payload, { t: "poll-vote" | "poll-close" }>,
  meta: PayloadMeta
): boolean {
  const poll = target.poll;
  const voter = meta.senderProfileId;
  if (
    !poll ||
    target.deleted ||
    poll.closed ||
    meta.seq <= target.seq ||
    voter === null
  ) {
    return false;
  }
  if (payload.t === "poll-close") {
    if (!sameAuthor(target, meta)) return false;
    target.poll = { ...poll, closed: true };
    return true;
  }
  if (
    !meta.senderDeviceKey ||
    !poll.eligibleDeviceKeys.includes(meta.senderDeviceKey) ||
    !isValidPollBallot(poll, payload.options)
  )
    return false;

  const previous = Object.hasOwn(poll.ballots, voter)
    ? poll.ballots[voter]
    : undefined;
  if (previous && meta.seq <= previous.seq) return false;
  target.poll = {
    ...poll,
    ballots: {
      ...poll.ballots,
      [voter]: { seq: meta.seq, options: payload.options },
    },
  };
  return true;
}

function applyTargeted(
  runtime: GroupRuntime,
  payload: Exclude<Payload, MsgPayload | PollPayload>,
  meta: PayloadMeta
): boolean {
  const target = runtime.messages.get(payload.target);
  if (target?.kind !== "message") {
    return false;
  }
  let changed = false;
  if (payload.t === "edit" || payload.t === "del") {
    if (!sameAuthor(target, meta) || target.deleted) {
      return false;
    }
    if (payload.t === "edit") {
      if (target.poll) return false;
      target.text = payload.text;
      target.mentions = [...payload.mentions];
      target.editedAt = payload.ts;
      target.latestEdit = signedVersion(meta);
    } else {
      target.deleted = true;
      target.text = "";
      target.attachments = [];
      target.mentions = [];
      target.latestEdit = null;
      delete target.poll;
    }
    changed = true;
  } else if (payload.t === "poll-vote" || payload.t === "poll-close") {
    changed = applyPollUpdate(target, payload, meta);
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
  if (payload.t === "poll") {
    return (
      meta.senderProfileId !== null &&
      runtime.record.metadata.kind === "group" &&
      applyMsg(runtime, payload, meta)
    );
  }
  return applyTargeted(runtime, payload, meta);
}

export function searchMessages(
  runtimes: Iterable<Pick<GroupRuntime, "messages">>,
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
        message.kind === "message" &&
        !message.deleted &&
        !message.undecryptable;
      if (searchable && message.text.toLocaleLowerCase().includes(needle)) {
        out.push(message);
      }
    }
  }
  return out.sort((a, b) => b.serverTs - a.serverTs || b.seq - a.seq);
}
