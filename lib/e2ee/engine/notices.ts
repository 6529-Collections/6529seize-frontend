import { parseCredentialIdentity } from "../grant";
import type { StoredMessage, StoredNotice } from "../records";
import type { GroupMetadata } from "../wasm-types";
import type { MemberRef } from "./required-changes";

/** Contract 8.6 timeline notices derived from a merged commit (pure). */

export interface CommitChange {
  committerProfileId: string | null;
  membersBefore: readonly MemberRef[];
  added: readonly MemberRef[];
  removed: readonly MemberRef[];
  metadataBefore: GroupMetadata;
  metadataAfter: GroupMetadata;
  /** Device keys removed because their principal proposed leaving. */
  leaving: ReadonlySet<string>;
  /** The epoch-0 creation commit by the creator. */
  creation: boolean;
  /** device key -> lowercase wallet in the added leaf's credential. */
  addedWallets?: ReadonlyMap<string, string>;
  /**
   * Added device keys this device has not verified for their owner (wallet
   * not trusted for them here, or signature not checked here).
   */
  unverifiedAdds?: ReadonlySet<string>;
}

/** Wallets that signed the added leaves' grants, for the notice. */
export function credentialWallets(
  leaves: readonly { device_key: string; identity: string }[]
): Map<string, string> {
  const out = new Map<string, string>();
  for (const leaf of leaves) {
    const credential = parseCredentialIdentity(leaf.identity);
    if (credential) {
      out.set(leaf.device_key.toLowerCase(), credential.wallet);
    }
  }
  return out;
}

const principalsOf = (members: readonly MemberRef[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const member of members) {
    if (member.profileId !== null) {
      counts.set(member.profileId, (counts.get(member.profileId) ?? 0) + 1);
    }
  }
  return counts;
};

function membersAfter(change: CommitChange): MemberRef[] {
  const removedKeys = new Set(change.removed.map((member) => member.deviceKey));
  return [
    ...change.membersBefore.filter(
      (member) => !removedKeys.has(member.deviceKey)
    ),
    ...change.added,
  ];
}

function departureNotices(
  change: CommitChange,
  gone: string[]
): StoredNotice[] {
  const left: string[] = [];
  const removed: string[] = [];
  for (const profileId of gone) {
    const leaves = change.removed.filter(
      (member) => member.profileId === profileId
    );
    const voluntary =
      profileId === change.committerProfileId ||
      leaves.every((member) => change.leaving.has(member.deviceKey));
    (voluntary ? left : removed).push(profileId);
  }
  const notices: StoredNotice[] = [];
  for (const profileId of left) {
    notices.push({
      type: "left",
      actorProfileId: profileId,
      targetProfileIds: [profileId],
    });
  }
  if (removed.length > 0) {
    notices.push({
      type: "removed",
      actorProfileId: change.committerProfileId,
      targetProfileIds: removed,
    });
  }
  return notices;
}

interface AddedDevices {
  owners: Set<string>;
  wallets: Set<string>;
}

/**
 * "device_added" notices for new devices of existing members: verified
 * devices share one notice, devices not verified for their owner here get
 * their own, marked `unverified`, so its copy can say so.
 */
function addedDeviceNotices(
  change: CommitChange,
  before: Map<string, number>
): StoredNotice[] {
  const verified: AddedDevices = { owners: new Set(), wallets: new Set() };
  const unverified: AddedDevices = { owners: new Set(), wallets: new Set() };
  for (const member of change.added) {
    if (member.profileId === null || !before.has(member.profileId)) {
      continue;
    }
    const group = change.unverifiedAdds?.has(member.deviceKey)
      ? unverified
      : verified;
    group.owners.add(member.profileId);
    const wallet = change.addedWallets?.get(member.deviceKey);
    if (wallet) {
      group.wallets.add(wallet);
    }
  }
  const notices: StoredNotice[] = [];
  for (const group of [verified, unverified]) {
    if (group.owners.size === 0) {
      continue;
    }
    notices.push({
      type: "device_added",
      actorProfileId: change.committerProfileId,
      targetProfileIds: [...group.owners],
      // The signing wallets, comma separated (shown with the notice).
      ...(group.wallets.size > 0
        ? { detail: [...group.wallets].join(",") }
        : {}),
      ...(group === unverified ? { unverified: true } : {}),
    });
  }
  return notices;
}

