import type { ApiDrop } from "@/generated/models/ApiDrop";
import { WAVE_DROPS_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";

export const SERVER_WAVE_FEED_SEED_LIMIT = WAVE_DROPS_PARAMS.limit;
export const SERVER_WAVE_FEED_SEED_REQUEST_LIMIT =
  SERVER_WAVE_FEED_SEED_LIMIT + 1;

export type ServerWaveFeedSeedDrop = Omit<ApiDrop, "wave">;

export type ServerWaveFeedSeedResult =
  | {
      readonly ok: true;
      readonly waveId: string;
      readonly drops: readonly ServerWaveFeedSeedDrop[];
      readonly hasNextPage: boolean;
    }
  | {
      readonly ok: false;
      readonly waveId: string;
    };
