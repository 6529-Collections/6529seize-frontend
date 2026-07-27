"use client";

import type { SidebarWave } from "@/types/waves.types";
import { getUserPageBrainSidebarMessage } from "./userPageBrainSidebar.messages";
import UserPageBrainSidebarWaveItem from "./UserPageBrainSidebarWaveItem";

interface UserPageBrainSidebarMostActiveProps {
  readonly latestProfileActivityByWaveId: ReadonlyMap<string, number>;
  readonly waves: SidebarWave[];
}

export default function UserPageBrainSidebarMostActive({
  latestProfileActivityByWaveId,
  waves,
}: UserPageBrainSidebarMostActiveProps) {
  if (waves.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="brain-most-active-waves-heading"
      aria-describedby="brain-most-active-waves-ranking"
    >
      <div className="tw-mb-3 tw-flex tw-min-w-0 tw-items-baseline tw-gap-1.5">
        <span
          id="brain-most-active-waves-heading"
          className="tw-shrink-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500"
        >
          {getUserPageBrainSidebarMessage(
            "user.brain.sidebar.mostActiveHeading"
          )}
        </span>
        <span
          id="brain-most-active-waves-ranking"
          className="tw-min-w-0 tw-truncate tw-text-[10px] tw-font-normal tw-text-iron-600"
        >
          · {getUserPageBrainSidebarMessage("user.brain.sidebar.rankingBasis")}
        </span>
      </div>
      <div className="tw-space-y-2.5">
        {waves.map((wave) => (
          <UserPageBrainSidebarWaveItem
            key={wave.id}
            wave={wave}
            metadataMode="context"
            profileActivityTimestamp={
              latestProfileActivityByWaveId.get(wave.id) ?? null
            }
          />
        ))}
      </div>
    </section>
  );
}