function deviceNotices(
  change: CommitChange,
  before: Map<string, number>,
  after: Map<string, number>
): StoredNotice[] {
  const removedFor = new Set<string>();
  for (const member of change.removed) {
    if (member.profileId !== null && after.has(member.profileId)) {
      removedFor.add(member.profileId);
    }
  }
  const notices = addedDeviceNotices(change, before);
  if (removedFor.size > 0) {
    notices.push({
      type: "device_removed",
      actorProfileId: change.committerProfileId,
      targetProfileIds: [...removedFor],
    });
  }
  return notices;
}

function metadataNotices(change: CommitChange): StoredNotice[] {
  const notices: StoredNotice[] = [];
  const before = change.metadataBefore;
  const after = change.metadataAfter;
  if (before.name !== after.name) {
    notices.push({
      type: "renamed",
      actorProfileId: change.committerProfileId,
      targetProfileIds: [],
      detail: after.name ?? "",
    });
  }
  const promoted = after.admins.filter((id) => !before.admins.includes(id));
  const demoted = before.admins.filter((id) => !after.admins.includes(id));
  if (promoted.length > 0) {
    notices.push({
      type: "admins_changed",
      actorProfileId: change.committerProfileId,
      targetProfileIds: promoted,
      detail: "added",
    });
  }
  if (demoted.length > 0) {
    notices.push({
      type: "admins_changed",
      actorProfileId: change.committerProfileId,
      targetProfileIds: demoted,
      detail: "removed",
    });
  }
  return notices;
}

export function deriveCommitNotices(change: CommitChange): StoredNotice[] {
  const before = principalsOf(change.membersBefore);
  const after = principalsOf(membersAfter(change));
  const joined = [...after.keys()].filter((id) => !before.has(id));
  const gone = [...before.keys()].filter((id) => !after.has(id));
  const notices: StoredNotice[] = [];
  if (change.creation) {
    notices.push({
      type: "created",
      actorProfileId: change.committerProfileId,
      targetProfileIds: joined.filter((id) => id !== change.committerProfileId),
    });
  } else if (joined.length > 0) {
    notices.push({
      type: "joined",
      actorProfileId: change.committerProfileId,
      targetProfileIds: joined,
    });
  }
  notices.push(
    ...departureNotices(change, gone),
    ...deviceNotices(change, before, after),
    ...metadataNotices(change)
  );
  if (notices.length === 0) {
    notices.push({
      type: "safety_code_changed",
      actorProfileId: change.committerProfileId,
      targetProfileIds: [],
    });
  }
  return notices;
}

export function noticeMessage(input: {
  g: string;
  seq: number;
  index: number;
  serverTs: number;
  notice: StoredNotice;
}): StoredMessage {
  return {
    id: `notice-${input.seq}-${input.index}`,
    g: input.g,
    seq: input.seq,
    kind: "notice",
    senderProfileId: input.notice.actorProfileId,
    senderDeviceKey: null,
    ts: input.serverTs,
    serverTs: input.serverTs,
    text: "",
    mentions: [],
    reply: null,
    attachments: [],
    editedAt: null,
    deleted: false,
    reactions: {},
    sigOk: true,
    undecryptable: false,
    pending: false,
    notice: input.notice,
    epoch: null,
    body: null,
    sig: null,
  };
}

/**
 * Consecutive key-only commits collapse into one "safety code changed"
 * notice: returns the id of the notice to replace, if any.
 */
export function collapsibleSafetyNotice(
  ordered: readonly StoredMessage[]
): string | null {
  const last = ordered.at(-1);
  if (last?.kind === "notice" && last.notice?.type === "safety_code_changed") {
    return last.id;
  }
  return null;
}
