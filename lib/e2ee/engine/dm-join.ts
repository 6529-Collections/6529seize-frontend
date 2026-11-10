import { getDmAdminPair } from "../dm-conversations";
import type { WasmWelcomeSummary } from "../wasm-types";
import type { EngineContext } from "./context";
import { profileOfLeaf } from "./member-identity";

/**
 * A direct conversation has exactly two participants, as commit validation
 * requires (validate.ts checkAdds). A Welcome to one is accepted only when
 * `admins` names two profiles including this one, and the sender and every
 * leaf belong to one of them. A leaf whose owner cannot be determined fails
 * too; a lookup that could not complete has already thrown in the leaf
 * checks, so that Welcome is retried. Any other kind passes unchanged.
 *
 * `owners`: each leaf's owner from its device record, in `staged.members`
 * order (null: none determined).
 */
export async function dmParticipantsOk(
  ctx: EngineContext,
  staged: WasmWelcomeSummary,
  owners: readonly (string | null)[],
  senderProfileId: string | null
): Promise<boolean> {
  if (staged.metadata.kind !== "dm") {
    return true;
  }
  const pair = getDmAdminPair(staged.metadata.admins);
  if (
    !pair?.has(ctx.profileId) ||
    senderProfileId === null ||
    !pair.has(senderProfileId)
  ) {
    return false;
  }
  for (const [index, leaf] of staged.members.entries()) {
    const owner = owners[index] ?? null;
    if (owner === null || !pair.has(owner)) {
      return false;
    }
    // The stored member must carry the same owner (no conflicting evidence).
    if ((await profileOfLeaf(ctx, leaf.device_key)) !== owner) {
      return false;
    }
  }
  return true;
}
