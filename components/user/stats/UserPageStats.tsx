import { ApiIdentity } from "../../../generated/models/ApiIdentity";
import { useEffect, useState } from "react";
import { commonApiFetch } from "../../../services/api/common-api";

import UserPageStatsCollected from "./UserPageStatsCollected";
import UserPageActivityWrapper from "./activity/UserPageActivityWrapper";
import UserAddressesSelectDropdown from "../utils/addresses-select/UserAddressesSelectDropdown";
import { MemeSeason } from "../../../entities/ISeason";
import { OwnerBalance, OwnerBalanceMemes } from "../../../entities/IBalances";
import UserPageStatsTags from "./tags/UserPageStatsTags";
import UserPageStatsActivityOverview from "./UserPageStatsActivityOverview";
import UserPageStatsBoostBreakdown from "./UserPageStatsBoostBreakdown";
import { ConsolidatedTDH, TDH } from "../../../entities/ITDH";

export function getStatsPath(
  profile: ApiIdentity,
  activeAddress: string | null
) {
  if (activeAddress) {
    return `wallet/${activeAddress}`;
  }
  if (profile.consolidation_key) {
    return `consolidation/${profile.consolidation_key}`;
  }
  return `wallet/${profile.wallets?.[0].wallet}`;
}

export default function UserPageStats({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const [activeAddress, setActiveAddress] = useState<string | null>(null);

  const [seasons, setSeasons] = useState<MemeSeason[]>([]);
  const [tdh, setTdh] = useState<ConsolidatedTDH | TDH>();
  const [ownerBalance, setOwnerBalance] = useState<OwnerBalance>();
  const [balanceMemes, setBalanceMemes] = useState<OwnerBalanceMemes[]>([]);

  useEffect(() => {
    commonApiFetch<MemeSeason[]>({
      endpoint: "new_memes_seasons",
    }).then((response) => {
      setSeasons(response);
    });
  }, []);

  useEffect(() => {
    const url = `tdh/${getStatsPath(profile, activeAddress)}`;
    commonApiFetch<ConsolidatedTDH | TDH>({
      endpoint: url,
    }).then((response) => {
      setTdh(response);
    });
  }, [activeAddress, profile]);

  useEffect(() => {
    const url = `owners-balances/${getStatsPath(profile, activeAddress)}`;
    commonApiFetch<OwnerBalance>({
      endpoint: url,
    })
      .then((response) => {
        setOwnerBalance(response);
      })
      .catch((error) => {
        setOwnerBalance(undefined);
      });
  }, [activeAddress, profile]);

  useEffect(() => {
    const url = `owners-balances/${getStatsPath(profile, activeAddress)}/memes`;
    commonApiFetch<OwnerBalanceMemes[]>({
      endpoint: url,
    }).then((response) => {
      setBalanceMemes(response);
    });
  }, [activeAddress, profile]);

  return (
    <div className="tailwind-scope">
      <div className="tw-flex-col-reverse tw-flex lg:tw-flex-row tw-justify-between tw-gap-6 lg:tw-space-y-0 tw-w-full tw-mt-6 lg:tw-mt-8">
        <UserPageStatsTags
          ownerBalance={ownerBalance}
          balanceMemes={balanceMemes}
          seasons={seasons}
        />
        <div>
          <UserAddressesSelectDropdown
            wallets={profile.wallets ?? []}
            onActiveAddress={setActiveAddress}
          />
        </div>
      </div>

      <UserPageStatsCollected
        ownerBalance={ownerBalance}
        balanceMemes={balanceMemes}
        seasons={seasons}
      />

      <UserPageStatsActivityOverview
        profile={profile}
        activeAddress={activeAddress}
      />

      <UserPageActivityWrapper
        profile={profile}
        activeAddress={activeAddress}
      />

      <UserPageStatsBoostBreakdown tdh={tdh} />
    </div>
  );
}
