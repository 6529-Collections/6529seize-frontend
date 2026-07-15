"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useWaveById } from "@/hooks/useWaveById";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";

interface ProfileCurationBadgeProps {
  readonly profile: ApiIdentity;
}

const getTrimmedText = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
};

export default function ProfileCurationBadge({
  profile,
}: ProfileCurationBadgeProps) {
  const profileWaveId = getTrimmedText(profile.profile_wave_id);
  const { wave } = useWaveById(profileWaveId, {
    enabled: Boolean(profileWaveId),
  });
  const hasConfirmedWave = wave?.id === profileWaveId;

  const profileWithWave = {
    ...profile,
    profile_wave_id: hasConfirmedWave ? profileWaveId : null,
    profile_wave_name: hasConfirmedWave ? wave.name : null,
    profile_wave_pfp: hasConfirmedWave ? wave.picture : null,
  };

  return (
    <DropAuthorBadges
      profile={profileWithWave}
      tooltipIdPrefix="profile-author-badges"
      className="tw-inline-flex tw-min-h-6 tw-items-center tw-gap-x-1.5 [&_button]:tw-min-h-6 [&_button]:tw-min-w-6"
    />
  );
}
