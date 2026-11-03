import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropSearchPage } from "@/generated/models/ApiDropSearchPage";
import { commonApiFetch } from "@/services/api/common-api";
import { mapApiWaveOverviewToApiWaveMin } from "@/services/api/drop-v2-mappers";
import { mapLeaderboardDropV2 } from "@/services/api/wave-drops-v2-api";

export async function fetchGlobalDropsSearchV2({
  term,
  authorId,
  page,
  size,
  signal,
  cursor,
}: {
  readonly term: string;
  readonly cursor?: string | undefined;
  readonly authorId?: string | undefined;
  readonly page: number;
  readonly size: number;
  readonly signal?: AbortSignal | undefined;
}): Promise<{
  data: ApiDrop[];
  page: number;
  next: boolean;
  cursor?: string | undefined;
}> {
  const response = await commonApiFetch<ApiDropSearchPage>({
    endpoint: "v2/drops/search",
    params: {
      ...(term ? { term } : {}),
      ...(authorId ? { author_id: authorId } : {}),
      ...(cursor ? { cursor } : {}),
      page: page.toString(),
      size: size.toString(),
    },
    signal,
  });
  return {
    ...response,
    data: response.data.flatMap((drop) => {
      if (!drop.wave) return [];
      const wave = {
        ...mapApiWaveOverviewToApiWaveMin(drop.wave),
        is_dm_wave: drop.wave.is_dm_wave,
      };
      return [{ ...mapLeaderboardDropV2({ drop, wave }), wave }];
    }),
  };
}
