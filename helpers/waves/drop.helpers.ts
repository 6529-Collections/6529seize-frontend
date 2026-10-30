import { MemesSubmissionAdditionalInfoKey } from "@/components/waves/memes/submission/types/OperationalData";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropCompetitionContext } from "@/generated/models/ApiDropCompetitionContext";
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";
import type { ApiDropMetadata } from "@/generated/models/ApiDropMetadata";
import type { ApiLightDrop } from "@/generated/models/ApiLightDrop";
import { bytesToHex, sha256, stringToBytes } from "viem";
import { getRandomObjectId } from "../AllowlistToolHelpers";

export enum DropSize {
  LIGHT = "LIGHT",
  FULL = "FULL",
}

export enum DropClientDeliveryState {
  MODERATION_REJECTED = "MODERATION_REJECTED",
}

export type Drop = ExtendedDrop | ExtendedLightDrop;

export interface ExtendedDrop extends ApiDropV2View {
  type: DropSize.FULL;
  stableKey: string;
  stableHash: string;
  clientDeliveryState?: DropClientDeliveryState | undefined;
  competition_id?: string | undefined;
  competition_title?: string | undefined;
  // Scope permissions to the account and proxy that resolved this association.
  competition_context?:
    | {
        readonly viewer: string | null;
        readonly waveId: string;
        readonly dropId: string;
        readonly data: ApiDropCompetitionContext;
      }
    | undefined;
  over_threshold_since_ms?: number | null | undefined;
}

export type LightDropSummary = Pick<ApiLightDrop, "id" | "serial_no"> &
  Partial<Omit<ApiLightDrop, "id" | "serial_no">>;

interface ExtendedLightDrop extends LightDropSummary {
  type: DropSize.LIGHT;
  waveId: string;
  stableKey: string;
  stableHash: string;
}

export const getStableDropKey = (
  drop: Drop,
  existingDrops: Drop[] = []
): { key: string; hash: string } => {
  if (drop.type === DropSize.LIGHT) {
    return { key: drop.id, hash: drop.id };
  }
  const closestMatch = findClosestMatch(drop, existingDrops);
  const stableCreatedAt = closestMatch
    ? "created_at" in closestMatch
      ? closestMatch.created_at
      : drop.serial_no
    : drop.created_at;

  const input = {
    wave_id: drop.wave.id,
    reply_to_id: drop.reply_to?.drop_id ?? null,
    reply_to_part_id: drop.reply_to?.drop_part_id ?? null,
    author_handle: drop.author.is_anonymous
      ? drop.author.id
      : drop.author.handle,
    title: drop.title,
    parts_content: drop.parts.map((part) => part.content).join(""),
    metadata: drop.metadata
      .map((metadata) => metadata.data_key + metadata.data_value)
      .join(""),
    stable_created_at: stableCreatedAt,
  };

  const hash = sha256(stringToBytes(JSON.stringify(input)), "bytes");
  const decoder = new TextDecoder("utf-8");
  const key = decoder.decode(hash);

  // viem prefixes hex with "0x"; the stable hash has always been bare hex.
  return { key, hash: bytesToHex(hash).slice(2) };
};

const findClosestMatch = (
  newDrop: ApiDrop,
  existingDrops: Drop[],
  maxDiff?: number
): Drop | null => {
  const MAX_TIME_DIFFERENCE = maxDiff ?? 10000;

  return existingDrops.reduce(
    (closest, current) => {
      if (current.type === DropSize.LIGHT) {
        return closest;
      }
      if (
        (current.author.is_anonymous || newDrop.author.is_anonymous) &&
        current.author.id !== newDrop.author.id
      ) {
        return closest;
      }
      if (
        current.author.handle === newDrop.author.handle &&
        current.parts.map((p) => p.content).join("") ===
          newDrop.parts.map((p) => p.content).join("") &&
        Math.abs(
          new Date(current.created_at).getTime() -
            new Date(newDrop.created_at).getTime()
        ) < MAX_TIME_DIFFERENCE
      ) {
        if (closest?.type === DropSize.LIGHT) {
          return current;
        }

        if (
          !closest ||
          Math.abs(
            new Date(current.created_at).getTime() -
              new Date(newDrop.created_at).getTime()
          ) <
            Math.abs(
              new Date(closest.created_at).getTime() -
                new Date(newDrop.created_at).getTime()
            )
        ) {
          return current;
        }
      }
      return closest;
    },
    null as Drop | null
  );
};

export const getOptimisticDropId = (): string => `temp-${getRandomObjectId()}`;

/**
 * Convert an ApiDrop to ExtendedDrop by adding stable keys
 */
export const convertApiDropToExtendedDrop = (drop: ApiDrop): ExtendedDrop => {
  const { key, hash } = getStableDropKey({
    ...drop,
    type: DropSize.FULL,
    stableKey: "",
    stableHash: "",
  });
  return {
    ...drop,
    type: DropSize.FULL,
    stableKey: key,
    stableHash: hash,
  };
};

export const getDropPreviewImageUrl = (
  metadata: ApiDropMetadata[] | undefined
): string | null => {
  const additionalMediaEntry = metadata?.find(
    (m) => m.data_key === MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA
  );
  if (!additionalMediaEntry?.data_value) return null;

  try {
    const parsed = JSON.parse(additionalMediaEntry.data_value) as {
      preview_image?: string;
    };
    if (!parsed?.preview_image) return null;
    return resolveIpfsUrlSync(parsed.preview_image);
  } catch {
    return null;
  }
};

export const getDropPromoVideoUrl = (
  metadata: ApiDropMetadata[] | undefined
): string | null => {
  const additionalMediaEntry = metadata?.find(
    (m) => m.data_key === MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA
  );
  if (!additionalMediaEntry?.data_value) return null;

  try {
    const parsed = JSON.parse(additionalMediaEntry.data_value) as {
      promo_video?: string;
    };
    if (!parsed?.promo_video) return null;
    return resolveIpfsUrlSync(parsed.promo_video);
  } catch {
    return null;
  }
};
