import { asE2eeApiError } from "../api";
import type { ApiE2eeNotifyHint, ApiE2eeNotifyKind } from "../api-types";
import { mediaFromFile, uploadMedia } from "../media";
import {
  encodePayload,
  newMessageId,
  PayloadError,
  type MsgPayload,
  type Payload,
  type PayloadAttachment,
} from "../payload";
import type { StoredMessage, StoredOutboxItem } from "../records";
import type { E2eeImported } from "../types";
import {
  checkpoint,
  isActive,
  ownDeviceKey,
  requireActiveGroup,
  requireMls,
  type EngineContext,
} from "./context";
import { E2eeError, RetryableError } from "./errors";
import {
  importedText,
  isDuplicateImport,
  isValidImported,
  toImportedPayload,
} from "./imported";
import { applyPayload } from "./messages";
import type { GroupRuntime } from "./store";
import { catchUpGroup } from "./sync";

/** Outbox, local echo and message submission (3.4, 6, 8.3). */

const MAX_NOTIFY = 200;

const isNetworkish = (error: unknown): boolean => {
  if (error instanceof RetryableError) {
    return true;
  }
  const apiError = asE2eeApiError(error);
  return (
    apiError !== null &&
    (apiError.status === 0 || apiError.status >= 500 || apiError.status === 429)
  );
};

function hintKind(
  profileId: string,
  mentions: ReadonlySet<string>,
  replyAuthor: string | null
): ApiE2eeNotifyKind {
  if (mentions.has(profileId)) {
    return "mention";
  }
  return profileId === replyAuthor ? "reply" : "message";
}

/** Content-free hints: profile ids and a kind only, never text (7.3). */
function computeNotify(
  ctx: EngineContext,
  runtime: GroupRuntime,
  payload: Payload
): ApiE2eeNotifyHint[] {
  // Imported history is old news: it never wakes anyone.
  if (payload.t !== "msg" || payload.imp) {
    return [];
  }
  const recipients = new Set<string>();
  for (const member of runtime.record.members) {
    if (member.profileId !== null && member.profileId !== ctx.profileId) {
      recipients.add(member.profileId);
    }
  }
  const mentions = new Set(payload.mentions);
  const replyAuthor = payload.reply
    ? (runtime.messages.get(payload.reply)?.senderProfileId ?? null)
    : null;
  return [...recipients]
    .map((profileId) => ({
      profile_id: profileId,
      kind: hintKind(profileId, mentions, replyAuthor),
    }))
    .slice(0, MAX_NOTIFY);
}

function validate(payload: Payload): void {
  try {
    encodePayload(payload);
  } catch (error) {
    if (error instanceof PayloadError) {
      throw new E2eeError("E2EE_INVALID_INPUT", error.code);
    }
    throw error;
  }
}

function localEcho(
  ctx: EngineContext,
  g: string,
  payload: MsgPayload
): StoredMessage {
  return {
    id: payload.id,
    g,
    seq: 0,
    kind: "message",
    senderProfileId: ctx.profileId,
    senderDeviceKey: ownDeviceKey(ctx),
    ts: payload.ts,
    serverTs: payload.ts,
    text: payload.text,
    mentions: [...payload.mentions],
    reply: payload.reply ?? null,
    attachments: payload.att ?? [],
    editedAt: null,
    deleted: false,
    reactions: {},
    sigOk: true,
    undecryptable: false,
    pending: true,
    epoch: null,
    body: null,
    sig: null,
    ...(payload.imp ? { imported: payload.imp } : {}),
  };
}

async function enqueue(
  ctx: EngineContext,
  runtime: GroupRuntime,
  payload: Payload
): Promise<void> {
  validate(payload);
  const item: StoredOutboxItem = {
    id: payload.id,
    g: runtime.record.g,
    payload,
    notify: computeNotify(ctx, runtime, payload),
    createdAt: ctx.now(),
    sealed: null,
  };
  await ctx.queue.run(async () => {
    if (payload.t === "msg") {
      const echo = localEcho(ctx, runtime.record.g, payload);
      runtime.messages.set(echo.id, echo);
      runtime.dirty.add(echo.id);
    } else {
      applyPayload(runtime, payload, {
        g: runtime.record.g,
        seq: 0,
        serverTs: payload.ts,
        senderProfileId: ctx.profileId,
        senderDeviceKey: ownDeviceKey(ctx),
        sigOk: true,
        epoch: null,
        body: null,
        sig: null,
        pending: true,
      });
    }
    runtime.outbox.set(item.id, item);
    await checkpoint(ctx, {
      groups: [runtime],
      outbox: [item],
      skipWasm: true,
    });
    ctx.store.touch(runtime.record.g);
  });
}

export async function queueMessage(
  ctx: EngineContext,
  g: string,
  input: {
    text: string;
    mentions?: string[];
    reply?: string | null;
    files?: File[];
  }
): Promise<void> {
  const runtime = requireActiveGroup(ctx, g);
  const attachments: PayloadAttachment[] = [];
  for (const file of input.files ?? []) {
    attachments.push(
      await uploadMedia({
        api: ctx.api,
        g: runtime.record.g,
        deviceKey: ownDeviceKey(ctx),
        media: await mediaFromFile(file),
      })
    );
  }
  const payload: MsgPayload = {
    v: 1,
    t: "msg",
    id: newMessageId(),
    ts: ctx.now(),
    text: input.text,
    mentions: [...new Set(input.mentions ?? [])],
  };
  if (input.reply) {
    payload.reply = input.reply;
  }
  if (attachments.length > 0) {
    payload.att = attachments;
  }
  await enqueue(ctx, runtime, payload);
}

