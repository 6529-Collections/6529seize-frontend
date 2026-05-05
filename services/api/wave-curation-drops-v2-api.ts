import type { ApiCurationDrop } from "@/generated/models/ApiCurationDrop";
import type { ApiCurationDropsPage } from "@/generated/models/ApiCurationDropsPage";
import type { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";
import type { ApiDropV2PageWithoutCount } from "@/generated/models/ApiDropV2PageWithoutCount";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import { toApiWaveMin } from "@/helpers/waves/wave.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { mapLeaderboardDropV2 } from "@/services/api/wave-drops-v2-api";

interface FetchWaveCurationDropsV2Props {
  readonly wave: ApiWave | ApiWaveMin;
  readonly curationId: string;
  readonly page: number;
  readonly pageSize: number;
  readonly signal?: AbortSignal | undefined;
}

const normalizeWaveMin = (wave: ApiWave | ApiWaveMin): ApiWaveMin =>
  "description_drop" in wave ? toApiWaveMin(wave) : wave;

const FALLBACK_CONTEXT_PROFILE_CONTEXT: ApiDropContextProfileContext = {
  rating: 0,
  min_rating: 0,
  max_rating: 0,
  reaction: null,
  boosted: false,
  bookmarked: false,
  curatable: false,
  curated: false,
};

const mapCurationDropV2 = (
  drop: ApiDropV2PageWithoutCount["data"][number],
  wave: ApiWaveMin
): ApiCurationDrop => {
  const mappedDrop = mapLeaderboardDropV2({ drop, wave });

  return {
    drop_priority_order: null,
    ...mappedDrop,
    context_profile_context:
      mappedDrop.context_profile_context ?? FALLBACK_CONTEXT_PROFILE_CONTEXT,
  };
};

export async function fetchWaveCurationDropsV2({
  wave,
  curationId,
  page,
  pageSize,
  signal,
}: FetchWaveCurationDropsV2Props): Promise<ApiCurationDropsPage> {
  const waveMin = normalizeWaveMin(wave);
  const response = await commonApiFetch<ApiDropV2PageWithoutCount>({
    endpoint: `v2/waves/${waveMin.id}/curations/${curationId}/drops`,
    params: {
      page: page.toString(),
      page_size: pageSize.toString(),
    },
    signal,
  });

  return {
    data: response.data.map((drop) => mapCurationDropV2(drop, waveMin)),
    page: response.page,
    next: response.next,
  };
}
