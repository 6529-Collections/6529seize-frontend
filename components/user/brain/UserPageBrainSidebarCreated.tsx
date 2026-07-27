"use client";

import { useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getUserPageBrainSidebarMessage } from "./userPageBrainSidebar.messages";
import UserPageBrainSidebarWaveItem from "./UserPageBrainSidebarWaveItem";

const DEFAULT_VISIBLE_CREATED_WAVES = 3;

interface UserPageBrainSidebarCreatedProps {
  readonly identity: string;
  readonly waves: ApiWave[];
}

export default function UserPageBrainSidebarCreated({
  identity,
  waves,
}: UserPageBrainSidebarCreatedProps) {
  const [expandedIdentity, setExpandedIdentity] = useState<string | null>(null);
  const showAllWaves = expandedIdentity === identity;
  const visibleWaves = showAllWaves
    ? waves
    : waves.slice(0, DEFAULT_VISIBLE_CREATED_WAVES);
  const remainingWavesCount = Math.max(
    waves.length - DEFAULT_VISIBLE_CREATED_WAVES,
    0
  );
  const showMoreLabel = getUserPageBrainSidebarMessage(
    remainingWavesCount === 1
      ? "user.brain.sidebar.showMore.one"
      : "user.brain.sidebar.showMore.other",
    { count: remainingWavesCount }
  );
  if (waves.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="brain-created-waves-heading"
      aria-describedby="brain-created-waves-scope"
    >
      <div className="tw-flex tw-min-w-0 tw-items-baseline tw-gap-1.5">
        <span
          id="brain-created-waves-heading"
          className="tw-shrink-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500"
        >
          {getUserPageBrainSidebarMessage("user.brain.sidebar.createdHeading")}
        </span>
        <span
          id="brain-created-waves-scope"
          className="tw-min-w-0 tw-truncate tw-text-[10px] tw-font-normal tw-text-iron-600"
        >
          · {getUserPageBrainSidebarMessage("user.brain.sidebar.createdScope")}
        </span>
      </div>
      <div className="tw-mt-3 tw-space-y-2.5">
        {visibleWaves.map((wave) => (
          <UserPageBrainSidebarWaveItem key={wave.id} wave={wave} />
        ))}
        {waves.length > DEFAULT_VISIBLE_CREATED_WAVES && (
          <button
            type="button"
            onClick={() =>
              setExpandedIdentity((current) =>
                current === identity ? null : identity
              )
            }
            className="tw-mt-2 tw-cursor-pointer tw-border-none tw-bg-black tw-px-1 tw-text-xs tw-font-semibold tw-text-iron-500 tw-transition-colors focus-visible:tw-rounded-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-300 motion-reduce:tw-transition-none"
          >
            {showAllWaves
              ? getUserPageBrainSidebarMessage("user.brain.sidebar.showLess")
              : showMoreLabel}
          </button>
        )}
      </div>
    </section>
  );
}
