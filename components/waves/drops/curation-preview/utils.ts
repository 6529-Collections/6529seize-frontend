import type { ApiWave } from "@/generated/models/ApiWave";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { PreviewMedia } from "./types";

export const PREVIEW_DROPS_FETCH_LIMIT = 4;

const TWITTER_MEDIA_HOST = "pbs.twimg.com";
const TWITTER_MEDIA_PATH_PREFIX = "/media/";
const TWITTER_PREVIEW_IMAGE_SIZE = "small";

export const getTrimmedText = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? null : trimmed;
};

export const getPreviewImageUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    const isTwitterMediaUrl =
      parsed.hostname.toLowerCase() === TWITTER_MEDIA_HOST &&
      parsed.pathname.startsWith(TWITTER_MEDIA_PATH_PREFIX);

    if (isTwitterMediaUrl) {
      parsed.searchParams.set("name", TWITTER_PREVIEW_IMAGE_SIZE);
      return parsed.toString();
    }
  } catch {
    // Keep the original URL for non-standard values.
  }

  return url;
};

export const getMediaAspectRatio = (
  media: PreviewMedia,
  hasText: boolean
): number => {
  const fallbackRatio = 4 / 3;
  const rawRatio =
    media.width !== null &&
    media.height !== null &&
    media.width > 0 &&
    media.height > 0
      ? media.width / media.height
      : fallbackRatio;
  const minRatio = hasText ? 4 / 5 : 3 / 4;
  const maxRatio = 16 / 9;

  return Math.min(Math.max(rawRatio, minRatio), maxRatio);
};

export const getWaveAuthor = (wave?: ApiWave): string | null =>
  getTrimmedText(wave?.author.handle) ??
  getTrimmedText(wave?.author.primary_address);

export const getWaveHref = ({
  waveId,
  wave,
  curationId,
}: {
  readonly waveId: string;
  readonly wave?: ApiWave | undefined;
  readonly curationId: string | null;
}): string =>
  getWaveRoute({
    waveId: wave?.id ?? waveId,
    isDirectMessage: wave?.chat.scope.group?.is_direct_message ?? false,
    isApp: false,
    extraParams: { curation: curationId ?? undefined },
  });
