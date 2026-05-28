"use client";

import type { ApiProfileRepRatesState } from "@/entities/IProfile";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useMemo } from "react";

const getRatingColorClass = (rating: number): string => {
  if (rating > 0) {
    return "tw-text-green";
  }

  if (rating < 0) {
    return "tw-text-red";
  }

  return "tw-text-iron-400";
};

export default function UserProfileTooltipTopRep({
  repRates,
}: {
  readonly repRates: ApiProfileRepRatesState | undefined;
}) {
  const topRepCategories = useMemo(() => {
    const ratingStats = repRates?.rating_stats ?? [];

    if (ratingStats.length === 0) return [];

    return [...ratingStats]
      .sort(
        (a, b) =>
          b.rating - a.rating || b.contributor_count - a.contributor_count
      )
      .slice(0, 3);
  }, [repRates]);

  if (topRepCategories.length === 0) {
    return null;
  }

  return (
    <div className="tw-mt-4">
      <div className="tw-mb-2 tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wider tw-text-iron-500">
        Top Rep
      </div>
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        {topRepCategories.map((rep) => (
          <div
            key={rep.category}
            className="tw-group tw-inline-flex tw-min-w-0 tw-items-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-[#18191B] tw-px-2 tw-py-1.5 tw-transition-all tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/10"
          >
            <span className="tw-max-w-[132px] tw-truncate tw-text-xs tw-font-medium tw-text-white">
              {rep.category}
            </span>
            <span
              className={`tw-whitespace-nowrap tw-text-xs tw-font-medium tw-transition-colors ${getRatingColorClass(
                rep.rating
              )}`}
            >
              {formatNumberWithCommas(rep.rating)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
