import { getDmPeerId } from "../dm-conversations";
import { compareHistory } from "../history-order";
import { safetyCodeFromFp } from "../digests";
import { parseCredentialIdentity } from "../grant";
import type { PayloadAttachment } from "../payload";
import type { StoredGroup, StoredMessage, StoredOutboxItem } from "../records";
import type {
  E2eeAttachment,
  E2eeConversation,
  E2eeDeviceInfo,
  E2eeEngineStatus,
  E2eeMember,
  E2eeMessage,
  E2eeUntrustedDevice,
} from "../types";
import type { DeviceDirectory } from "./directory";
import { displayText, fromImportedPayload } from "./imported";

/** In-memory engine state plus immutable snapshots for the UI. */

export interface GroupRuntime {
  record: StoredGroup;
  messages: Map<string, StoredMessage>;
  originals: Map<string, StoredMessage>;
  windowIds: Set<string> | null;
  followingLatest: boolean;
  historyLoaded: boolean;
  historyError?: boolean;
  /** Message ids changed since the last checkpoint. */
  dirty: Set<string>;
  /** Message ids removed since the last checkpoint. */
  deleted: Set<string>;
  outbox: Map<string, StoredOutboxItem>;
  /** First failure time of the current stall (8.3), null when healthy. */
  stallSince: number | null;
}

interface ProfileInfo {
  handle: string | null;
  pfp: string | null;
  wallets: string[];
}

const toAttachment = (att: PayloadAttachment): E2eeAttachment => {
  const out: E2eeAttachment = {
    blob: att.blob,
    mime: att.mime,
    size: att.size,
    name: att.name,
  };
  if (att.w !== undefined) {
    out.width = att.w;
  }
  if (att.h !== undefined) {
    out.height = att.h;
  }
  return out;
};

export function toE2eeMessage(stored: StoredMessage): E2eeMessage {
  const message: E2eeMessage = {
    id: stored.id,
    g: stored.g,
    seq: stored.seq,
    kind: stored.kind,
    senderProfileId: stored.senderProfileId,
    senderDeviceKey: stored.senderDeviceKey,
    ts: stored.ts,
    serverTs: stored.serverTs,
    text: stored.deleted ? "" : displayText(stored),
    mentions: [...stored.mentions],
    reply: stored.reply,
    attachments: stored.deleted ? [] : stored.attachments.map(toAttachment),
    editedAt: stored.editedAt,
    deleted: stored.deleted,
    reactions: Object.fromEntries(
      Object.entries(stored.reactions)
        .filter(([, profiles]) => profiles.length > 0)
        .map(([reaction, profiles]) => [reaction, [...profiles]])
    ),
    sigOk: stored.sigOk,
    undecryptable: stored.undecryptable,
    pending: stored.pending,
  };
  if (stored.imported) {
    message.imported = fromImportedPayload(stored.imported, stored.serverTs);
  }
  if (stored.notice) {
    message.notice = {
      type: stored.notice.type,
      actorProfileId: stored.notice.actorProfileId,
      targetProfileIds: [...stored.notice.targetProfileIds],
      ...(stored.notice.detail === undefined
        ? {}
        : { detail: stored.notice.detail }),
    };
  }
  return message;
}

/** Ascending seq; notices of one commit keep their order; pending last. */
export const compareMessages = compareHistory;

const isCountable = (message: StoredMessage, own: string): boolean =>
  message.kind === "message" &&
  !message.pending &&
  !message.deleted &&
  message.senderProfileId !== own;

export class EngineStore {
  status: E2eeEngineStatus = "loading";
  error: string | null = null;
  thisDevice: E2eeDeviceInfo | null = null;
  devices: E2eeDeviceInfo[] = [];
  /** Server switch (GET /e2ee/me); false until the server has answered. */
  attachmentsEnabled = false;
  readonly groups = new Map<string, GroupRuntime>();
  readonly profiles = new Map<string, ProfileInfo>();
  /** profile id -> devices waiting for "Add device" (engine/trust.ts). */
  private readonly untrusted = new Map<string, E2eeUntrustedDevice[]>();
  private readonly listeners = new Set<() => void>();
  private conversationsCache: E2eeConversation[] | null = null;
  private readonly conversationCache = new Map<string, E2eeConversation>();
  private readonly messagesCache = new Map<string, E2eeMessage[]>();
  private notifyScheduled = false;
  private readonly messageSnapshots = new WeakMap<StoredMessage, E2eeMessage>();
  private directoryVersion = -1;
  private readonly ownProfileId: string;
  private readonly directory: DeviceDirectory;

