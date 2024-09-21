import { sha256 } from "ethereum-cryptography/sha256.js";
import { utf8ToBytes } from "ethereum-cryptography/utils.js";
import { Drop } from "../../generated/models/Drop";
import { getRandomObjectId } from "../AllowlistToolHelpers";
import { TypedFeedItem } from "../../types/feed.types";
import { FeedItemType } from "../../generated/models/FeedItemType";

export interface ExtendedDrop extends Drop {
  stableKey: string;
  stableHash: string;
}

export const getStableDropKey = (drop: Drop, existingDrops: ExtendedDrop[] = []): { key: string, hash: string } => {
  const closestMatch = findClosestMatch(drop, existingDrops);
  const stableCreatedAt = closestMatch ? closestMatch.created_at : drop.created_at;

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

  return { key, hash: Buffer.from(hash).toString('hex') };
};

const findClosestMatch = (newDrop: Drop, existingDrops: ExtendedDrop[]): ExtendedDrop | null => {
  const MAX_TIME_DIFFERENCE = 10000; // 10 seconds in milliseconds

  return existingDrops.reduce((closest, current) => {
    if (
      current.author.handle === newDrop.author.handle &&
      current.parts.map(p => p.content).join("") === newDrop.parts.map(p => p.content).join("") &&
      Math.abs(new Date(current.created_at).getTime() - new Date(newDrop.created_at).getTime()) < MAX_TIME_DIFFERENCE
    ) {
      if (!closest || 
          Math.abs(new Date(current.created_at).getTime() - new Date(newDrop.created_at).getTime()) <
          Math.abs(new Date(closest.created_at).getTime() - new Date(newDrop.created_at).getTime())) {
        return current;
      }
    }
    return closest;
  }, null as ExtendedDrop | null);
};

export const getOptimisticDropId = (): string => `temp-${getRandomObjectId()}`;

export const getDropKey = ({
  drop,
  returnOriginal,
}: {
  readonly drop: Drop;
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
  index === 0 && item.type === FeedItemType.DropCreated
    ? getDropKey({ drop: item.item, returnOriginal: true })
    : `feed-item-${item.serial_no}`;
