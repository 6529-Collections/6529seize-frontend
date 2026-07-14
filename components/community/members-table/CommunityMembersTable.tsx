import type { ApiCommunityMemberOverview } from "@/generated/models/ApiCommunityMemberOverview";
import type { SortDirection } from "@/entities/ISort";
import type { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import CommunityMembersMobileCard from "./CommunityMembersMobileCard";
import CommunityMembersTableHeader from "./CommunityMembersTableHeader";
import CommunityMembersTableRow from "./CommunityMembersTableRow";

export default function CommunityMembersTable({
  members,
  activeSort,
  sortDirection,
  page,
  pageSize,
  isLoading,
  onSort,
}: {
  readonly members: ApiCommunityMemberOverview[];
  readonly activeSort: ApiCommunityMembersSortOption;
  readonly sortDirection: SortDirection;
  readonly page: number;
  readonly pageSize: number;
  readonly isLoading: boolean;
  readonly onSort: (sort: ApiCommunityMembersSortOption) => void;
}) {
  return (
    <>
      <div className="tw-hidden sm:tw-block">
        <table className="tw-min-w-full tw-border-collapse">
          <CommunityMembersTableHeader
            activeSort={activeSort}
            sortDirection={sortDirection}
            isLoading={isLoading}
            onSort={onSort}
          />
          <tbody>
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

      <div className="tw-mt-3 sm:tw-hidden">
        <div className="tw-flex tw-flex-col tw-gap-y-3">
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
