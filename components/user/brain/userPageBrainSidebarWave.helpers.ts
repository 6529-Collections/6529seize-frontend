import type { ApiWave } from "@/generated/models/ApiWave";
import { getScaledImageUri } from "@/helpers/image.helpers";
import type { ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { SidebarWave } from "@/types/waves.types";

export type UserPageBrainSidebarWave = ApiWave | SidebarWave;

const isSidebarWave = (wave: UserPageBrainSidebarWave): wave is SidebarWave =>
  "latestDropTimestamp" in wave;

export const getSidebarWaveIsDirectMessage = (
  wave: UserPageBrainSidebarWave
): boolean =>
  isSidebarWave(wave)
    ? wave.isDirectMessage
    : (wave.chat.scope.group?.is_direct_message ?? false);

export const getSidebarWaveHref = (wave: UserPageBrainSidebarWave): string =>
  getWaveRoute({
    waveId: wave.id,
    isDirectMessage: getSidebarWaveIsDirectMessage(wave),
    isApp: false,
  });

export const getSidebarWaveImageSrc = (
  wave: UserPageBrainSidebarWave,
  scale: ImageScale
): string | null =>
  wave.picture ? getScaledImageUri(wave.picture, scale) : null;

export const getSidebarWaveLatestDropTimestamp = (
  wave: UserPageBrainSidebarWave
): number | null =>
  isSidebarWave(wave)
    ? wave.latestDropTimestamp
    : wave.metrics.latest_drop_timestamp;

export const getSidebarWaveIsPrivate = (
  wave: UserPageBrainSidebarWave
): boolean =>
  isSidebarWave(wave)
    ? wave.isPrivate
    : Boolean(wave.visibility.scope.group) &&
      !(wave.chat.scope.group?.is_direct_message ?? false);

export const getSidebarWaveDropsCount = (
  wave: UserPageBrainSidebarWave
): number =>
  isSidebarWave(wave) ? wave.totalDropsCount : wave.metrics.drops_count;
