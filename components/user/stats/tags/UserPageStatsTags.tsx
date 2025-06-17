"use client";

import { useEffect, useState } from "react";
import UserPageStatsTagsSet from "./UserPageStatsTagsSet";
import { formatNumberWithCommasOrDash } from "../../../../helpers/Helpers";
import {
  OwnerBalance,
  OwnerBalanceMemes,
} from "../../../../entities/IBalances";
import { MemeSeason } from "../../../../entities/ISeason";

export interface UserPageStatsTag {
  readonly id: string;
  readonly title: string;
  readonly classes: string;
}

export default function UserPageStatsTags({
  ownerBalance,
  balanceMemes,
  seasons,
}: {
  readonly ownerBalance: OwnerBalance | undefined;
  readonly balanceMemes: OwnerBalanceMemes[];
  readonly seasons: MemeSeason[];
}) {
  const getMainTags = (): UserPageStatsTag[] => {
    const result: UserPageStatsTag[] = [];

    if (!ownerBalance) {
      return result;
    }

    if (ownerBalance.nextgen_balance) {
      result.push({
        id: "nextgen",
        title: `NextGen x${formatNumberWithCommasOrDash(
          ownerBalance.nextgen_balance
        )}`,
        classes:
          "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-400/20",
      });
    }

    if (ownerBalance.memes_cards_sets) {
      result.push({
        id: "memes_sets",
        title: `Meme Sets x${formatNumberWithCommasOrDash(
          ownerBalance.memes_cards_sets
        )}`,
        classes:
          "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-400/20",
      });
    }

    if (ownerBalance.memes_balance) {
      result.push({
        id: "memes",
        title: `Memes x${formatNumberWithCommasOrDash(
          ownerBalance.memes_balance
        )} ${
          ownerBalance.unique_memes === ownerBalance.memes_balance
            ? ""
            : `(unique x${formatNumberWithCommasOrDash(
                ownerBalance.unique_memes
              )})`
        }`,
        classes:
          "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-400/20",
      });
    }

    if (ownerBalance.gradients_balance) {
      result.push({
        id: "gradients",
        title: `Gradients x${formatNumberWithCommasOrDash(
          ownerBalance.gradients_balance
        )}`,
        classes:
          "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-400/20",
      });
    }

    if (ownerBalance.boost) {
      result.push({
        id: "boost",
        title: `Boost x${formatNumberWithCommasOrDash(ownerBalance.boost)}`,
        classes:
          "tw-whitespace-nowrap tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-400/10 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-400/20",
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

  const mainTags = getMainTags();
  const seasonTags = getSeasonTags();

  const [haveAnyTags, setHaveAnyTags] = useState<boolean>(
    !!mainTags.length || !!seasonTags.length
  );

  useEffect(() => {
    setHaveAnyTags(!!mainTags.length || !!seasonTags.length);
  }, [mainTags, seasonTags]);

  if (!haveAnyTags) {
    return <div></div>;
  }

  return (
    <div className="tw-space-y-2 sm:tw-space-y-3">
      <UserPageStatsTagsSet tags={mainTags} />
      <UserPageStatsTagsSet tags={seasonTags} />
    </div>
  );
}
