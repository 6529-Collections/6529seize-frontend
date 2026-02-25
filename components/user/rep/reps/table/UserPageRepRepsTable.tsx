"use client";

import { useEffect, useState } from "react";

import type { RatingStats } from "@/entities/IProfile";
import { SortDirection } from "@/entities/ISort";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";

import UserPageRepRepsTableBody from "./UserPageRepRepsTableBody";
import UserPageRepRepsTableHeader from "./UserPageRepRepsTableHeader";

export enum RepsTableSort {
  REP = "REP",
  RATERS = "RATERS",
  MY_RATES = "MY_RATES",
}

const DEFAULT_INITIAL_COUNT = 10;

export default function UserPageRepRepsTable({
  reps,
  profile,
  canEditRep,
  initialCount = DEFAULT_INITIAL_COUNT,
}: {
  readonly reps: RatingStats[];
  readonly profile: ApiIdentity;
  readonly canEditRep: boolean;
  readonly initialCount?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const [sortType, setSortType] = useState<RepsTableSort>(RepsTableSort.REP);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    SortDirection.DESC
  );

  const onSortTypeClick = (newSortType: RepsTableSort) => {
    if (newSortType === sortType) {
      setSortDirection((prev) =>
        prev === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC
      );
    } else {
      setSortType(newSortType);
      setSortDirection(SortDirection.DESC);
    }
  };

  const compareValuesForSort = (
    a: number,
    d: number,
    dir: SortDirection,
    zeroAtEnd: boolean = false
  ) => {
    if (!zeroAtEnd) {
      return dir === SortDirection.DESC ? d - a : a - d;
    }

    if (a === 0 && d === 0) {
      return 0;
    } else if (a === 0) {
      return 1;
    } else if (d === 0) {
      return -1;
    }
    return dir === SortDirection.DESC ? d - a : a - d;
  };

  const sortReps = (
    items: RatingStats[],
    sort: RepsTableSort,
    dir: SortDirection
  ): RatingStats[] => {
    switch (sort) {
      case RepsTableSort.REP:
        return items.sort((a, d) =>
          compareValuesForSort(a.rating, d.rating, dir)
        );
      case RepsTableSort.RATERS:
        return items.sort((a, d) =>
          compareValuesForSort(a.contributor_count, d.contributor_count, dir)
        );
      case RepsTableSort.MY_RATES:
        return items.sort((a, d) =>
          compareValuesForSort(
            a.rater_contribution,
            d.rater_contribution,
            dir,
            true
          )
        );
      default:
        assertUnreachable(sort);
        return items;
    }
  };

  const [sortedReps, setSortedReps] = useState<RatingStats[]>(
    sortReps(reps, sortType, sortDirection)
  );

  useEffect(() => {
    setSortedReps(sortReps(reps, sortType, sortDirection));
  }, [reps, sortType, sortDirection]);

  useEffect(() => {
    if (!canEditRep && sortType === RepsTableSort.MY_RATES) {
      setSortType(RepsTableSort.REP);
      setSortDirection(SortDirection.DESC);
    }
  }, [canEditRep, sortType]);

  const displayedReps = showAll
    ? sortedReps
    : sortedReps.slice(0, initialCount);
  const hasMore = sortedReps.length > initialCount;
  const maxRep = Math.max(...reps.map((r) => Math.abs(r.rating)), 0);

  return (
    <div className="tw-flow-root">
      <div className="tw-overflow-x-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
        <table
          className="tw-min-w-full tw-border-separate"
          style={{ borderSpacing: "0 0.25rem" }}
        >
          <UserPageRepRepsTableHeader
            activeType={sortType}
            sortDirection={sortDirection}
            showMyRates={canEditRep}
            onSortTypeClick={onSortTypeClick}
          />

          <UserPageRepRepsTableBody
            reps={displayedReps}
            profile={profile}
            canEditRep={canEditRep}
            maxRep={maxRep}
          />
        </table>
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="tw-w-full tw-mt-2 tw-py-2.5 tw-text-xs tw-font-medium tw-text-iron-400 tw-bg-transparent tw-border tw-border-solid tw-border-white/[0.14] tw-rounded-lg tw-cursor-pointer tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-200 desktop-hover:hover:tw-border-white/[0.2]"
        >
          {showAll ? "Show less" : `See all ${sortedReps.length}`}
        </button>
      )}
    </div>
  );
}
