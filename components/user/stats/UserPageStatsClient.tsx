"use client";

import UserPageStatsCollected from "./UserPageStatsCollected";
import UserPageActivityWrapper from "./activity/UserPageActivityWrapper";
import UserAddressesSelectDropdown from "../utils/addresses-select/UserAddressesSelectDropdown";
import UserPageStatsTags from "./tags/UserPageStatsTags";
import UserPageStatsActivityOverview from "./UserPageStatsActivityOverview";
import UserPageStatsBoostBreakdown from "./UserPageStatsBoostBreakdown";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { MemeSeason } from "@/entities/ISeason";
import type { ConsolidatedTDH, TDH } from "@/entities/ITDH";
import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import { useEffect, useMemo, useState } from "react";
import { commonApiFetch } from "@/services/api/common-api";
import { getStatsPath } from "./userPageStats.helpers";
import { isAddress } from "viem";

type Props = {
  readonly profile: ApiIdentity;
  readonly initialSeasons: MemeSeason[];
  readonly initialTdh?: ConsolidatedTDH | TDH | undefined;
  readonly initialOwnerBalance?: OwnerBalance | undefined;
  readonly initialBalanceMemes: OwnerBalanceMemes[];
};

export default function UserPageStatsClient({
  profile,
  initialSeasons,
  initialTdh,
  initialOwnerBalance,
  initialBalanceMemes,
}: Readonly<Props>) {
  const [activeAddress, setActiveAddress] = useState<string | null>(null);

  const [seasons, setSeasons] = useState<MemeSeason[]>(initialSeasons);
  const [tdh, setTdh] = useState<ConsolidatedTDH | TDH | undefined>(initialTdh);
  const [ownerBalance, setOwnerBalance] = useState<OwnerBalance | undefined>(
    initialOwnerBalance
  );
  const [balanceMemes, setBalanceMemes] =
    useState<OwnerBalanceMemes[]>(initialBalanceMemes);
  const activeAddressForStats = useMemo(() => {
    if (!activeAddress) {
      return null;
    }

    const trimmed = activeAddress.trim();

    if (!isAddress(trimmed)) {
      return null;
    }

    return trimmed.toLowerCase();
  }, [activeAddress]);

  const statsPath = useMemo(() => {
    try {
      return getStatsPath(profile, activeAddressForStats);
    } catch {
      return null;
    }
  }, [profile, activeAddressForStats]);

  useEffect(() => setSeasons(initialSeasons), [initialSeasons]);
  useEffect(() => setTdh(initialTdh), [initialTdh]);
  useEffect(() => setOwnerBalance(initialOwnerBalance), [initialOwnerBalance]);
  useEffect(() => setBalanceMemes(initialBalanceMemes), [initialBalanceMemes]);

  useEffect(() => {
    const controller = new AbortController();

    if (initialSeasons.length > 0) {
      return () => controller.abort();
    }
    commonApiFetch<MemeSeason[]>({
      endpoint: "new_memes_seasons",
      signal: controller.signal,
    })
      .then(setSeasons)
      .catch((error) => {
        if ((error as { name?: string | undefined })?.name === "AbortError") {
          return;
        }
        setSeasons([]);
      });
    return () => controller.abort();
  }, [initialSeasons.length]);

  useEffect(() => {
    const controller = new AbortController();

    if (activeAddressForStats === null && initialTdh != null) {
      setTdh(initialTdh);
      return () => controller.abort();
    }

    if (statsPath === null) {
      setTdh(initialTdh);
      return () => controller.abort();
    }

    const url = `tdh/${statsPath}`;
    commonApiFetch<ConsolidatedTDH | TDH>({
      endpoint: url,
      signal: controller.signal,
    })
      .then(setTdh)
      .catch((error) => {
        if ((error as { name?: string | undefined })?.name === "AbortError") {
          return;
        }
        setTdh(undefined);
      });

    return () => controller.abort();
  }, [activeAddressForStats, initialTdh, statsPath]);

  useEffect(() => {
    const controller = new AbortController();

    if (activeAddressForStats === null && initialOwnerBalance != null) {
      setOwnerBalance(initialOwnerBalance);
      return () => controller.abort();
    }

    if (statsPath === null) {
      setOwnerBalance(initialOwnerBalance);
      return () => controller.abort();
    }

    const url = `owners-balances/${statsPath}`;
    commonApiFetch<OwnerBalance>({
      endpoint: url,
      signal: controller.signal,
    })
      .then(setOwnerBalance)
      .catch((error) => {
        if ((error as { name?: string | undefined })?.name === "AbortError") {
          return;
        }
        setOwnerBalance(undefined);
      });

    return () => controller.abort();
  }, [activeAddressForStats, initialOwnerBalance, statsPath]);

  useEffect(() => {
    const controller = new AbortController();

    if (activeAddressForStats === null && initialBalanceMemes != null) {
      setBalanceMemes(initialBalanceMemes);
      return () => controller.abort();
    }

    if (statsPath === null) {
      setBalanceMemes(initialBalanceMemes);
      return () => controller.abort();
    }

    const url = `owners-balances/${statsPath}/memes`;
    commonApiFetch<OwnerBalanceMemes[]>({
      endpoint: url,
      signal: controller.signal,
    })
      .then(setBalanceMemes)
      .catch((error) => {
        if ((error as { name?: string | undefined })?.name === "AbortError") {
          return;
        }
        setBalanceMemes([]);
      });

    return () => controller.abort();
  }, [activeAddressForStats, initialBalanceMemes, statsPath]);

  return (
    <div className="tailwind-scope">
      <div className="tw-flex-col-reverse tw-flex lg:tw-flex-row tw-justify-between tw-gap-6 lg:tw-space-y-0 tw-w-full tw-mt-6 lg:tw-mt-8">
        <UserPageStatsTags
          ownerBalance={ownerBalance}
          balanceMemes={balanceMemes}
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
        activeAddress={activeAddressForStats}
      />

      <UserPageActivityWrapper
        profile={profile}
        activeAddress={activeAddressForStats}
      />

      <UserPageStatsBoostBreakdown tdh={tdh} />
    </div>
  );
}
