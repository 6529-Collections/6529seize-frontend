"use client";

import type { ApiProfileRepRatesState } from "@/entities/IProfile";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useMemo } from "react";

export default function UserProfileTooltipTopRep({
  repRates,
}: {
  readonly repRates: ApiProfileRepRatesState | undefined;
}) {
  const topRepCategories = useMemo(() => {
    if (!repRates?.rating_stats?.length) return [];
    return [...repRates.rating_stats]
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
      <span className="tw-font-medium tw-text-iron-400">
        Top Rep
      </span>
      <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mt-2">
        {topRepCategories.map((rep) => (
          <div
            key={rep.category}
            className="tw-flex tw-items-center tw-gap-x-1.5 tw-px-2.5 tw-py-1 tw-rounded-md tw-bg-iron-800/60 tw-ring-1 tw-ring-inset tw-ring-iron-700/50"
          >
            <span className="tw-text-xs tw-font-medium tw-text-iron-200 tw-truncate tw-max-w-[120px]">
              {rep.category}
            </span>
            <span
              className={`tw-text-xs tw-font-semibold ${
                rep.rating > 0 ? "tw-text-green" : "tw-text-red"
              }`}
            >
              {formatNumberWithCommas(rep.rating)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
