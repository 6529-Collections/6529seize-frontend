import "next/dist/compiled/server-only";

import { publicEnv } from "@/config/env";
import type { ApiDropAndWave } from "@/generated/models/ApiDropAndWave";
import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";
import type { ApiDropModeration } from "@/generated/models/ApiDropModeration";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import type { ApiDropV2PageWithoutCount } from "@/generated/models/ApiDropV2PageWithoutCount";
import type { ApiDropPartV2 } from "@/generated/models/ApiDropPartV2";
import { getWavePathRoute } from "@/helpers/navigation.helpers";
import { markdownToPlainText } from "@/helpers/waves/waveDescriptionPreview";
import { anonymousSsrFetch } from "@/lib/fetch/ssrFetch";
import { stripHtmlTags } from "@/lib/text/html";

// Keep the anonymous preview bounded even for long storms.
export const PUBLIC_WAVE_DROP_PART_LIMIT = 10;

export interface PublicWaveDropPart {
  readonly partNo: number;
  readonly text: string;
  readonly media: readonly {
    readonly url: string;
    readonly mimeType: string;
  }[];
}

export interface PublicWaveDrop {
  readonly id: string;
  readonly waveId: string;
  readonly waveName: string;
  readonly author: string;
  readonly title: string;
  readonly serialNo: number;
  readonly publishedAt: string;
  readonly href: string;
  readonly parts: readonly PublicWaveDropPart[];
  readonly hasMoreParts: boolean;
}

interface PublicWaveDropSelection {
  readonly key: "drop" | "serialNo";
  readonly value: string;
}

const isVisible = (moderation: ApiDropModeration | undefined): boolean =>
  moderation?.status === ApiDropModerationStatus.Visible &&
  moderation.can_view === true;

const toPlainText = (value: string | undefined): string =>
  stripHtmlTags(markdownToPlainText(value ?? "", { includeImageUrls: false }), {
    preserveTagSpacing: true,
  }).trim();

function toPublicMedia(media: ApiDropMedia) {
  if (
    (media.media_status !== undefined &&
      media.media_status !== ApiDropMediaStatus.Ready) ||
    typeof media.mime_type !== "string"
  ) {
    return [];
  }
  try {
    const url = new URL(media.url);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return [];
    }
    return [{ url: url.href, mimeType: media.mime_type }];
  } catch {
    return [];
  }
}

function toPublicPart(
  partNo: number,
  part: { readonly content?: string; readonly media?: ApiDropMedia[] }
): PublicWaveDropPart {
  return {
    partNo,
    text: toPlainText(part.content),
    media: (part.media ?? []).flatMap(toPublicMedia),
  };
}

async function fetchAnonymous<T>(path: string): Promise<T | null> {
  const response = await anonymousSsrFetch(
    `${publicEnv.API_ENDPOINT}/api/v2/${path}`,
    {
      cache: "no-store",
    }
  );
  return response.ok ? ((await response.json()) as T) : null;
}

async function fetchExtraPart(dropId: string, partNo: number) {
  const part = await fetchAnonymous<ApiDropPartV2>(
    `drops/${encodeURIComponent(dropId)}/parts/${partNo}`
  );
  if (part?.part_no !== partNo || !isVisible(part.moderation)) {
    return null;
  }
  return toPublicPart(partNo, part);
}

// Resolve serial links to an ID before requesting the Wave visibility metadata.
async function fetchSelectedDrop(
  key: PublicWaveDropSelection["key"],
  value: string
): Promise<ApiDropAndWave | null> {
  let dropId = value;
  if (key === "serialNo") {
    const page = await fetchAnonymous<ApiDropV2PageWithoutCount>(
      `drops?serial_nos=${encodeURIComponent(value)}&page_size=1`
    );
    const selected = page?.data.find(
      (drop) => String(drop.serial_no) === value
    );
    if (!selected?.id || !isVisible(selected.moderation)) return null;
    dropId = selected.id;
  }
  const result = await fetchAnonymous<ApiDropAndWave>(
    `drops/${encodeURIComponent(dropId)}`
  );
  return result?.drop.id === dropId ? result : null;
}

export async function fetchPublicWaveDrop(
  waveId: string,
  selection: PublicWaveDropSelection
): Promise<PublicWaveDrop | null> {
  const value = selection.value.trim();
  if (!waveId.trim() || !value) return null;
  if (selection.key === "serialNo" && !/^\d+$/.test(value)) return null;

  try {
    const result = await fetchSelectedDrop(selection.key, value);
    if (!result) return null;
    const { drop, wave } = result;
    const matchesSelection =
      selection.key === "drop"
        ? drop.id === value
        : String(drop.serial_no) === value;
    if (
      !matchesSelection ||
      wave.id !== waveId ||
      !wave.name.trim() ||
      wave.is_private !== false ||
      wave.is_dm_wave !== false ||
      !isVisible(drop.moderation) ||
      !Number.isSafeInteger(drop.serial_no) ||
      !Number.isSafeInteger(drop.parts_count) ||
      drop.parts_count < 1 ||
      !Number.isFinite(drop.created_at)
    )
      return null;

    const handle = drop.author.handle?.trim() ?? "";
    const author =
      handle.length > 0 ? handle : drop.author.primary_address.trim();
    if (!author) return null;
    const publishedAt = new Date(drop.created_at).toISOString();
    const partCount = Math.min(drop.parts_count, PUBLIC_WAVE_DROP_PART_LIMIT);
    const extraParts = await Promise.all(
      Array.from({ length: partCount - 1 }, (_, index) =>
        fetchExtraPart(drop.id, index + 2)
      )
    );
    // Do not serialize a partial storm when a part becomes inaccessible.
    if (extraParts.includes(null)) return null;

    return {
      id: drop.id,
      waveId: wave.id,
      waveName: wave.name,
      author,
      title: toPlainText(drop.title),
      serialNo: drop.serial_no,
      publishedAt,
      href: `${getWavePathRoute(waveId)}?${new URLSearchParams({ [selection.key]: value })}`,
      parts: [
        toPublicPart(1, drop),
        ...extraParts.filter((part) => part !== null),
      ],
      hasMoreParts: drop.parts_count > partCount,
    };
  } catch {
    return null;
  }
}
