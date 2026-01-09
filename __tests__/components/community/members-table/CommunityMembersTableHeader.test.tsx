import CommunityMembersTableHeader from "@/components/community/members-table/CommunityMembersTableHeader";
import { SortDirection } from "@/entities/ISort";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock(
  "@/components/community/members-table/CommunityMembersTableHeaderSortableContent",
  () => ({
    __esModule: true,
    default: ({ sort }: { sort: string }) => <span>{sort}</span>,
  })
);

describe("CommunityMembersTableHeader", () => {
  const defaultProps = {
    activeSort: ApiCommunityMembersSortOption.Level,
    sortDirection: SortDirection.DESC,
    isLoading: false,
    onSort: jest.fn(),
  };

  it("renders all column headers", () => {
    render(
      <table>
        <CommunityMembersTableHeader {...defaultProps} />
      </table>
    );

    expect(screen.getByText("Rank")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(
      screen.getByText(ApiCommunityMembersSortOption.Level)
    ).toBeInTheDocument();
    expect(
      screen.getByText(ApiCommunityMembersSortOption.Tdh)
    ).toBeInTheDocument();
    expect(
      screen.getByText(ApiCommunityMembersSortOption.Xtdh)
    ).toBeInTheDocument();
    expect(
      screen.getByText(ApiCommunityMembersSortOption.Rep)
    ).toBeInTheDocument();
    expect(
      screen.getByText(ApiCommunityMembersSortOption.Cic)
    ).toBeInTheDocument();
    expect(screen.getByText("Last Seen")).toBeInTheDocument();
  });

  it("calls onSort when clicking sortable column", () => {
    const onSort = jest.fn();
    render(
      <table>
        <CommunityMembersTableHeader {...defaultProps} onSort={onSort} />
      </table>
    );

    const tdhHeader = screen
      .getByText(ApiCommunityMembersSortOption.Tdh)
      .closest("th")!;
    fireEvent.click(tdhHeader);

    expect(onSort).toHaveBeenCalledWith(ApiCommunityMembersSortOption.Tdh);
  });
});
