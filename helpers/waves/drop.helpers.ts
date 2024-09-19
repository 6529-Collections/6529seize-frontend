import { sha256 } from "ethereum-cryptography/sha256.js";
import { utf8ToBytes } from "ethereum-cryptography/utils.js";
import { Drop } from "../../generated/models/Drop";
import { getRandomObjectId } from "../AllowlistToolHelpers";
import { TypedFeedItem } from "../../types/feed.types";
import { FeedItemType } from "../../generated/models/FeedItemType";

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