/**
 * Queues one message moved from an unencrypted DM (D146). Returns false,
 * sending nothing, when the chat already holds a copy of that original.
 */
export async function queueImported(
  ctx: EngineContext,
  g: string,
  input: {
    text: string;
    imported: E2eeImported;
    reply?: string | null;
    files?: File[];
  }
): Promise<boolean> {
  const runtime = requireActiveGroup(ctx, g);
  const { text, headerLength } = importedText(input.imported, input.text);
  const imp = toImportedPayload(input.imported, headerLength);
  if (!isValidImported(imp, text)) {
    throw new E2eeError("E2EE_INVALID_INPUT", "E2EE_IMPORT_INVALID");
  }
  const id = newMessageId();
  if (isDuplicateImport(runtime, id, imp)) {
    return false;
  }
  const attachments: PayloadAttachment[] = [];
  for (const file of input.files ?? []) {
    attachments.push(
      await uploadMedia({
        api: ctx.api,
        g: runtime.record.g,
        deviceKey: ownDeviceKey(ctx),
        media: await mediaFromFile(file),
      })
    );
  }
  const payload: MsgPayload = {
    v: 1,
    t: "msg",
    id,
    ts: ctx.now(),
    text,
    mentions: [],
    imp,
  };
  if (input.reply) {
    payload.reply = input.reply;
  }
  if (attachments.length > 0) {
    payload.att = attachments;
  }
  await enqueue(ctx, runtime, payload);
  return true;
}

export async function queueTargeted(
  ctx: EngineContext,
  g: string,
  build: (base: { v: 1; id: string; ts: number }) => Payload
): Promise<void> {
  const runtime = requireActiveGroup(ctx, g);
  await enqueue(
    ctx,
    runtime,
    build({ v: 1, id: newMessageId(), ts: ctx.now() })
  );
}

type SendStep = "sent" | "empty" | "stale" | "failed" | "dropped" | "inactive";

const oldestOutbox = (runtime: GroupRuntime): StoredOutboxItem | null =>
  [...runtime.outbox.values()].sort((a, b) => a.createdAt - b.createdAt)[0] ??
  null;

async function markSent(
  ctx: EngineContext,
  runtime: GroupRuntime,
  item: StoredOutboxItem,
  sent: { seq: number; created_at: number }
): Promise<void> {
  runtime.outbox.delete(item.id);
  runtime.record.sentSeqs.push(sent.seq);
  const echo = runtime.messages.get(item.id);
  if (echo && item.payload.t === "msg") {
    echo.pending = false;
    echo.seq = sent.seq;
    echo.serverTs = sent.created_at;
    runtime.dirty.add(echo.id);
  }
  runtime.record.updatedAt = Math.max(
    runtime.record.updatedAt,
    sent.created_at
  );
  await checkpoint(ctx, {
    groups: [runtime],
    deleteOutbox: [item.id],
    skipWasm: true,
  });
  ctx.store.touch(runtime.record.g);
}

async function dropItem(
  ctx: EngineContext,
  runtime: GroupRuntime,
  item: StoredOutboxItem,
  code: string | null
): Promise<void> {
  runtime.outbox.delete(item.id);
  if (
    item.payload.t === "msg" &&
    runtime.messages.get(item.id)?.pending === true
  ) {
    runtime.messages.delete(item.id);
    runtime.dirty.delete(item.id);
    runtime.deleted.add(item.id);
  }
  ctx.store.error = code ?? "E2EE_SEND_FAILED";
  await checkpoint(ctx, {
    groups: [runtime],
    deleteOutbox: [item.id],
    skipWasm: true,
  });
  ctx.store.touch(runtime.record.g);
}

/** Encrypts and submits the oldest outbox item. Runs inside the queue. */
export async function sendNext(
  ctx: EngineContext,
  runtime: GroupRuntime
): Promise<SendStep> {
  if (!isActive(runtime)) {
    return "inactive";
  }
  try {
    await catchUpGroup(ctx, runtime);
  } catch (error) {
    if (isNetworkish(error)) {
      return "failed";
    }
    throw error;
  }
  const item = oldestOutbox(runtime);
  if (!isActive(runtime)) {
    return "inactive";
  }
  if (!item) {
    return "empty";
  }
  const sealed = requireMls(ctx).encryptMessage(
    runtime.record.g,
    encodePayload(item.payload)
  );
  item.sealed = {
    epoch: sealed.epoch,
    data: sealed.data,
    epochFp: sealed.epoch_fp,
  };
  await checkpoint(ctx, { groups: [runtime], outbox: [item] });
  try {
    const sent = await ctx.api.sendMessage(runtime.record.g, {
      epoch: sealed.epoch,
      data: sealed.data,
      epoch_fp: sealed.epoch_fp,
      sender_device_key: ownDeviceKey(ctx),
      ...(item.notify.length > 0 ? { notify: item.notify } : {}),
    });
    await markSent(ctx, runtime, item, sent);
    return "sent";
  } catch (error) {
    const apiError = asE2eeApiError(error);
    if (!apiError || isNetworkish(error)) {
      return "failed";
    }
    item.sealed = null;
    if (apiError.code === "E2EE_EPOCH_STALE") {
      await checkpoint(ctx, {
        groups: [runtime],
        outbox: [item],
        skipWasm: true,
      });
      return "stale";
    }
    await dropItem(ctx, runtime, item, apiError.code);
    return "dropped";
  }
}
