import type { SealedItem } from "@/lib/signed-records/sealed-crypto";

/**
 * One user action as personal records (N1): follows of people, each a
 * public RECORD in the person's `ps` stream, and private items, sealed in
 * `settings` records in their `pv` stream. Follows of waves and drops are
 * private items: a wave can be private or a DM, and a drop follow tells
 * what someone wrote.
 */
export interface PersonalChange {
  readonly follows: readonly FollowChange[];
  readonly items: readonly SealedItem[];
}

interface FollowChange {
  /** `identity:<owner>`: only follows of people are public. */
  readonly key: string;
  /** The full set of actions after the change; null unfollows. */
  readonly actions: readonly string[] | null;
}

/** A profile follow: every action today's follow buttons send. */
const IDENTITY_FOLLOW_ACTIONS = [
  "WAVE_CREATED",
  "DROP_CREATED",
  "DROP_REPLIED",
] as const;

const WAVE_FOLLOW_ACTIONS = ["DROP_CREATED"] as const;

/** Wave groups whose mentions notify, in the order records carry them. */
const WAVE_GROUPS = ["ALL", "CONTRIBUTORS", "ADMINS", "DEVS_6529"] as const;

/** One action's records: its follows and its private items. */
export const personalChange = ({
  follows = [],
  items = [],
}: {
  readonly follows?: readonly FollowChange[];
  readonly items?: readonly SealedItem[];
}): PersonalChange => ({ follows, items });

/** Follows (every action today's follow buttons send) or unfollows a profile, by its owner. */
export const identityFollow = (
  targetOwner: string,
  following: boolean
): FollowChange => ({
  key: `identity:${targetOwner}`,
  actions: following ? [...IDENTITY_FOLLOW_ACTIONS] : null,
});

/** Joins (follows) or leaves a wave: a private `follow` item keyed `wave:<id>`. */
export const waveFollowItem = (
  waveId: string,
  following: boolean
): SealedItem => ({
  t: "follow",
  k: `wave:${waveId}`,
  b: following ? { actions: [...WAVE_FOLLOW_ACTIONS] } : null,
});

/** An on/off flag on a profile (owner) or a drop (id): `{}` sets it, null unsets. */
export const flagItem = (
  type: "mute" | "block" | "hide" | "bookmark" | "art-alert",
  key: string,
  on: boolean
): SealedItem => ({ t: type, k: key, b: on ? {} : null });

/** A pinned wave at a whole-number position; null unpins. */
export const pinItem = (
  waveId: string,
  position: number | null
): SealedItem => ({
  t: "pin",
  k: waveId,
  b: position === null ? null : { pos: position },
});

/** A pin as the API saved it: its position, or null when none is saved. */
export interface SavedPin {
  readonly id: string;
  readonly position: number | null;
}

// New positions leave room, so a later move rewrites one pin.
const PIN_SPACING = 1024;
// The highest position a pin record may carry.
const PIN_POSITION_MAX = 1_000_000;

/**
 * The saved positions that already rise along the order, as many as
 * possible (the longest strictly rising subsequence, n <= 100); every
 * other entry is null.
 */
function longestRisingRun(
  saved: readonly (number | null)[]
): (number | null)[] {
  // run[i] is the length of the best run ending at i; from[i] the index
  // before i in it.
  const run: number[] = saved.map(() => 0);
  const from: number[] = saved.map(() => -1);
  let best = -1;
  saved.forEach((position, i) => {
    if (position === null) return;
    let length = 1;
    for (let j = 0; j < i; j += 1) {
      const before = saved[j] ?? null;
      const through = (run[j] ?? 0) + 1;
      if (before !== null && before < position && through > length) {
        length = through;
        from[i] = j;
      }
    }
    run[i] = length;
    if (best < 0 || length > (run[best] ?? 0)) best = i;
  });
  const kept: (number | null)[] = saved.map(() => null);
  for (let i = best; i >= 0; i = from[i] ?? -1) {
    kept[i] = saved[i] ?? null;
  }
  return kept;
}

