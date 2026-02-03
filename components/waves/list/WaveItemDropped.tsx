"use client";

import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import type { ApiWave } from "@/generated/models/ApiWave";
import { numberWithCommas } from "@/helpers/Helpers";

export default function WaveItemDropped({ wave }: { readonly wave: ApiWave }) {
  const contributors = wave.contributors_overview ?? [];

  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-2">
      <div className="tw-hidden tw-flex-shrink @[320px]/wave:tw-flex">
        <OverlappingAvatars
          items={contributors.map((c, index) => {
            const href = c.contributor_identity
              ? `/${c.contributor_identity}`
              : undefined;
            return {
              key: `${c.contributor_identity ?? "anon"}-${c.contributor_pfp ?? "no-pfp"}-${index}`,
              pfpUrl: c.contributor_pfp ?? null,
              ...(href !== undefined && { href }),
              ariaLabel: c.contributor_identity
                ? `View @${c.contributor_identity}`
                : "View contributor profile",
              fallback:
                c.contributor_identity?.slice(0, 2).toUpperCase() ?? "?",
            };
          })}
          maxCount={5}
          size="sm"
          overlapClass="-tw-space-x-1"
          onItemClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-1 tw-text-sm">
        <span className="tw-flex-shrink-0 tw-text-sm tw-font-medium tw-text-white">
          {numberWithCommas(wave.metrics.drops_count)}
        </span>
        <span className="tw-min-w-0 tw-truncate tw-font-normal tw-text-iron-500">
          {wave.metrics.drops_count === 1 ? "Drop" : "Drops"}
        </span>
      </div>
    </div>
  );
}
