import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { MemeSeason } from "@/entities/ISeason";
import type { ConsolidatedTDH, TDH } from "@/entities/ITDH";
import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import { getStatsPath } from "./userPageStats.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import UserPageStatsClient from "./UserPageStatsClient";

async function fetchSeasons(headers: Record<string, string>) {
  return await commonApiFetch<MemeSeason[]>({
    endpoint: "new_memes_seasons",
    headers,
  });
}

async function fetchTdh(
  headers: Record<string, string>,
  statsPath: string
) {
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

export default async function UserPageStats({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const headers = await getAppCommonHeaders();
  const statsPath = getStatsPath(profile, null);

  const [seasons, tdh, ownerBalance, balanceMemes] = await Promise.all([
    fetchSeasons(headers).catch(() => []),
    fetchTdh(headers, statsPath).catch(() => undefined),
    fetchOwnerBalance(headers, statsPath).catch(() => undefined),
    fetchOwnerBalanceMemes(headers, statsPath).catch(() => []),
  ]);

  return (
    <UserPageStatsClient
      profile={profile}
      initialSeasons={seasons}
      initialTdh={tdh}
      initialOwnerBalance={ownerBalance}
      initialBalanceMemes={balanceMemes}
    />
  );
}
