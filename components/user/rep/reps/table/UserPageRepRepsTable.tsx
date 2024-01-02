import { useEffect, useState } from "react";
import {
  IProfileAndConsolidations,
  RatingStats,
} from "../../../../../entities/IProfile";
import UserPageRepRepsTableBody from "./UserPageRepRepsTableBody";
import UserPageRepRepsTableHeader from "./UserPageRepRepsTableHeader";
import { SortDirection } from "../../../../../entities/ISort";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";

export enum RepsTableSort {
  REP = "REP",
  RATERS = "RATERS",
  MY_RATES = "MY_RATES",
}

export default function UserPageRepRepsTable({
  reps,
  profile,
  giverAvailableRep,
  canEditRep,
}: {
  readonly reps: RatingStats[];
  readonly profile: IProfileAndConsolidations;
  readonly giverAvailableRep: number;
  readonly canEditRep: boolean;
}) {
  const [sortType, setSortType] = useState<RepsTableSort>(RepsTableSort.REP);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    SortDirection.DESC
  );

  const onSortTypeClick = (newSortType: RepsTableSort) => {
    if (newSortType === sortType) {
      if (sortDirection === SortDirection.DESC) {
        setSortDirection(SortDirection.ASC);
      } else {
        setSortDirection(SortDirection.DESC);
      }
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

  return (
    <div className="tw-mt-4 tw-flow-root">
      <div className="tw-overflow-x-auto tw-shadow tw-ring-1 tw-ring-white/10 tw-rounded-lg tw-divide-y tw-divide-solid tw-divide-white/10">
        <table className="tw-min-w-full tw-divide-y tw-divide-solid tw-divide-white/10">
          <UserPageRepRepsTableHeader
            activeType={sortType}
            sortDirection={sortDirection}
            onSortTypeClick={onSortTypeClick}
          />
          <UserPageRepRepsTableBody
            reps={sortedReps}
            profile={profile}
            giverAvailableRep={giverAvailableRep}
            canEditRep={canEditRep}
          />
        </table>
      </div>
    </div>
  );
}
