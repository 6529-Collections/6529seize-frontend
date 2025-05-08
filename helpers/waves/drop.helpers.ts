import { sha256 } from "ethereum-cryptography/sha256.js";
import { utf8ToBytes } from "ethereum-cryptography/utils.js";
import { ApiDrop } from "../../generated/models/ApiDrop";
import { getRandomObjectId } from "../AllowlistToolHelpers";
import { TypedFeedItem } from "../../types/feed.types";
import { ApiFeedItemType } from "../../generated/models/ApiFeedItemType";
import { ApiLightDrop } from "../../generated/models/ApiLightDrop";

export enum DropSize {
  LIGHT = "LIGHT",
  FULL = "FULL",
}

export type Drop = ExtendedDrop | ExtendedLightDrop;

export interface ExtendedDrop extends ApiDrop {
  type: DropSize.FULL;
  stableKey: string;
  stableHash: string;
}

export interface ExtendedLightDrop extends ApiLightDrop {
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
    author_handle: drop.author.handle,
    title: drop.title,
    parts_content: drop.parts.map((part) => part.content).join(""),
    metadata: drop.metadata
      .map((metadata) => metadata.data_key + metadata.data_value)
      .join(""),
    stable_created_at: stableCreatedAt,
  };

  const hash = sha256(utf8ToBytes(JSON.stringify(input)));
  const decoder = new TextDecoder("utf-8");
  const key = decoder.decode(hash);

  return { key, hash: Buffer.from(hash).toString("hex") };
};

const findClosestMatch = (
  newDrop: ApiDrop,
  existingDrops: Drop[],
  maxDiff?: number
): Drop | null => {
  const MAX_TIME_DIFFERENCE = maxDiff ?? 10000;

  return existingDrops.reduce((closest, current) => {
    if (current.type === DropSize.LIGHT) {
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
  }, null as Drop | null);
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

const getDropKey = ({
  drop,
  returnOriginal,
}: {
  readonly drop: ApiDrop;
  readonly returnOriginal: boolean;
}): string => {
  if (returnOriginal) {
    return drop.id;
  }
  const input = {
    wave_id: drop.wave.id,
    reply_to_id: drop.reply_to?.drop_id ?? null,
    reply_to_part_id: drop.reply_to?.drop_part_id ?? null,
    author_handle: drop.author.handle,
    title: drop.title,
    parts_content: drop.parts.map((part) => part.content).join(""),
    metadata: drop.metadata
      .map((metadata) => metadata.data_key + metadata.data_value)
      .join(""),
  };

  const decoder = new TextDecoder("utf-8");
  return decoder.decode(sha256(utf8ToBytes(JSON.stringify(input))));
};

export const getFeedItemKey = ({
  item,
  index,
}: {
  readonly item: TypedFeedItem;
  readonly index: number;
}): string =>
  index === 0 && item.type === ApiFeedItemType.DropCreated
    ? getDropKey({ drop: item.item, returnOriginal: true })
    : `feed-item-${item.serial_no}`;
