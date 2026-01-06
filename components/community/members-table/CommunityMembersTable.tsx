import type { CommunityMemberOverview } from "@/entities/IProfile";
import type { SortDirection } from "@/entities/ISort";
import type { CommunityMembersSortOption } from "@/enums";
import CommunityMembersMobileCard from "./CommunityMembersMobileCard";
import CommunityMembersTableHeader from "./CommunityMembersTableHeader";
import CommunityMembersTableRow from "./CommunityMembersTableRow";
import CommunityMembersMobileFilterBar from "./CommunityMembersMobileFilterBar";

export default function CommunityMembersTable({
  members,
  activeSort,
  sortDirection,
  page,
  pageSize,
  isLoading,
  onSort,
}: {
  readonly members: CommunityMemberOverview[];
  readonly activeSort: CommunityMembersSortOption;
  readonly sortDirection: SortDirection;
  readonly page: number;
  readonly pageSize: number;
  readonly isLoading: boolean;
  readonly onSort: (sort: CommunityMembersSortOption) => void;
}) {
  return (
    <>
      <div className="tw-hidden sm:tw-block">
        <table className="tw-min-w-full">
          <CommunityMembersTableHeader
            activeSort={activeSort}
            sortDirection={sortDirection}
            isLoading={isLoading}
            onSort={onSort}
          />
          <tbody className="tw-divide-y tw-divide-solid tw-divide-iron-700">
            {members.map((member, index) => (
              <CommunityMembersTableRow
                key={member.detail_view_key}
                member={member}
                rank={index + 1 + (page - 1) * pageSize}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:tw-hidden">
        <CommunityMembersMobileFilterBar
          activeSort={activeSort}
          sortDirection={sortDirection}
          isLoading={isLoading}
          onSort={onSort}
        />
        <div className="tw-flex tw-flex-col tw-gap-y-4 tw-mt-2">
          {members.map((member, index) => (
            <CommunityMembersMobileCard
              key={member.detail_view_key}
              member={member}
              rank={index + 1 + (page - 1) * pageSize}
            />
          ))}
        </div>
      </div>
    </>
  );
}
