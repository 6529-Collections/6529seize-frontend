import type { StoredGroup } from "../records";
import { isActive, type EngineContext } from "./context";
import type { GroupRuntime } from "./store";

/** Self groups: one profile's own devices, for read-state sync (P60). */

export const isSelfGroup = (record: StoredGroup): boolean =>
  record.metadata.kind === "self";

export const activeSelfGroups = (ctx: EngineContext): GroupRuntime[] =>
  [...ctx.store.groups.values()].filter(
    (runtime) => isActive(runtime) && isSelfGroup(runtime.record)
  );

/**
 * The canonical self group: the active one with the lowest handle. Group
 * handles break creation races, so device clocks never matter (P60 §2).
 */
export function canonicalSelfGroup(ctx: EngineContext): GroupRuntime | null {
  return activeSelfGroups(ctx).reduce<GroupRuntime | null>(
    (best, runtime) =>
      !best || runtime.record.g < best.record.g ? runtime : best,
    null
  );
}
