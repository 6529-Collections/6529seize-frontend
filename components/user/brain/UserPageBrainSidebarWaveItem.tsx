"use client";

import type { ReactNode } from "react";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getTimeAgoShort, numberWithCommas } from "@/helpers/Helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import Link from "next/link";
import WavePicture from "@/components/waves/WavePicture";

type BrainSidebarWaveItemDisplay = {
  readonly href: string;
  readonly isPrivate: boolean;
  readonly dropsCount: string;
  readonly lastDropTimestamp: ApiWave["metrics"]["latest_drop_timestamp"];
};

const getBrainSidebarWaveItemDisplay = (
  wave: ApiWave
): BrainSidebarWaveItemDisplay => ({
  href: getWaveRoute({
    waveId: wave.id,
    isDirectMessage: wave.chat.scope.group?.is_direct_message ?? false,
    isApp: false,
  }),
  isPrivate:
    Boolean(wave.visibility.scope.group) &&
    !(wave.chat.scope.group?.is_direct_message ?? false),
  dropsCount: numberWithCommas(wave.metrics.drops_count),
  lastDropTimestamp: wave.metrics.latest_drop_timestamp,
});

export default function UserPageBrainSidebarWaveItem({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const contributors = wave.contributors_overview.map((contributor) => ({
    pfp: contributor.contributor_pfp,
    identity: contributor.contributor_identity,
  }));
  const { href, isPrivate, dropsCount, lastDropTimestamp } =
    getBrainSidebarWaveItemDisplay(wave);
  let metaContent: ReactNode = <span>No drops yet</span>;

  if (lastDropTimestamp) {
    metaContent = (
      <>
        <span>{getTimeAgoShort(lastDropTimestamp)}</span>
        <span className="tw-h-1 tw-w-1 tw-rounded-full tw-bg-white/25" />
        <span>{dropsCount} drops</span>
      </>
    );
  }

  return (
    <Link
      href={href}
      prefetch={false}
      className="tw-group tw-flex tw-cursor-pointer tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-3 tw-no-underline tw-shadow-inner tw-transition-all desktop-hover:hover:tw-border-white/[0.1] desktop-hover:hover:tw-bg-white/[0.04]"
    >
      <div className="tw-relative tw-h-10 tw-w-10 tw-shrink-0 tw-overflow-hidden tw-rounded-full tw-border tw-border-solid tw-border-white/10">
        <div className="tw-absolute tw-inset-0 tw-z-10 tw-bg-black/20 tw-transition-colors desktop-hover:group-hover:tw-bg-transparent" />
        <WavePicture
          name={wave.name}
          picture={wave.picture}
          contributors={contributors}
        />
      </div>

      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-justify-center">
        <div className="tw-mb-1 tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5">
            {isPrivate && (
              <LockClosedIcon className="tw-h-3 tw-w-3 tw-shrink-0 tw-text-white/30" />
            )}
            <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors desktop-hover:group-hover:tw-text-iron-50">
              {wave.name}
            </span>
          </div>
        </div>

        <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-iron-500">
          {metaContent}
        </div>
      </div>
    </Link>
  );
}
