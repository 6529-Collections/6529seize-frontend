import { getDmAdminPair } from "../dm-conversations";
import type { WasmWelcomeSummary } from "../wasm-types";
import type { EngineContext } from "./context";
import { profileOfLeaf } from "./member-identity";

/** A leaf's owner per its device record, and why none was found (2.3). */
export interface LeafOwner {
  readonly profileId: string | null;
  readonly reason: string | null;
}

/**
 * How long a direct-conversation Welcome may wait for a device the server
 * does not know yet, from when this device first held it back. A device
 * registered moments before it was added can briefly read as unknown, and
 * the directory keeps that answer for 5 minutes; 15 minutes allows two
 * fresh lookups after the first miss before the Welcome is refused.
 */
export const DM_UNKNOWN_DEVICE_RETRY_MS = 15 * 60_000;

const heldBack = new WeakMap<EngineContext, Map<string, number>>();

/**
 * Whether a Welcome held back only for an unknown device may wait for a
 * later sync. Tracked in memory from the first time it was held back here,
 * not from the server's timestamp; once the window has passed it is not.
 */
export function retryWelcomeLater(
  ctx: EngineContext,
  welcomeId: string
): boolean {
  let seen = heldBack.get(ctx);
  if (!seen) {
    seen = new Map();
    heldBack.set(ctx, seen);
  }
  const now = ctx.now();
  const since = seen.get(welcomeId) ?? now;
  if (now - since < DM_UNKNOWN_DEVICE_RETRY_MS) {
    seen.set(welcomeId, since);
    return true;
  }
  seen.delete(welcomeId);
  return false;
}

/**
 * A direct conversation has exactly two participants, as commit validation
 * requires (validate.ts checkAdds). A Welcome to one is accepted ("ok") only
 * when `admins` names two profiles including this one, and the sender and
 * every leaf belong to one of them. Any other kind passes unchanged.
 *
 * A leaf the server does not know ("unknown-device") gives "unknown" when
 * nothing else fails, so the caller can retry within a bounded window. A
 * leaf with no owner for any other reason, or owned by anyone else, gives
 * "refused". A lookup that could not complete has already thrown in the
 * leaf checks, so that Welcome is retried. `owners` is in `staged.members`
 * order.
 */
export async function dmParticipants(
  ctx: EngineContext,
  staged: WasmWelcomeSummary,
  owners: readonly LeafOwner[],
  senderProfileId: string | null
): Promise<"ok" | "refused" | "unknown"> {
  if (staged.metadata.kind !== "dm") {
    return "ok";
  }
  const pair = getDmAdminPair(staged.metadata.admins);
  if (
    !pair?.has(ctx.profileId) ||
    senderProfileId === null ||
    !pair.has(senderProfileId)
  ) {
    return "refused";
  }
  let unknown = false;
  for (const [index, leaf] of staged.members.entries()) {
    const owner = owners[index]?.profileId ?? null;
    if (owner === null && owners[index]?.reason === "unknown-device") {
      unknown = true;
      continue;
    }
    if (owner === null || !pair.has(owner)) {
      return "refused";
    }
    // The stored member must carry the same owner (no conflicting evidence).
    if ((await profileOfLeaf(ctx, leaf.device_key)) !== owner) {
      return "refused";
    }
  }
  return unknown ? "unknown" : "ok";
}
