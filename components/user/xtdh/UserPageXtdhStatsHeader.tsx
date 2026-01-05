"use client";

import { UserXtdhStats } from "./UserXtdhStats";
import { useIdentityTdhStats } from "@/hooks/useIdentityTdhStats";

import { normalizeProfileIdentifier } from "./user-page-xtdh-stats-header/normalizeProfileIdentifier";
import { UserPageXtdhStatsHeaderError } from "./user-page-xtdh-stats-header/UserPageXtdhStatsHeaderError";
import { UserPageXtdhStatsHeaderSkeleton } from "./user-page-xtdh-stats-header/UserPageXtdhStatsHeaderSkeleton";

interface UserPageXtdhStatsHeaderProps {
  readonly profileId: string | null;
  readonly onOutboundClick?: (() => void) | undefined;
}

export default function UserPageXtdhStatsHeader({
  profileId,
  onOutboundClick,
}: Readonly<UserPageXtdhStatsHeaderProps>) {
  const normalizedProfileId = normalizeProfileIdentifier(profileId);
  const hasIdentity = Boolean(normalizedProfileId);

  const statsQuery = useIdentityTdhStats({
    identity: normalizedProfileId,
    enabled: hasIdentity,
  });

  if (!hasIdentity) {
    return null;
  }

  if (statsQuery.isLoading) {
    return <UserPageXtdhStatsHeaderSkeleton />;
  }

  if (statsQuery.isError || !statsQuery.data) {
    const message = statsQuery.error?.message ?? "Failed to load xTDH stats.";
    const handleRetry = () => {
      statsQuery.refetch().catch(() => undefined);
    };
    return (
      <UserPageXtdhStatsHeaderError message={message} onRetry={handleRetry} />
    );
  }

  return (
    <UserXtdhStats
      generationRate={statsQuery.data.generationRate}
      incomingRate={statsQuery.data.incomingRate}
      unusedRate={statsQuery.data.unusedRate}
      onOutboundClick={onOutboundClick}
    />
  );
}
