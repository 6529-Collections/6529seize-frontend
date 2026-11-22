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
