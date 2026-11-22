import { publicEnv } from "@/config/env";

/**
 * Profiles, handles, ratings, consolidations and delegations move from
 * 6529.io's database to the 6529 Network. 6529.io stops taking changes at the
 * freeze, and the network opens them a day later, at the switch-on.
 *
 * `NEXT_PUBLIC_IDENTITY_FREEZE_AT` names the freeze as a UTC instant, for
 * example `2026-11-24T00:00:00Z`. Unset or malformed, nothing changes.
 *
 * - `notice`: before the freeze. Editing works; the notice says what is coming.
 * - `frozen`: the day between freeze and switch-on. Editing is paused.
 * - `moved`: after the switch-on. 6529.io's own edit routes stay closed;
 *   changes go through the 6529 Network.
 */
export type IdentityMovePhase = "none" | "notice" | "frozen" | "moved";

const IDENTITY_MOVE_FREEZE_DURATION_MS = 24 * 60 * 60 * 1000;

const DATE_TIME_PREFIX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function parseIdentityFreezeAt(
  raw: string | null | undefined
): number | null {
  const value = raw?.trim();
  // A UTC instant only: an offset or a local time would move the freeze.
  if (!value?.endsWith("Z") || !DATE_TIME_PREFIX.test(value)) {
    return null;
  }
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function getIdentityFreezeAtMs(): number | null {
  return parseIdentityFreezeAt(publicEnv.NEXT_PUBLIC_IDENTITY_FREEZE_AT);
}

export function getIdentitySwitchOnMs(freezeAtMs: number): number {
  return freezeAtMs + IDENTITY_MOVE_FREEZE_DURATION_MS;
}

export function getIdentityMovePhase(
  nowMs: number,
  freezeAtMs: number | null
): IdentityMovePhase {
  if (freezeAtMs === null) {
    return "none";
  }
  if (nowMs < freezeAtMs) {
    return "notice";
  }
  if (nowMs < getIdentitySwitchOnMs(freezeAtMs)) {
    return "frozen";
  }
  return "moved";
}

/** The next instant the phase changes, or null when it no longer changes. */
export function getNextIdentityMoveChangeMs(
  nowMs: number,
  freezeAtMs: number | null
): number | null {
  if (freezeAtMs === null) {
    return null;
  }
  if (nowMs < freezeAtMs) {
    return freezeAtMs;
  }
  const switchOnMs = getIdentitySwitchOnMs(freezeAtMs);
  return nowMs < switchOnMs ? switchOnMs : null;
}

export function isIdentityEditingPausedPhase(
  phase: IdentityMovePhase
): boolean {
  return phase === "frozen" || phase === "moved";
}

/**
 * Whether 6529.io's own profile, handle, statement, REP, NIC and proxy edits
 * are closed now. Components that must follow the clock across the freeze
 * use `useIdentityMovePhase` instead.
 */
export function isIdentityEditingPaused(nowMs: number = Date.now()): boolean {
  return isIdentityEditingPausedPhase(
    getIdentityMovePhase(nowMs, getIdentityFreezeAtMs())
  );
}