  constructor(ownProfileId: string, directory: DeviceDirectory) {
    this.ownProfileId = ownProfileId;
    this.directory = directory;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Invalidates snapshots for `g` (or everything) and notifies listeners. */
  touch(g?: string): void {
    this.conversationsCache = null;
    if (g === undefined) {
      this.conversationCache.clear();
      this.messagesCache.clear();
    } else {
      this.conversationCache.delete(g);
      this.messagesCache.delete(g);
    }
    if (this.notifyScheduled) {
      return;
    }
    this.notifyScheduled = true;
    setTimeout(() => {
      this.notifyScheduled = false;
      for (const listener of [...this.listeners]) {
        try {
          listener();
        } catch {
          // A listener failure must not break the engine.
        }
      }
    }, 16);
  }

  /**
   * Replaces the untrusted devices found for `profileId`. Entries are kept
   * per person, so every chat with that person shows the same list.
   */
  setUntrusted(profileId: string, devices: E2eeUntrustedDevice[]): void {
    const normalized = devices.map((item) => ({
      ...item,
      deviceKey: item.deviceKey.toLowerCase(),
      wallet: item.wallet.toLowerCase(),
    }));
    const signature = (list: readonly E2eeUntrustedDevice[]) =>
      list.map((item) => `${item.deviceKey}:${item.reason}`).join(",");
    const previous = this.untrusted.get(profileId) ?? [];
    if (signature(previous) === signature(normalized)) {
      return;
    }
    if (normalized.length === 0) {
      this.untrusted.delete(profileId);
    } else {
      this.untrusted.set(profileId, normalized);
    }
    this.touch();
  }

  findUntrusted(deviceKey: string): E2eeUntrustedDevice | null {
    const key = deviceKey.toLowerCase();
    for (const list of this.untrusted.values()) {
      const found = list.find((item) => item.deviceKey === key);
      if (found) {
        return found;
      }
    }
    return null;
  }

  /** Clears the device from every person's list, hence from every chat. */
  dropUntrusted(deviceKey: string): void {
    const key = deviceKey.toLowerCase();
    for (const [profileId, list] of [...this.untrusted]) {
      if (list.some((item) => item.deviceKey === key)) {
        this.setUntrusted(
          profileId,
          list.filter((item) => item.deviceKey !== key)
        );
      }
    }
  }

  private untrustedFor(record: StoredGroup): E2eeUntrustedDevice[] {
    if (record.status !== "active") {
      return [];
    }
    const principals = new Set(
      record.members
        .filter((member) => !record.leaving.includes(member.deviceKey))
        .map((member) => member.profileId)
    );
    return [...principals].flatMap((profileId) =>
      profileId === null ? [] : [...(this.untrusted.get(profileId) ?? [])]
    );
  }

  private syncDirectoryVersion(): void {
    if (this.directory.version !== this.directoryVersion) {
      this.directoryVersion = this.directory.version;
      this.conversationsCache = null;
      this.conversationCache.clear();
    }
  }

  getConversations(): E2eeConversation[] {
    this.syncDirectoryVersion();
    if (!this.conversationsCache) {
      const list: E2eeConversation[] = [];
      for (const g of this.groups.keys()) {
        const conversation = this.getConversation(g);
        if (conversation) {
          list.push(conversation);
        }
      }
      list.sort((a, b) => b.updatedAt - a.updatedAt);
      this.conversationsCache = list;
    }
    return this.conversationsCache;
  }

  getConversation(g: string): E2eeConversation | null {
    this.syncDirectoryVersion();
    const runtime = this.groups.get(g);
    if (!runtime) {
      return null;
    }
    let conversation = this.conversationCache.get(g);
    if (!conversation) {
      conversation = this.buildConversation(runtime);
      this.conversationCache.set(g, conversation);
    }
    return conversation;
  }

  getMessages(g: string): E2eeMessage[] {
    const runtime = this.groups.get(g);
    if (!runtime) {
      return [];
    }
    let messages = this.messagesCache.get(g);
    if (!messages) {
      messages = [...runtime.messages.values()]
        .filter(
          (message) =>
            runtime.windowIds === null ||
            runtime.windowIds.has(message.id) ||
            message.pending
        )
        .sort(compareMessages)
        .map((message) => {
          // A log page can publish progress before its atomic checkpoint.
          // Dirty objects are mutable; only committed identities are cacheable.
          if (runtime.dirty.has(message.id)) return toE2eeMessage(message);
          let snapshot = this.messageSnapshots.get(message);
          if (!snapshot) {
            snapshot = toE2eeMessage(message);
            this.messageSnapshots.set(message, snapshot);
          }
          return snapshot;
        });
      this.messagesCache.set(g, messages);
    }
    return messages;
  }

  private buildMembers(record: StoredGroup): E2eeMember[] {
    const byProfile = new Map<string, E2eeMember>();
    for (const member of record.members) {
      if (member.profileId === null) {
        continue;
      }
      let entry = byProfile.get(member.profileId);
      if (!entry) {
        const profile = this.profiles.get(member.profileId);
        entry = {
          profileId: member.profileId,
          handle: profile?.handle ?? null,
          pfp: profile?.pfp ?? null,
          wallets: [...(profile?.wallets ?? [])],
          isAdmin: record.metadata.admins.includes(member.profileId),
          devices: [],
        };
        byProfile.set(member.profileId, entry);
      }
      const cached = this.directory.cached(member.deviceKey);
      entry.devices.push({
        deviceKey: member.deviceKey,
        label: cached?.label ?? "Device",
        verified: this.directory.isVerified(member.deviceKey),
        wallet:
          parseCredentialIdentity(member.identity)?.wallet ??
          cached?.grant.wallet.toLowerCase() ??
          null,
      });
    }
    return [...byProfile.values()];
  }

  private buildDmPeer(
    record: StoredGroup,
    members: E2eeMember[]
  ): E2eeMember | null {
    const peerId = getDmPeerId(
      { ...record.metadata, members },
      this.ownProfileId
    );
    const profile = peerId ? this.profiles.get(peerId) : null;
    const dmPeer = peerId
      ? (members.find((member) => member.profileId === peerId) ?? {
          profileId: peerId,
          handle: profile?.handle ?? null,
          pfp: profile?.pfp ?? null,
          wallets: [...(profile?.wallets ?? [])],
          isAdmin: true,
          devices: [],
        })
      : null;
    return dmPeer;
  }

  private buildConversation(runtime: GroupRuntime): E2eeConversation {
    const record = runtime.record;
    const ordered = record.history
      ? []
      : [...runtime.messages.values()].sort(compareMessages);
    let last: StoredMessage | null = null;
    let unread = 0;
    let mentions = 0;
    for (const message of ordered) {
      if (message.kind === "message") {
        last = message;
      }
      if (
        isCountable(message, this.ownProfileId) &&
        message.seq > record.readSeq
      ) {
        unread += 1;
        if (message.mentions.includes(this.ownProfileId)) {
          mentions += 1;
        }
      }
    }
    if (record.history) {
      last = record.history.last;
      unread = record.history.unread;
      mentions = record.history.mentions;
      const pending = [...runtime.messages.values()]
        .filter((message) => message.pending && message.kind === "message")
        .sort(compareMessages)
        .at(-1);
      if (pending) last = pending;
    }
    const members = this.buildMembers(record);
    const dmPeer = this.buildDmPeer(record, members);
    return {
      dmPeer,
      g: record.g,
      kind: record.metadata.kind,
      name: record.metadata.name,
      members,
      admins: [...record.metadata.admins],
      createdBy: record.metadata.created_by,
      epoch: record.epoch,
      safetyCode: safetyCodeFromFp(record.epochFp),
      status: record.status,
      delayed: record.delayed,
      splitView: record.splitView,
      untrustedDevices: this.untrustedFor(record),
      lastMessage: last ? toE2eeMessage(last) : null,
      unread,
      mentions,
      historyError: runtime.historyError === true,
      updatedAt: Math.max(record.updatedAt, last?.serverTs ?? 0, last?.ts ?? 0),
    };
  }
}
