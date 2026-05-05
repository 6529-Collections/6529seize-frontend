import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropSearchStrategy } from "@/generated/models/ApiDropSearchStrategy";
import type { ApiWaveDropsFeedV2 } from "@/generated/models/ApiWaveDropsFeedV2";
import { commonApiFetch } from "@/services/api/common-api";
import {
  mapApiWaveOverviewToApiWaveMin,
  mapLeaderboardDropV2,
} from "@/services/api/wave-drops-v2-api";

interface FetchQuorumParticipationDropPreviewBySerialNoV2Props {
  readonly waveId: string;
  readonly serialNo: number;
  readonly signal?: AbortSignal | undefined;
}

export async function fetchQuorumParticipationDropPreviewBySerialNoV2({
  waveId,
  serialNo,
  signal,
}: FetchQuorumParticipationDropPreviewBySerialNoV2Props): Promise<ApiDrop | null> {
  const response = await commonApiFetch<ApiWaveDropsFeedV2>({
    endpoint: `v2/waves/${waveId}/drops`,
    params: {
      limit: "1",
      serial_no_limit: `${serialNo}`,
      search_strategy: ApiDropSearchStrategy.Both,
    },
    signal,
  });

  const drop = response.drops.find(
    (candidate) => candidate.serial_no === serialNo
  );
  if (!drop) {
    return null;
  }

  const wave = mapApiWaveOverviewToApiWaveMin(response.wave);
  return {
    ...mapLeaderboardDropV2({ drop, wave }),
    wave,
  } as ApiDrop;
}
