import { publicEnv } from "@/config/env";

/**
 * Profiles, handles, ratings, consolidations and delegations move from
 * 6529.io's database to the 6529 Network. 6529.io stops taking changes at the
 * freeze, and the network opens them at the switch-on, a day or more later.
 *
 * `NEXT_PUBLIC_IDENTITY_FREEZE_AT` names the freeze as a UTC instant, for
 * example `2026-01-01T00:00:00Z`. Unset or malformed, nothing changes.
 *
 * `NEXT_PUBLIC_IDENTITY_SWITCH_ON_AT` names a later switch-on, also as a UTC
 * instant. Unset, malformed, or less than 24 hours after the freeze, the
 * switch-on is the freeze plus 24 hours: it never comes sooner.
 *
 * - `notice`: before the freeze. Editing works; the notice says what is coming.
 * - `frozen`: from the freeze to the switch-on. Editing is paused.
 * - `moved`: after the switch-on. 6529.io's own edit routes stay closed;
 *   changes go through the 6529 Network.
 */
export type IdentityMovePhase = "none" | "notice" | "frozen" | "moved";

/** The shortest freeze: the switch-on never comes sooner than this after it. */
const IDENTITY_MOVE_FREEZE_DURATION_MS = 24 * 60 * 60 * 1000;

const DATE_TIME_PREFIX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function parseUtcInstant(raw: string | null | undefined): number | null {
  const value = raw?.trim();
  // A UTC instant only: an offset or a local time would move the instant.
  if (!value?.endsWith("Z") || !DATE_TIME_PREFIX.test(value)) {
    return null;
  }
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) {
    return null;
  }
  // Date.parse rolls an impossible date forward (31 November is 1 December):
  // such a value is malformed.
  return new Date(ms).toISOString().slice(0, 16) === value.slice(0, 16)
    ? ms
    : null;
}

export function getIdentityFreezeAtMs(): number | null {
  return parseUtcInstant(publicEnv.NEXT_PUBLIC_IDENTITY_FREEZE_AT);
}

export function getIdentitySwitchOnMs(freezeAtMs: number): number {
  const earliest = freezeAtMs + IDENTITY_MOVE_FREEZE_DURATION_MS;
  const configured = parseUtcInstant(
    publicEnv.NEXT_PUBLIC_IDENTITY_SWITCH_ON_AT
  );
  return configured !== null && configured > earliest ? configured : earliest;
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
