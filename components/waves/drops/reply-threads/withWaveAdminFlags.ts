import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface WaveAdminFlags {
  readonly authenticated_user_admin: boolean;
  readonly admin_drop_deletion_enabled: boolean;
}

// A reply keeps its object while neither the stored reply nor the flags
// changed, so memoized rows skip a re-render when another message arrives.
const cache = new WeakMap<
  ExtendedDrop,
  { readonly flags: WaveAdminFlags; readonly drop: ExtendedDrop }
>();

/**
 * Replies from a linked-reply window or from the wave stream carry the v2
 * feed's wave summary, which has no admin flags (they read as false). The
 * loaded wave has the viewer's admin role and the wave's admin delete
 * setting, which decide whether the post menu offers Delete.
 */
export const withWaveAdminFlags = (
  drop: ExtendedDrop,
  wave: ApiWave
): ExtendedDrop => {
  // Tolerate partial wave payloads, as SingleWaveDropChat does.
  const settings = (wave as Partial<Pick<ApiWave, "wave">>).wave;
  const admin = settings?.authenticated_user_eligible_for_admin;
  const deletion = settings?.admin_drop_deletion_enabled;
  if (
    drop.wave.id !== wave.id ||
    typeof admin !== "boolean" ||
    typeof deletion !== "boolean" ||
    (drop.wave.authenticated_user_admin === admin &&
      drop.wave.admin_drop_deletion_enabled === deletion)
  ) {
    return drop;
  }
  const cached = cache.get(drop);
  if (
    cached?.flags.authenticated_user_admin === admin &&
    cached.flags.admin_drop_deletion_enabled === deletion
  ) {
    return cached.drop;
  }
  const flags: WaveAdminFlags = {
    authenticated_user_admin: admin,
    admin_drop_deletion_enabled: deletion,
  };
  const next: ExtendedDrop = { ...drop, wave: { ...drop.wave, ...flags } };
  cache.set(drop, { flags, drop: next });
  return next;
};
