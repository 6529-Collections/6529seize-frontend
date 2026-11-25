"use client";

import { useSyncExternalStore } from "react";
import { isChainIdentityEnabled } from "@/lib/chain-identity/config";
import {
  getIdentityFreezeAtMs,
  getIdentityMovePhase,
  getNextIdentityMoveChangeMs,
  isIdentityEditingPausedPhase,
  type IdentityMovePhase,
} from "@/lib/identity-move/schedule";

// setTimeout fires at once for delays above 2^31 - 1 ms (about 24.8 days).
const MAX_TIMER_DELAY_MS = 2_147_483_647;

const getPhaseNow = (): IdentityMovePhase =>
  getIdentityMovePhase(Date.now(), getIdentityFreezeAtMs());

const subscribe = (onChange: () => void): (() => void) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    const now = Date.now();
    const next = getNextIdentityMoveChangeMs(now, getIdentityFreezeAtMs());
    if (next === null) {
      return;
    }
    timer = setTimeout(
      () => {
        onChange();
        schedule();
      },
      Math.min(Math.max(next - now, 0) + 1, MAX_TIMER_DELAY_MS)
    );
  };
  schedule();
  return () => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  };
};

/**
 * The phase of the move to the 6529 Network (lib/identity-move/schedule.ts),
 * updated when the freeze and the switch-on pass while the page is open.
 */
export function useIdentityMovePhase(): IdentityMovePhase {
  return useSyncExternalStore(subscribe, getPhaseNow, getPhaseNow);
}

/** Whether 6529.io's own identity edits are closed, following the clock. */
export function useIdentityEditingPaused(): boolean {
  return isIdentityEditingPausedPhase(useIdentityMovePhase());
}

/**
 * Whether identity changes go through the 6529 Network now: the chain flows
 * are on in this build and the switch-on has passed.
 */
export function useChainIdentityActive(): boolean {
  return useIdentityMovePhase() === "moved" && isChainIdentityEnabled();
}

/** Whether REP and NIC rating is closed: paused, with no chain path. */
export function useRatingPaused(): boolean {
  const phase = useIdentityMovePhase();
  return (
    isIdentityEditingPausedPhase(phase) &&
    !(phase === "moved" && isChainIdentityEnabled())
  );
}
