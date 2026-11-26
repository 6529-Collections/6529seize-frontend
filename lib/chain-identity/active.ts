import {
  getIdentityFreezeAtMs,
  getIdentityMovePhase,
  isIdentityEditingPaused,
} from "@/lib/identity-move/schedule";
import { isChainIdentityEnabled } from "./config";

/**
 * Whether changes go through the 6529 Network now: this build has the chain
 * flows on, and the switch-on has passed. Before the freeze 6529.io's own
 * edits run; during the freeze nothing runs.
 */
export function isChainIdentityActive(nowMs: number = Date.now()): boolean {
  return (
    isChainIdentityEnabled() &&
    getIdentityMovePhase(nowMs, getIdentityFreezeAtMs()) === "moved"
  );
}

/** Whether REP and NIC rating is closed now: paused, with no chain path. */
export function isRatingPaused(nowMs: number = Date.now()): boolean {
  return isIdentityEditingPaused(nowMs) && !isChainIdentityActive(nowMs);
}
