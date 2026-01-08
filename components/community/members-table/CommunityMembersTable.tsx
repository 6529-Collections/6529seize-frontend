import type { ApiCommunityMemberOverview } from "@/generated/models/ApiCommunityMemberOverview";
import type { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import CommunityMembersMobileCard from "./CommunityMembersMobileCard";
import CommunityMembersTableHeader from "./CommunityMembersTableHeader";
import CommunityMembersTableRow from "./CommunityMembersTableRow";

export default function CommunityMembersTable({
  members,
  page,
  pageSize,
  activeSort,
}: {
  readonly members: ApiCommunityMemberOverview[];
  readonly page: number;
  readonly pageSize: number;
  readonly activeSort: ApiCommunityMembersSortOption;
}) {
  return (
    <>
      <div className="tw-hidden sm:tw-block">
        <table className="tw-min-w-full">
          <CommunityMembersTableHeader activeSort={activeSort} />
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
        <div className="tw-flex tw-flex-col tw-gap-y-4">
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
