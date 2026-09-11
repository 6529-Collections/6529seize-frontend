import { z } from "zod";

const hash = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const checkpointSchema = z
  .object({
    schema: z.literal("6529.cms.agent_save_checkpoint.v1"),
    profileId: z.string().min(1).max(200),
    primaryWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    proposalId: z.string().min(1).max(200),
    draftId: z.string().min(1).max(200),
    packageId: z.string().min(1).max(200),
    baseVersion: z.number().int().positive(),
    baseHash: hash,
    candidateHash: hash,
    proposalCreatedAt: z.number().int().nonnegative(),
    attemptedAt: z.number().int().nonnegative(),
    resultDraftId: z.string().min(1).max(200).optional(),
    confirmed: z.boolean(),
  })
  .strict();

export type CmsAgentSaveCheckpoint = z.infer<typeof checkpointSchema>;
const EVENT = "cms-agent-save-checkpoint";
const UNAVAILABLE = "unavailable";
function browserLocks(): LockManager | undefined {
  const browser: Partial<Pick<Navigator, "locks">> = globalThis.navigator;
  return browser.locks;
}

// One unresolved write per profile, shared by its authorized wallets. This also
// prevents a wallet switch from allocating a second immutable revision.
function key(profileId: string): string {
  return `6529:cms:agent-save:v1:${encodeURIComponent(profileId)}`;
}

export function readCmsAgentSaveCheckpointRaw(
  profileId: string
): string | null {
  try {
    if (browserLocks() === undefined) return UNAVAILABLE;
    return globalThis.localStorage.getItem(key(profileId));
  } catch {
    return UNAVAILABLE;
  }
}

export function parseCmsAgentSaveCheckpoint(
  raw: string | null,
  profileId: string
): CmsAgentSaveCheckpoint | null {
  if (raw === null) return null;
  try {
    if (raw.length > 4096) throw new Error("checkpoint too large");
    const value = checkpointSchema.parse(JSON.parse(raw));
    if (value.profileId !== profileId) throw new Error("checkpoint scope");
    return value;
  } catch {
    // A malformed or inaccessible checkpoint must never authorize another save.
    throw new Error("cms_agent_save_checkpoint_unavailable");
  }
}

export function readCmsAgentSaveCheckpoint(profileId: string) {
  return parseCmsAgentSaveCheckpoint(
    readCmsAgentSaveCheckpointRaw(profileId),
    profileId
  );
}

export function writeCmsAgentSaveCheckpoint(
  value: CmsAgentSaveCheckpoint
): void {
  const encoded = JSON.stringify(checkpointSchema.parse(value));
  try {
    globalThis.localStorage.setItem(key(value.profileId), encoded);
    if (globalThis.localStorage.getItem(key(value.profileId)) !== encoded)
      throw new Error("checkpoint not retained");
  } catch {
    throw new Error("cms_agent_save_checkpoint_unavailable");
  }
  globalThis.dispatchEvent(new Event(EVENT));
}

export function clearCmsAgentSaveCheckpoint(profileId: string): void {
  globalThis.localStorage.removeItem(key(profileId));
  globalThis.dispatchEvent(new Event(EVENT));
}

export function subscribeCmsAgentSaveCheckpoint(listener: () => void) {
  globalThis.addEventListener("storage", listener);
  globalThis.addEventListener(EVENT, listener);
  return () => {
    globalThis.removeEventListener("storage", listener);
    globalThis.removeEventListener(EVENT, listener);
  };
}

export async function withCmsAgentSaveLock<T>(
  profileId: string,
  signal: AbortSignal,
  action: () => Promise<T>
): Promise<T> {
  signal.throwIfAborted();
  const locks = browserLocks();
  if (locks === undefined)
    throw new Error("cms_agent_save_checkpoint_unavailable");
  return locks.request(key(profileId), { signal }, action);
}
