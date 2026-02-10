import CommunityMembers from "@/components/community/CommunityMembers";
import { TitleProvider } from "@/contexts/TitleContext";
import { useQuery } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));
jest.mock("react-redux", () => ({ useSelector: jest.fn() }));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  keepPreviousData: jest.fn(),
}));

jest.mock("react-use", () => ({ useDebounce: () => {} }));

jest.mock(
  "@/components/community/members-table/CommunityMembersTable",
  () => (props: any) => <div data-testid="table">{props.members.length}</div>
);

jest.mock(
  "@/components/utils/table/paginator/CommonTablePagination",
  () => (props: any) => <div data-testid="pagination">{props.totalPages}</div>
);

jest.mock(
  "@/components/community/members-table/CommunityMembersTableSkeleton",
  () => () => <div data-testid="skeleton" />
);

jest.mock(
  "@/components/community/members-table/CommunityMembersMobileSortContent",
  () => () => <div data-testid="mobile-sort" />
);

jest.mock("@/components/groups/sidebar/GroupsSidebar", () => () => (
  <div data-testid="groups-sidebar" />
));

jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperDialog",
  () =>
    ({ children, isOpen }: any) =>
      isOpen ? <div data-testid="mobile-dialog">{children}</div> : null
);

const push = jest.fn();
const replace = jest.fn();

const searchParamsMock = new Map<string, string | null>();
(usePathname as jest.Mock).mockReturnValue("/network");
(useSearchParams as jest.Mock).mockReturnValue({
  get: (key: string) => searchParamsMock.get(key) ?? null,
});
(useRouter as jest.Mock).mockReturnValue({ push, replace });
(useSelector as unknown as jest.Mock).mockReturnValue("1");

function renderComponent() {
  return render(
    <TitleProvider>
      <CommunityMembers />
    </TitleProvider>
  );
}

describe("CommunityMembers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchParamsMock.clear();
    (usePathname as jest.Mock).mockReturnValue("/network");
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => searchParamsMock.get(key) ?? null,
    });
    (useRouter as jest.Mock).mockReturnValue({ push, replace });
    (useSelector as unknown as jest.Mock).mockReturnValue("1");
  });

  it("shows skeleton while no members", () => {
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      isFetching: false,
      data: null,
    });
    renderComponent();
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  it("renders table and pagination when members loaded", () => {
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      isFetching: false,
      data: { page: 1, next: 2, count: 100, data: [{ id: 1 }, { id: 2 }] },
    });
    renderComponent();
    expect(screen.getByTestId("table")).toHaveTextContent("2");
    expect(screen.getByTestId("pagination")).toHaveTextContent("2");
  });

  it("navigates to nerd view on button click", () => {
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      isFetching: false,
      data: { page: 1, next: null, count: 2, data: [] },
    });
    renderComponent();
    fireEvent.click(screen.getByText("Nerd view"));
    expect(push).toHaveBeenCalledWith("/network/nerd");
  });
});
