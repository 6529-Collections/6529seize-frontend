import { render, screen, fireEvent } from "@testing-library/react";
import CommunityMembersMobileSortContent from "@/components/community/members-table/CommunityMembersMobileSortContent";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import { SortDirection } from "@/entities/ISort";

jest.mock("@/components/user/utils/icons/CommonTableSortIcon", () => ({
  __esModule: true,
  default: ({ direction }: { direction: string }) => (
    <span data-testid="sort-icon">{direction}</span>
  ),
}));

describe("CommunityMembersMobileSortContent", () => {
  const defaultProps = {
    activeSort: ApiCommunityMembersSortOption.Level,
    sortDirection: SortDirection.DESC,
    onSort: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all sort options", () => {
    render(<CommunityMembersMobileSortContent {...defaultProps} />);

    expect(screen.getByText("Level")).toBeInTheDocument();
    expect(screen.getByText("TDH")).toBeInTheDocument();
    expect(screen.getByText("xTDH")).toBeInTheDocument();
    expect(screen.getByText("REP")).toBeInTheDocument();
    expect(screen.getByText("NIC")).toBeInTheDocument();
  });

  it("calls onSort when clicking an option", () => {
    const onSort = jest.fn();
    render(
      <CommunityMembersMobileSortContent {...defaultProps} onSort={onSort} />
    );

    fireEvent.click(screen.getByText("TDH"));

    expect(onSort).toHaveBeenCalledWith(ApiCommunityMembersSortOption.Tdh);
  });

  it("shows active styling for selected option", () => {
    render(<CommunityMembersMobileSortContent {...defaultProps} />);

    const levelButton = screen.getByText("Level").closest("button");
    expect(levelButton?.className).toContain("tw-border-primary-500");
  });
});
