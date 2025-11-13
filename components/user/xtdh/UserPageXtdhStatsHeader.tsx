"use client";

import { useIdentityTdhStats } from "@/hooks/useIdentityTdhStats";

import { AllocationSection } from "./user-page-xtdh-stats-header/AllocationSection";
import { BaseMetricsSection } from "./user-page-xtdh-stats-header/BaseMetricsSection";
import { ReceivingSection } from "./user-page-xtdh-stats-header/ReceivingSection";
import { buildStatsContent } from "./user-page-xtdh-stats-header/content";
import { normalizeProfileIdentifier } from "./user-page-xtdh-stats-header/normalizeProfileIdentifier";
import { UserPageXtdhStatsHeaderError } from "./user-page-xtdh-stats-header/UserPageXtdhStatsHeaderError";
import { UserPageXtdhStatsHeaderSkeleton } from "./user-page-xtdh-stats-header/UserPageXtdhStatsHeaderSkeleton";
import type { UserPageXtdhStatsHeaderProps } from "./user-page-xtdh-stats-header/types";
import { useEffect } from "react";

export default function UserPageXtdhStatsHeader({
  profileId,
}: Readonly<UserPageXtdhStatsHeaderProps>) {
  const normalizedProfileId = normalizeProfileIdentifier(profileId);
  const statsQuery = useIdentityTdhStats({
    identity: normalizedProfileId,
    enabled: Boolean(normalizedProfileId),
  });

  useEffect(() => console.log(statsQuery.data), [statsQuery.data]);

  if (statsQuery.isLoading) {
    return <UserPageXtdhStatsHeaderSkeleton />;
  }

  if (statsQuery.isError || !statsQuery.data) {
    const message = statsQuery.error?.message ?? "Failed to load xTDH stats.";
    const handleRetry = () => {
      void statsQuery.refetch();
    };
    return (
      <UserPageXtdhStatsHeaderError
        message={message}
        onRetry={handleRetry}
      />
    );
  }

  const statsContent = buildStatsContent(statsQuery.data);

  return (
    <section
      className="tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-5 tw-text-iron-100 tw-shadow-md tw-shadow-black/30"
      role="region"
      aria-label="xTDH Statistics"
    >
      <BaseMetricsSection cards={statsContent.baseMetricCards} />
      <AllocationSection allocation={statsContent.allocation} />
      <ReceivingSection receiving={statsContent.receiving} />
    </section>
  );
}

