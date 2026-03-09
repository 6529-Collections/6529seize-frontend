"use client";

import UserPageStatsTagsSet from "./UserPageStatsTagsSet";
import { formatNumberWithCommasOrDash } from "@/helpers/Helpers";
import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";

export interface UserPageStatsTag {
  readonly id: string;
  readonly title: string;
  readonly classes: string;
}

interface UserPageStatsMainMetric {
  readonly id: string;
  readonly label: string;
  readonly val: string;
  readonly sub?: string;
}

export default function UserPageStatsTags({
  ownerBalance,
  balanceMemes,
}: {
  readonly ownerBalance: OwnerBalance | undefined;
  readonly balanceMemes: OwnerBalanceMemes[];
}) {
  const getMainMetrics = (): UserPageStatsMainMetric[] => {
    const result: UserPageStatsMainMetric[] = [];

    if (!ownerBalance) {
      return result;
    }

    if (ownerBalance.nextgen_balance) {
      result.push({
        id: "nextgen",
        label: "NextGen",
        val: `x${formatNumberWithCommasOrDash(ownerBalance.nextgen_balance)}`,
      });
    }

    if (ownerBalance.memes_cards_sets) {
      result.push({
        id: "memes_sets",
        label: "Meme Sets",
        val: `x${formatNumberWithCommasOrDash(ownerBalance.memes_cards_sets)}`,
      });
    }

    if (ownerBalance.memes_balance) {
      const memesSub =
        ownerBalance.unique_memes === ownerBalance.memes_balance
          ? null
          : `unique x${formatNumberWithCommasOrDash(ownerBalance.unique_memes)}`;

      result.push({
        id: "memes",
        label: "Memes",
        val: `x${formatNumberWithCommasOrDash(ownerBalance.memes_balance)}`,
        ...(memesSub ? { sub: memesSub } : {}),
      });
    }

    if (ownerBalance.gradients_balance) {
      result.push({
        id: "gradients",
        label: "Gradients",
        val: `x${formatNumberWithCommasOrDash(ownerBalance.gradients_balance)}`,
      });
    }

    if (ownerBalance.boost) {
      result.push({
        id: "boost",
        label: "Boost",
        val: `x${formatNumberWithCommasOrDash(ownerBalance.boost)}`,
      });
    }

    return result;
  };

  const getSeasonTags = (): UserPageStatsTag[] => {
    const result: UserPageStatsTag[] = [];

    if (!balanceMemes.length) {
      return result;
    }

    for (const balance of balanceMemes) {
      if (balance.sets > 0 && balance.season) {
        result.push({
          id: balance.season.toString(),
          title: `SZN${balance.season} Sets x${formatNumberWithCommasOrDash(
            balance.sets
          )}`,
          classes:
            "w-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-ring-1 tw-ring-inset tw-bg-[#B884FF]/10 tw-text-[#B884FF] tw-ring-[#B884FF]/20",
        });
      }
    }

    return result;
  };

  const mainMetrics = getMainMetrics();
  const seasonTags = getSeasonTags();
  const haveAnyTags = mainMetrics.length > 0 || seasonTags.length > 0;

  if (!haveAnyTags) {
    return <div></div>;
  }

  return (
    <div className="tw-space-y-2 sm:tw-space-y-3">
      {mainMetrics.length > 0 && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 md:tw-gap-6">
          {mainMetrics.map((metric, index) => (
            <div
              key={metric.id}
              className="tw-flex tw-items-center tw-gap-4 md:tw-gap-6"
            >
              <div className="tw-flex tw-flex-col">
                <span className="tw-mb-0.5 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-white/30">
                  {metric.label}
                </span>
                <div className="tw-flex tw-items-baseline tw-gap-1.5">
                  <span className="tw-text-[15px] tw-font-semibold tw-text-white/90">
                    {metric.val}
                  </span>
                  {metric.sub && (
                    <span className="tw-text-[10px] tw-font-medium tw-text-white/30">
                      {metric.sub}
                    </span>
                  )}
                </div>
              </div>
              {index < mainMetrics.length - 1 && (
                <div className="tw-hidden tw-h-6 tw-w-px tw-bg-white/10 sm:tw-block" />
              )}
            </div>
          ))}
        </div>
      )}
      {seasonTags.length > 0 && <UserPageStatsTagsSet tags={seasonTags} />}
    </div>
  );
}
