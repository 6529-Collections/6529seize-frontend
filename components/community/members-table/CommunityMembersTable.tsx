import { CommunityMemberOverview } from "../../../entities/IProfile";
import { SortDirection } from "../../../entities/ISort";
import { CommunityMembersSortOption } from "../../../enums";
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
  readonly members: CommunityMemberOverview[];
  readonly activeSort: CommunityMembersSortOption;
  readonly sortDirection: SortDirection;
  readonly page: number;
  readonly pageSize: number;
  readonly isLoading: boolean;
  readonly onSort: (sort: CommunityMembersSortOption) => void;
}) {
  return (
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
  );
}
