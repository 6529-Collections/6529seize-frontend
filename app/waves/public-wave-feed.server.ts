import "next/dist/compiled/server-only";

import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import type { ApiWaveDropsFeedV2 } from "@/generated/models/ApiWaveDropsFeedV2";
import { getWavePathRoute } from "@/helpers/navigation.helpers";
import { markdownToPlainText } from "@/helpers/waves/waveDescriptionPreview";
import { anonymousSsrFetch } from "@/lib/fetch/ssrFetch";
import { stripHtmlTags } from "@/lib/text/html";
import { publicEnv } from "@/config/env";

export const PUBLIC_WAVE_FEED_LIMIT = 10;
export const PUBLIC_WAVE_FEED_REQUEST_LIMIT = PUBLIC_WAVE_FEED_LIMIT + 1;

const PUBLIC_WAVE_FEED_TITLE_MAX_LENGTH = 160;
const PUBLIC_WAVE_FEED_EXCERPT_MAX_LENGTH = 280;

export interface PublicWaveFeedItem {
  readonly id: string;
  readonly serialNo: number;
  readonly createdAt: number;
  readonly authorLabel: string;
  readonly title: string | null;
  readonly excerpt: string | null;
  readonly href: string;
}

export type PublicWaveFeedResult =
  | {
      readonly ok: true;
      readonly waveId: string;
      readonly waveName: string;
      readonly items: readonly PublicWaveFeedItem[];
      readonly hasMore: boolean;
    }
  | {
      readonly ok: false;
      readonly waveId: string;
    };

const toBoundedPlainText = (
  value: string | null | undefined,
  maxLength: number
): string | null => {
  const plainText = stripHtmlTags(
    markdownToPlainText(value ?? "", {
      includeImageUrls: false,
      includeLinkDestinations: false,
    }),
    { preserveTagSpacing: true }
  )
    .replaceAll(/\s+/g, " ")
    .trim();

  if (plainText.length === 0) {
    return null;
  }

  return plainText.length > maxLength
    ? `${plainText.slice(0, maxLength).trimEnd()}\u2026`
    : plainText;
};

const toPublicWaveFeedItem = (
  drop: ApiDropV2,
  waveId: string
): PublicWaveFeedItem | null => {
  if (
    drop.moderation?.status !== ApiDropModerationStatus.Visible ||
    drop.moderation.can_view !== true
  ) {
    return null;
  }

  const id = drop.id.trim();
  const authorHandle = drop.author.handle?.trim() ?? "";
  const authorLabel =
    authorHandle.length > 0 ? authorHandle : drop.author.primary_address.trim();
  if (
    !id ||
    !authorLabel ||
    !Number.isFinite(drop.serial_no) ||
    !Number.isFinite(drop.created_at)
  ) {
    return null;
  }

  return {
    id,
    serialNo: drop.serial_no,
    createdAt: drop.created_at,
    authorLabel,
    title: toBoundedPlainText(drop.title, PUBLIC_WAVE_FEED_TITLE_MAX_LENGTH),
    excerpt: toBoundedPlainText(
      drop.content,
      PUBLIC_WAVE_FEED_EXCERPT_MAX_LENGTH
    ),
    href: `${getWavePathRoute(waveId)}?drop=${encodeURIComponent(id)}`,
  };
};

export async function fetchPublicWaveFeed(
  waveId: string
): Promise<PublicWaveFeedResult> {
  const normalizedWaveId = waveId.trim();
  if (!normalizedWaveId) {
    return { ok: false, waveId };
  }

  try {
    const query = new URLSearchParams({
      limit: `${PUBLIC_WAVE_FEED_REQUEST_LIMIT}`,
    });
    const response = await anonymousSsrFetch(
      `${publicEnv.API_ENDPOINT}/api/v2/waves/${encodeURIComponent(normalizedWaveId)}/drops?${query.toString()}`,
      {
        cache: "no-store",
      }
    );
    if (!response.ok) {
      return { ok: false, waveId: normalizedWaveId };
    }
    const feed = (await response.json()) as ApiWaveDropsFeedV2;

    const responseWaveId = feed.wave.id.trim();
    const waveName = feed.wave.name.trim();
    if (
      responseWaveId !== normalizedWaveId ||
      !waveName ||
      feed.wave.is_private !== false ||
      feed.wave.is_dm_wave !== false ||
      !Array.isArray(feed.drops)
    ) {
      return { ok: false, waveId: normalizedWaveId };
    }

    const items = feed.drops
      .map((drop) => toPublicWaveFeedItem(drop, normalizedWaveId))
      .filter((item): item is PublicWaveFeedItem => item !== null)
      .slice(0, PUBLIC_WAVE_FEED_LIMIT);

    return {
      ok: true,
      waveId: normalizedWaveId,
      waveName,
      items,
      hasMore: feed.drops.length > PUBLIC_WAVE_FEED_LIMIT,
    };
  } catch {
    return { ok: false, waveId: normalizedWaveId };
  }
}
