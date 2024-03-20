import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { useEffect, useState } from "react";
import { commonApiFetch } from "../../../services/api/common-api";

import UserPageStatsCollected from "./UserPageStatsCollected";
import UserPageActivityWrapper from "./activity/UserPageActivityWrapper";
import UserAddressesSelectDropdown from "../utils/addresses-select/UserAddressesSelectDropdown";
import { MemeSeason } from "../../../entities/ISeason";
import { OwnerBalance, OwnerBalanceMemes } from "../../../entities/IBalances";
import UserPageStatsTags from "./tags/UserPageStatsTags";

export default function UserPageStats({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const [activeAddress, setActiveAddress] = useState<string | null>(null);

  const [seasons, setSeasons] = useState<MemeSeason[]>([]);
  const [ownerBalance, setownerBalance] = useState<OwnerBalance>();
  const [balanceMemes, setBalanceMemes] = useState<OwnerBalanceMemes[]>([]);

  useEffect(() => {
    commonApiFetch<MemeSeason[]>({
      endpoint: "new_memes_seasons",
    }).then((response) => {
      setSeasons(response);
    });
  }, []);

  useEffect(() => {
    let url;
    if (activeAddress) {
      url = `owners-balances/wallet/${activeAddress}`;
    } else {
      url = `owners-balances/consolidation/${profile.consolidation.consolidation_key}`;
    }
    commonApiFetch<OwnerBalance>({
      endpoint: url,
    }).then((response) => {
      setownerBalance(response);
    });
  }, [activeAddress]);

  useEffect(() => {
    let url;
    if (activeAddress) {
      url = `owners-balances/wallet/${activeAddress}/memes`;
    } else {
      url = `owners-balances/consolidation/${profile.consolidation.consolidation_key}/memes`;
    }
    commonApiFetch<OwnerBalanceMemes[]>({
      endpoint: url,
    }).then((response) => {
      setBalanceMemes(response);
    });
  }, [activeAddress]);

  return (
    <div className="tailwind-scope">
      <div className="tw-flex-col-reverse tw-flex lg:tw-flex-row tw-justify-between tw-gap-6 lg:tw-space-y-0 tw-w-full tw-mt-6 lg:tw-mt-8">
        <UserPageStatsTags
          ownerBalance={ownerBalance}
          balanceMemes={balanceMemes}
          seasons={seasons}
        />
        <UserAddressesSelectDropdown
          addresses={profile.consolidation.wallets}
          onActiveAddress={setActiveAddress}
        />
      </div>

      <UserPageStatsCollected
        ownerBalance={ownerBalance}
        balanceMemes={balanceMemes}
        seasons={seasons}
      />
      {/* <UserPageStatsActivityOverview tdh={tdh} /> */}

      <UserPageActivityWrapper
        profile={profile}
        activeAddress={activeAddress}
      />

      {/* <UserPageStatsBoostBreakdown tdh={tdh} /> */}
    </div>
  );
}
