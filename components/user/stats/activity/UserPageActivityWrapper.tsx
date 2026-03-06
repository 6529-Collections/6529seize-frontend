"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useState } from "react";
import UserPageStatsActivityDistributions from "./distributions/UserPageStatsActivityDistributions";
import UserPageActivityTabs from "./tabs/UserPageActivityTabs";
import UserPageStatsActivityTDHHistory from "./tdh-history/UserPageStatsActivityTDHHistory";
import UserPageStatsActivityWallet from "./wallet/UserPageStatsActivityWallet";

export enum USER_PAGE_ACTIVITY_TAB {
  WALLET_ACTIVITY = "WALLET_ACTIVITY",
  DISTRIBUTIONS = "DISTRIBUTIONS",
  TDH_HISTORY = "TDH_HISTORY",
}

export default function UserPageActivityWrapper({
  profile,
  activeAddress,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
}) {
  const [activeTab, setActiveTab] = useState<USER_PAGE_ACTIVITY_TAB>(
    USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY
  );

  return (
    <div className="tw-mt-7 lg:tw-mt-9">
      <UserPageActivityTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY && (
        <UserPageStatsActivityWallet
          profile={profile}
          activeAddress={activeAddress}
        />
      )}
      {activeTab === USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS && (
        <UserPageStatsActivityDistributions
          profile={profile}
          activeAddress={activeAddress}
        />
      )}
      {activeTab === USER_PAGE_ACTIVITY_TAB.TDH_HISTORY && (
        <UserPageStatsActivityTDHHistory profile={profile} />
      )}
    </div>
  );
}
