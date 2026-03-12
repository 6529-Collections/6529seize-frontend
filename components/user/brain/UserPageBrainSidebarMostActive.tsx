"use client";

import type { ReactNode } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useFavouriteWavesOfIdentity } from "@/hooks/useFavouriteWavesOfIdentity";
import UserPageBrainSidebarWaveItem from "./UserPageBrainSidebarWaveItem";
import { getProfileWaveIdentity } from "./userPageBrainSidebar.helpers";

const LoadingState = () => (
  <div className="tw-space-y-2.5" aria-label="Loading most active waves">
    {[0, 1, 2].map((key) => (
      <div
        key={key}
        className="tw-flex tw-items-center tw-gap-3 tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.05] tw-bg-white/[0.02] tw-p-3 tw-shadow-inner"
      >
        <div className="tw-h-10 tw-w-10 tw-shrink-0 tw-animate-pulse tw-rounded-xl tw-bg-white/[0.06]" />
        <div className="tw-min-w-0 tw-flex-1 tw-space-y-1.5">
          <div className="tw-h-3 tw-w-2/3 tw-animate-pulse tw-rounded tw-bg-white/[0.06]" />
          <div className="tw-h-2.5 tw-w-1/2 tw-animate-pulse tw-rounded tw-bg-white/[0.05]" />
        </div>
      </div>
    ))}
  </div>
);

export default function UserPageBrainSidebarMostActive({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const identityKey = getProfileWaveIdentity(profile);
  const hasIdentityKey = identityKey.length > 0;
  const { waves, status, error } = useFavouriteWavesOfIdentity({
    identityKey,
    limit: 3,
    enabled: hasIdentityKey,
  });
  const shouldShowLoading = hasIdentityKey && status === "pending";
  const shouldShowWaves = !error && waves.length > 0;
  const shouldRenderSection = shouldShowLoading || shouldShowWaves;
  let section: ReactNode = null;

  if (shouldRenderSection) {
    let sectionContent: ReactNode = null;

    if (shouldShowLoading) {
      sectionContent = <LoadingState />;
    } else if (shouldShowWaves) {
      sectionContent = waves.map((wave) => (
        <UserPageBrainSidebarWaveItem key={wave.id} wave={wave} />
      ));
    }

    section = (
      <section aria-labelledby="brain-most-active-waves-heading">
        <span
          id="brain-most-active-waves-heading"
          className="tw-mb-3 tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500"
        >
          Most Active In
        </span>
        <div className="tw-space-y-2.5">{sectionContent}</div>
      </section>
    );
  }

  return section;
}
