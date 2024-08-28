import { sha256 } from "ethereum-cryptography/sha256.js";
import { utf8ToBytes } from "ethereum-cryptography/utils.js";
import { Drop } from "../../generated/models/Drop";
import { getRandomObjectId } from "../AllowlistToolHelpers";
import { timeStamp } from "console";

export const getOptimisticDropId = (): string => `temp-${getRandomObjectId()}`;

const roundTimestampToNearest10Minutes = (timestamp: number): string => {
  const date = new Date(timestamp);
  const minutes = date.getMinutes();
  const roundedMinutes = Math.floor(minutes / 10) * 10;
  date.setMinutes(roundedMinutes, 0, 0);
  return date.toISOString();
};

export const getDropHash = (drop: Drop): string => {
  const input = {
    wave_id: drop.wave.id,
    reply_to_id: drop.reply_to?.drop_id ?? null,
    reply_to_part_id: drop.reply_to?.drop_part_id ?? null,
    author_handle: drop.author.handle,
    title: drop.title,
    parts_content: drop.parts.map((part) => part.content).join(""),
    metadata: drop.metadata.map((metadata) => metadata.data_key + metadata.data_value).join(""),
    timeStamp: roundTimestampToNearest10Minutes(drop.created_at),
  };

  const decoder = new TextDecoder('utf-8');
  return decoder.decode(sha256(utf8ToBytes(JSON.stringify(input))))
};
