import type { GroupMetadata } from "../wasm-types";
import type { MemberRef } from "./required-changes";

/** Contract 8.1 policy validation of a staged commit (pure). */

export const MAX_GROUP_NAME = 100;
const MAX_ADMINS = 200;

export interface AddedLeafRef extends MemberRef {
  /** Credential/grant/revocation checks passed (2.2, 2.3). */
  ok: boolean;
}

export interface CommitValidationInput {
  entryEpoch: number;
  committer: MemberRef;
  membersBefore: readonly MemberRef[];
  added: readonly AddedLeafRef[];
  removed: readonly MemberRef[];
  metadataBefore: GroupMetadata;
  metadataAfter: GroupMetadata;
  declaredOk: boolean;
  /** 8.2 required removal at the entry's time (lenient for idle). */
  isRequiredRemoval: (deviceKey: string) => boolean;
}

type CommitValidation =
  | { ok: true }
  | { ok: false; reason: string; splitView: boolean };

const invalid = (reason: string, splitView = false): CommitValidation => ({
  ok: false,
  reason,
  splitView,
});

const isProfileList = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length <= MAX_ADMINS &&
  value.every((item) => typeof item === "string" && item.length > 0);

/** Shape check of the 3.5 extension value. */
export function isValidMetadata(value: unknown): value is GroupMetadata {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const meta = value as Partial<Record<keyof GroupMetadata, unknown>>;
  const nameOk =
    meta.name === null ||
    (typeof meta.name === "string" && [...meta.name].length <= MAX_GROUP_NAME);
  return (
    meta.v === 1 &&
    typeof meta.g === "string" &&
    (meta.kind === "dm" || meta.kind === "group") &&
    nameOk &&
    isProfileList(meta.admins) &&
    typeof meta.created_by === "string" &&
    meta.history === "from_join"
  );
}

/** Field comparison (v and history are fixed by the shape check). */
const metadataEqual = (a: GroupMetadata, b: GroupMetadata): boolean =>
  a.g.toLowerCase() === b.g.toLowerCase() &&
  a.kind === b.kind &&
  a.name === b.name &&
  a.created_by === b.created_by &&
  a.admins.length === b.admins.length &&
  a.admins.every((id, index) => b.admins[index] === id);

function checkMetadataChange(
  input: CommitValidationInput,
  committerIsAdmin: boolean
): CommitValidation | null {
  const before = input.metadataBefore;
  const after = input.metadataAfter;
  if (metadataEqual(before, after)) {
    return null;
  }
  if (!isValidMetadata(after)) {
    return invalid("metadata-shape");
  }
  if (!committerIsAdmin) {
    return invalid("metadata-not-admin");
  }
  const sameIdentity =
    after.g.toLowerCase() === before.g.toLowerCase() &&
    after.kind === before.kind &&
    after.created_by === before.created_by;
  if (!sameIdentity) {
    return invalid("metadata-identity");
  }
  if (after.admins.length === 0) {
    return invalid("metadata-no-admin");
  }
  return null;
}

function principals(members: readonly MemberRef[]): Set<string> {
  const out = new Set<string>();
  for (const member of members) {
    if (member.profileId !== null) {
      out.add(member.profileId);
    }
  }
  return out;
}

function checkAdds(
  input: CommitValidationInput,
  committerIsAdmin: boolean
): CommitValidation | null {
  const before = principals(input.membersBefore);
  const committer = input.committer.profileId;
  const newPrincipals = new Set<string>();
  for (const leaf of input.added) {
    if (!leaf.ok || leaf.profileId === null) {
      return invalid("bad-leaf");
    }
    if (!before.has(leaf.profileId) && leaf.profileId !== committer) {
      newPrincipals.add(leaf.profileId);
    }
  }
  if (newPrincipals.size === 0) {
    return null;
  }
  const meta = input.metadataBefore;
  const creation = input.entryEpoch === 0 && committer === meta.created_by;
  if (meta.kind === "dm") {
    const total = new Set([...before, ...newPrincipals]);
    return creation && total.size <= 2 ? null : invalid("dm-new-principal");
  }
  return creation || committerIsAdmin ? null : invalid("add-not-admin");
}

function checkRemovals(
  input: CommitValidationInput,
  committerIsAdmin: boolean
): CommitValidation | null {
  for (const leaf of input.removed) {
    const own =
      leaf.profileId !== null && leaf.profileId === input.committer.profileId;
    if (own || committerIsAdmin) {
      continue;
    }
    if (!input.isRequiredRemoval(leaf.deviceKey)) {
      return invalid("remove-not-admin");
    }
  }
  return null;
}

export function validateCommit(input: CommitValidationInput): CommitValidation {
  if (!input.declaredOk) {
    return invalid("declared-mismatch", true);
  }
  if (input.committer.profileId === null) {
    return invalid("unknown-committer");
  }
  const committerIsAdmin = input.metadataBefore.admins.includes(
    input.committer.profileId
  );
  return (
    checkMetadataChange(input, committerIsAdmin) ??
    checkAdds(input, committerIsAdmin) ??
    checkRemovals(input, committerIsAdmin) ?? { ok: true }
  );
}
