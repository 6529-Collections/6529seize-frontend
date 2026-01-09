import CommunityMembersTable from "@/components/community/members-table/CommunityMembersTable";
import { SortDirection } from "@/entities/ISort";
import type { ApiCommunityMemberOverview } from "@/generated/models/ApiCommunityMemberOverview";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import { render, screen } from "@testing-library/react";

jest.mock(
  "@/components/community/members-table/CommunityMembersTableHeader",
  () => ({
    __esModule: true,
    default: ({
      onSort,
      activeSort,
    }: {
      onSort: (sort: ApiCommunityMembersSortOption) => void;
      activeSort: ApiCommunityMembersSortOption;
    }) => (
      <thead data-testid="header">
        <tr>
          <th
            data-testid="sortable-header"
            onClick={() => onSort(ApiCommunityMembersSortOption.Tdh)}
          >
            {activeSort}
          </th>
        </tr>
      </thead>
    ),
  })
);

jest.mock(
  "@/components/community/members-table/CommunityMembersTableRow",
  () => ({
    __esModule: true,
    default: ({
      rank,
      member,
    }: {
      rank: number;
      member: ApiCommunityMemberOverview;
    }) => (
      <tr data-testid="row">
        <td>{`${rank}-${member.display}`}</td>
      </tr>
    ),
  })
);

jest.mock(
  "@/components/community/members-table/CommunityMembersMobileCard",
  () => ({
    __esModule: true,
    default: ({
      rank,
      member,
    }: {
      rank: number;
      member: ApiCommunityMemberOverview;
    }) => (
      <div data-testid="mobile-card">
        {rank}-{member.display}
      </div>
    ),
  })
);

const createMember = (
  display: string,
  wallet: string
): ApiCommunityMemberOverview => ({
  display,
  detail_view_key: display.toLowerCase(),
  level: 1,
  tdh: 10,
  tdh_rate: 0,
  xtdh: 0,
  xtdh_rate: 0,
  combined_tdh: 10,
  combined_tdh_rate: 0,
  rep: 5,
  cic: 2,
  pfp: null,
  last_activity: null,
  wallet,
  xtdh_outgoing: 0,
  xtdh_incoming: 0,
});

const members: ApiCommunityMemberOverview[] = [
  createMember("Alice", "0x1"),
  createMember("Bob", "0x2"),
];

const baseProps = {
  members,
  page: 2,
  pageSize: 5,
  activeSort: ApiCommunityMembersSortOption.Level,
  sortDirection: SortDirection.DESC,
  isLoading: false,
  onSort: jest.fn(),
};

describe("CommunityMembersTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders rows with correct rank calculation", () => {
      render(<CommunityMembersTable {...baseProps} />);

      const rows = screen.getAllByTestId("row");
      expect(rows).toHaveLength(2);
      expect(rows[0]).toHaveTextContent("6-Alice");
      expect(rows[1]).toHaveTextContent("7-Bob");

      expect(screen.getByTestId("header")).toBeInTheDocument();
    });

    it("renders mobile cards with correct rank calculation", () => {
      render(<CommunityMembersTable {...baseProps} />);

      const cards = screen.getAllByTestId("mobile-card");
      expect(cards).toHaveLength(2);
      expect(cards[0]).toHaveTextContent("6-Alice");
      expect(cards[1]).toHaveTextContent("7-Bob");
    });
  });

  describe("edge cases", () => {
    it("renders empty state when no members", () => {
      render(<CommunityMembersTable {...baseProps} members={[]} />);

      expect(screen.queryAllByTestId("row")).toHaveLength(0);
      expect(screen.queryAllByTestId("mobile-card")).toHaveLength(0);
    });

    it("renders single member correctly", () => {
      const singleMember = [createMember("Charlie", "0x3")];
      render(<CommunityMembersTable {...baseProps} members={singleMember} />);

      expect(screen.getAllByTestId("row")).toHaveLength(1);
      expect(screen.getAllByTestId("mobile-card")).toHaveLength(1);
    });

    it("calculates rank from page 1 correctly", () => {
      render(<CommunityMembersTable {...baseProps} page={1} />);

      const rows = screen.getAllByTestId("row");
      expect(rows[0]).toHaveTextContent("1-Alice");
      expect(rows[1]).toHaveTextContent("2-Bob");
    });
  });

  describe("sorting", () => {
    it("displays current active sort", () => {
      render(<CommunityMembersTable {...baseProps} />);

      expect(screen.getByTestId("header")).toHaveTextContent(
        ApiCommunityMembersSortOption.Level
      );
    });

    it("passes onSort to header", () => {
      const onSort = jest.fn();
      render(<CommunityMembersTable {...baseProps} onSort={onSort} />);

      screen.getByTestId("sortable-header").click();

      expect(onSort).toHaveBeenCalledWith(ApiCommunityMembersSortOption.Tdh);
    });
  });

  describe("props passing", () => {
    it("passes isLoading to header", () => {
      render(<CommunityMembersTable {...baseProps} isLoading={true} />);

      expect(screen.getByTestId("header")).toBeInTheDocument();
    });

    it("passes sortDirection to header", () => {
      render(
        <CommunityMembersTable
          {...baseProps}
          sortDirection={SortDirection.ASC}
        />
      );

      expect(screen.getByTestId("header")).toBeInTheDocument();
    });
  });
});
