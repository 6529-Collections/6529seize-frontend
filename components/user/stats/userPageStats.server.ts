import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import type { MemeSeason } from "@/entities/ISeason";
import type { ConsolidatedTDH, TDH } from "@/entities/ITDH";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { getStatsPath } from "./userPageStats.helpers";
import type { UserPageStatsInitialData } from "./userPageStats.types";

function normalizeAddress(value: string | string[] | undefined): string | null {
  const address = Array.isArray(value) ? value[0] : value;

  if (!address?.trim()) {
    return null;
  }

  return address.trim().toLowerCase();
}

async function fetchSeasons(headers: Record<string, string>) {
  return await commonApiFetch<MemeSeason[]>({
    endpoint: "new_memes_seasons",
    headers,
  });
}

async function fetchTdh(headers: Record<string, string>, statsPath: string) {
  return await commonApiFetch<ConsolidatedTDH | TDH>({
    endpoint: `tdh/${statsPath}`,
    headers,
  });
}

async function fetchOwnerBalance(
  headers: Record<string, string>,
  statsPath: string
) {
  return await commonApiFetch<OwnerBalance>({
    endpoint: `owners-balances/${statsPath}`,
    headers,
  });
}

async function fetchOwnerBalanceMemes(
  headers: Record<string, string>,
  statsPath: string
) {
  return await commonApiFetch<OwnerBalanceMemes[]>({
    endpoint: `owners-balances/${statsPath}/memes`,
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
  const statsPath = getStatsPath(profile, normalizedAddress);

  const [seasons, tdh, ownerBalance, balanceMemes] = await Promise.all([
    fetchSeasons(headers).catch(() => []),
    fetchTdh(headers, statsPath).catch(() => undefined),
    fetchOwnerBalance(headers, statsPath).catch(() => undefined),
    fetchOwnerBalanceMemes(headers, statsPath).catch(() => []),
  ]);

  return {
    initialActiveAddress: normalizedAddress,
    initialSeasons: seasons,
    initialTdh: tdh,
    initialOwnerBalance: ownerBalance,
    initialBalanceMemes: balanceMemes,
  };
}
