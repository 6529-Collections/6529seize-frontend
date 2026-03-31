import type { ApiCollectedStats } from "@/generated/models/ApiCollectedStats";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { getCollectedStatsIdentityKey } from "./userPageStats.helpers";
import type { UserPageStatsInitialData } from "./userPageStats.types";

function normalizeAddress(value: string | string[] | undefined): string | null {
  const address = Array.isArray(value) ? value[0] : value;

  if (!address?.trim()) {
    return null;
  }

  return address.trim().toLowerCase();
}

async function fetchCollectedStats(
  headers: Record<string, string>,
  identityKey: string
) {
  return await commonApiFetch<ApiCollectedStats>({
    endpoint: `collected-stats/${encodeURIComponent(identityKey)}`,
    headers,
  });
}

export async function getUserPageStatsInitialData({
  profile,
  activeAddress,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress?: string | string[] | null | undefined;
}): Promise<UserPageStatsInitialData> {
  const normalizedAddress = normalizeAddress(activeAddress ?? undefined);
  const headers = await getAppCommonHeaders();
  const identityKey = getCollectedStatsIdentityKey(profile, normalizedAddress);
  const collectedStats = await fetchCollectedStats(headers, identityKey).catch(
    () => undefined
  );

  return {
    initialActiveAddress: normalizedAddress,
    initialCollectedStats: collectedStats,
    initialSeasons: [],
    initialTdh: undefined,
    initialOwnerBalance: undefined,
    initialBalanceMemes: [],
  };
}
