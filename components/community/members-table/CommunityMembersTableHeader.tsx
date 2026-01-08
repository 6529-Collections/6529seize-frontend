import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";

const TDH_SORTS = new Set([
  ApiCommunityMembersSortOption.Tdh,
  ApiCommunityMembersSortOption.TdhRate,
]);

const XTDH_SORTS = new Set([
  ApiCommunityMembersSortOption.Xtdh,
  ApiCommunityMembersSortOption.XtdhRate,
]);

const XTDH_GRANTS_SORTS = new Set([
  ApiCommunityMembersSortOption.XtdhIncoming,
  ApiCommunityMembersSortOption.XtdhOutgoing,
]);

const COMBINED_TDH_SORTS = new Set([
  ApiCommunityMembersSortOption.CombinedTdh,
  ApiCommunityMembersSortOption.CombinedTdhRate,
]);

const PEER_SCORE_SORTS = new Set([
  ApiCommunityMembersSortOption.Rep,
  ApiCommunityMembersSortOption.Cic,
]);

export default function CommunityMembersTableHeader({
  activeSort,
}: {
  readonly activeSort: ApiCommunityMembersSortOption;
}) {
  const baseClass = "tw-whitespace-nowrap tw-py-3 tw-text-sm tw-font-medium";
  const activeClass = "tw-text-primary-300";
  const inactiveClass = "tw-text-iron-400";

  const isTdhActive = TDH_SORTS.has(activeSort);
  const isXtdhActive = XTDH_SORTS.has(activeSort);
  const isXtdhGrantsActive = XTDH_GRANTS_SORTS.has(activeSort);
  const isCombinedTdhActive = COMBINED_TDH_SORTS.has(activeSort);
  const isPeerScoreActive = PEER_SCORE_SORTS.has(activeSort);

  return (
    <thead className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-iron-700 tw-bg-iron-900">
      <tr>
        <th
          scope="col"
          className={`${baseClass} tw-pl-4 tw-pr-2 tw-text-left ${inactiveClass}`}
        >
          Rank
        </th>
        <th
          scope="col"
          className={`${baseClass} tw-pr-3 tw-text-left ${inactiveClass}`}
        >
          Profile
        </th>
        <th
          scope="col"
          className={`${baseClass} tw-px-3 tw-text-right ${isTdhActive ? activeClass : inactiveClass}`}
        >
          TDH
        </th>
        <th
          scope="col"
          className={`${baseClass} tw-px-3 tw-text-right ${isXtdhActive ? activeClass : inactiveClass}`}
        >
          xTDH
        </th>
        <th
          scope="col"
          className={`${baseClass} tw-px-3 tw-text-right ${isCombinedTdhActive ? activeClass : inactiveClass}`}
        >
          Combined
        </th>
        <th
          scope="col"
          className={`${baseClass} tw-px-3 tw-text-right ${isXtdhGrantsActive ? activeClass : inactiveClass}`}
        >
          Grants
        </th>
        <th
          scope="col"
          className={`${baseClass} tw-px-3 tw-text-right ${isPeerScoreActive ? activeClass : inactiveClass}`}
        >
          Peer Score
        </th>
        <th
          scope="col"
          className={`${baseClass} tw-px-3 tw-text-right sm:tw-pr-4 ${inactiveClass}`}
        >
          Last Seen
        </th>
      </tr>
    </thead>
  );
}