/**
 * `count` positions strictly between `below` and `above` (null: no pin on
 * that side), spread out; after the last pin, PIN_SPACING apart. Null
 * when they don't fit.
 */
function positionsBetween(
  below: number | null,
  above: number | null,
  count: number
): number[] | null {
  if (above === null) {
    const first = below ?? -PIN_SPACING;
    if (first + PIN_SPACING * count > PIN_POSITION_MAX) return null;
    return Array.from(
      { length: count },
      (_, k) => first + PIN_SPACING * (k + 1)
    );
  }
  const floor = below ?? -1;
  const step = Math.floor((above - floor) / (count + 1));
  if (step < 1) return null;
  return Array.from({ length: count }, (_, k) => floor + step * (k + 1));
}

/**
 * Positions that keep as many saved pins as possible and fit the others
 * between them: the longest run of saved positions already rising along
 * `order` stays, and each gap gets positions spread between its
 * neighbours. Null when a gap has no room.
 */
function keptPositions(
  saved: readonly (number | null)[]
): (number | null)[] | null {
  const target = longestRisingRun(saved);
  for (let start = 0; start < target.length; ) {
    if (target[start] !== null) {
      start += 1;
      continue;
    }
    let end = start;
    while (end < target.length && target[end] === null) end += 1;
    const fill = positionsBetween(
      start > 0 ? (target[start - 1] ?? null) : null,
      end < target.length ? (target[end] ?? null) : null,
      end - start
    );
    if (!fill) return null;
    fill.forEach((position, k) => {
      target[start + k] = position;
    });
    start = end;
  }
  return target;
}

/**
 * The pin items that put `order` (wave ids, first shown first) in place,
 * given the positions the API saved: only pins whose position changes. A
 * new pin has no saved position. When moved pins don't fit between the
 * kept ones, the whole order is spaced out again.
 */
export function pinChanges(
  order: readonly string[],
  saved: readonly SavedPin[]
): SealedItem[] {
  const savedAt = new Map(saved.map((pin) => [pin.id, pin.position]));
  const target =
    keptPositions(order.map((id) => savedAt.get(id) ?? null)) ??
    order.map((_, index) => index * PIN_SPACING);
  return order.flatMap((id, index) =>
    target[index] === (savedAt.get(id) ?? null)
      ? []
      : [pinItem(id, target[index] ?? null)]
  );
}

/** A wave's notification settings: every drop, and the groups whose mentions notify. */
export const waveNotifyItem = (
  waveId: string,
  settings: {
    readonly allDrops: boolean;
    readonly groups: readonly string[];
  }
): SealedItem => ({
  t: "wave-notify",
  k: waveId,
  b: {
    all_drops: settings.allDrops,
    groups: WAVE_GROUPS.filter((group) => settings.groups.includes(group)),
  },
});

/** A profile preference: `dm`, `level` or `notify.<category>`. */
export const prefItem = (
  key: string,
  body: Record<string, unknown>
): SealedItem => ({ t: "pref", k: key, b: body });

/**
 * A mention shortcut: the alias (lowercase, no @) and its members' owners;
 * null deletes it. `create` refuses a name already taken, as today;
 * `renamedFrom` moves that alias to this name, keeping its id (the same
 * record then unsets the old name, after this item).
 */
export const aliasItem = (
  alias: string,
  members: readonly string[] | null,
  how: { readonly create?: true; readonly renamedFrom?: string } = {}
): SealedItem => ({
  t: "alias",
  k: alias,
  b:
    members === null
      ? null
      : {
          members: [...members],
          ...(how.create ? { new: true } : {}),
          ...(how.renamedFrom === undefined ? {} : { from: how.renamedFrom }),
        },
});

/** A push device's settings, all eleven booleans. */
export const pushItem = (
  deviceId: string,
  settings: Readonly<Record<string, boolean>>
): SealedItem => ({ t: "push", k: deviceId, b: { ...settings } });

/** The EULA accepted on a device. */
export const eulaItem = (
  deviceId: string,
  consent: { readonly version: string; readonly platform: string }
): SealedItem => ({
  t: "eula",
  k: deviceId,
  b: { version: consent.version, platform: consent.platform },
});
