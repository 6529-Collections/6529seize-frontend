import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropPoll } from "@/generated/models/ApiDropPoll";
import type { ApiDropPollsPage } from "@/generated/models/ApiDropPollsPage";
import type { ApiDropSearchStrategy } from "@/generated/models/ApiDropSearchStrategy";
import type { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiPageSortDirection } from "@/generated/models/ApiPageSortDirection";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import type { ApiWavePoll } from "@/generated/models/ApiWavePoll";

export interface FetchWaveDropsV2Props {
  readonly waveId: string;
  readonly limit: number;
  readonly serialNoLimit?: number | null | undefined;
  readonly searchStrategy?: ApiDropSearchStrategy | undefined;
  readonly dropType?: ApiDropType | undefined;
  readonly signal?: AbortSignal | undefined;
  readonly headers?: Record<string, string> | undefined;
  readonly includeFullMetadata?: boolean | undefined;
  readonly includeTopRaters?: boolean | undefined;
  readonly withRetry?: boolean | undefined;
}

export interface FetchBoostedDropsV2Props {
  readonly waveId: string;
  readonly wave: ApiWave | ApiWaveMin;
  readonly limit: number;
  readonly sortDirection?: string | undefined;
  readonly sort?: string | undefined;
  readonly countOnlyBoostsAfter?: number | undefined;
}

export interface FetchGlobalBoostedDropsV2Props {
  readonly limit: number;
  readonly sortDirection?: string | undefined;
  readonly sort?: string | undefined;
  readonly countOnlyBoostsAfter?: number | undefined;
  readonly minBoosts?: number | undefined;
  readonly signal?: AbortSignal | undefined;
}

export interface FetchDropRepliesV2Props {
  readonly parentDropId: string;
  readonly page: number;
  readonly pageSize: number;
  readonly wave?: ApiWave | ApiWaveMin | undefined;
  readonly signal?: AbortSignal | undefined;
}

export interface FetchWaveLeaderboardV2Props {
  readonly waveId: string;
  readonly params: Record<string, string>;
  readonly signal?: AbortSignal | undefined;
}

export interface FetchWaveDropsSearchV2Props {
  readonly wave: ApiWave | ApiWaveMin;
  readonly term: string;
  readonly page: number;
  readonly size: number;
  readonly signal?: AbortSignal | undefined;
}

export interface FetchWaveCompetitionDropsV2Props {
  readonly wave: ApiWave | ApiWaveMin;
  readonly authorId: string;
  readonly dropType: ApiDropType.Participatory | ApiDropType.Winner;
  readonly page: number;
  readonly pageSize: number;
  readonly signal?: AbortSignal | undefined;
}

export type WaveCompetitionDrop = ApiDrop & {
  readonly voting_open: boolean;
};

export interface WaveCompetitionDropsPage {
  readonly data: WaveCompetitionDrop[];
  readonly page: number;
  readonly next: boolean;
}

export type WavePollsState = "OPEN" | "CLOSED";
export type WavePollsSort = "created_at" | "closing_time";
export type ApiWavePollDropRow = Partial<ApiWavePoll> & {
  readonly poll?: ApiDropPoll | undefined;
};
export type ApiWavePollsPage = Omit<ApiDropPollsPage, "data"> & {
  readonly data: ApiWavePollDropRow[];
};

export interface FetchWavePollsV2Props {
  readonly waveId: string;
  readonly page: number;
  readonly pageSize: number;
  readonly sortDirection: ApiPageSortDirection;
  readonly sort: WavePollsSort;
  readonly state?: WavePollsState | undefined;
  readonly signal?: AbortSignal | undefined;
}

export interface FetchDropsV2ByIdsProps {
  readonly dropIds: readonly string[];
  readonly signal?: AbortSignal | undefined;
  readonly includeFullMetadata?: boolean | undefined;
  readonly includeTopRaters?: boolean | undefined;
}

export type ApiWaveDropsV2PageFeed = ApiWaveDropsFeed & {
  readonly count: number;
  readonly page: number;
  readonly next: boolean;
};
