import { ApiDropSearchStrategy } from "@/generated/models/ApiDropSearchStrategy";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import type { ApiWaveDropsFeedV2 } from "@/generated/models/ApiWaveDropsFeedV2";
import { commonApiFetch } from "@/services/api/common-api";
import { mapApiWaveOverviewToApiWaveMin } from "@/services/api/drop-v2-mappers";
import { hydrateDropsV2 } from "@/services/api/wave-drops-v2-api";
import { getDropEndpointId } from "@/services/api/wave-drops-v2-helpers";

export interface DropReplyWindow extends ApiWaveDropsFeed {
  readonly older: number | null;
  readonly newer: number | null;
}

function selectReplyPage(
  drops: ApiDropV2[],
  serialNo: number,
  strategy: ApiDropSearchStrategy,
  limit: number
) {
  if (strategy === ApiDropSearchStrategy.Newer) {
    // The API returns the nearest newer results, newest first. Exclude any
    // overlapping cursor and trim the extra, farthest row.
    const candidates = drops.filter((drop) => drop.serial_no > serialNo);
    const page = candidates.slice(-limit);
    return {
      page,
      // Refetch can start at a newer page that has since become empty.
      // In that case rebuild history from the last known boundary, inclusive.
      older: page.at(-1)?.serial_no ?? serialNo + 1,
      newer: candidates.length > limit ? (page[0]?.serial_no ?? null) : null,
    };
  }

  const initialPage = strategy === ApiDropSearchStrategy.Both;
  const boundary = initialPage ? serialNo + 1 : serialNo;
  const candidates = drops.filter((drop) => drop.serial_no < boundary);
  const page = candidates.slice(0, limit);
  let newer = page[0]?.serial_no ?? null;
  if (initialPage) {
    newer = drops.some((drop) => drop.serial_no > serialNo) ? serialNo : null;
  }
  return {
    page,
    older: candidates.length > limit ? (page.at(-1)?.serial_no ?? null) : null,
    newer,
  };
}

export async function fetchDropReplyWindowV2({
  parentDropId,
  serialNo,
  strategy,
  limit,
  signal,
}: {
  readonly parentDropId: string;
  readonly serialNo: number;
  readonly strategy: ApiDropSearchStrategy;
  readonly limit: number;
  readonly signal: AbortSignal;
}): Promise<DropReplyWindow> {
  const data = await commonApiFetch<ApiWaveDropsFeedV2>({
    endpoint: `v2/drops/${getDropEndpointId(parentDropId)}/replies`,
    params: {
      limit: (limit + 1).toString(),
      serial_no_limit: serialNo.toString(),
      search_strategy: strategy,
    },
    signal,
  });

  const { page, older, newer } = selectReplyPage(
    data.drops,
    serialNo,
    strategy,
    limit
  );
  const wave = mapApiWaveOverviewToApiWaveMin(data.wave);
  return {
    wave,
    drops: await hydrateDropsV2({ drops: page, wave, signal }),
    older,
    newer,
  };
}
