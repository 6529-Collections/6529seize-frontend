import CommunityMembers from "@/components/community/CommunityMembers";
import { useAuth } from "@/components/auth/Auth";
import { TitleProvider } from "@/contexts/TitleContext";
import { useQuery } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));
jest.mock("@/contexts/ActiveGroupContext", () => ({
  useActiveGroup: jest.fn(),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
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

jest.mock(
  "@/components/community/CommunityMembersGroupFilter",
  () =>
    ({ activeGroupId, onGroupChange }: any) => (
      <div data-testid="network-group-filter" data-group-id={activeGroupId}>
        <button
          type="button"
          onClick={() => onGroupChange({ id: "new-group", name: "New group" })}
        >
          Apply group filter
        </button>
      </div>
    )
);
jest.mock(
  "@/components/community/CommunityMembersGroupDetails",
  () =>
    ({ groupId, onClose }: { groupId: string; onClose: () => void }) => (
      <div data-testid="group-details">
        {groupId}
        <button type="button" onClick={onClose}>
          Clear selected group
        </button>
      </div>
    )
);

jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperDialog",
  () =>
    ({ children, headerClassName, isOpen, title }: any) =>
      isOpen ? (
        <div
          data-testid="mobile-dialog"
          data-header-class={headerClassName}
          data-title={title}
        >
          {children}
        </div>
      ) : null
);

const push = jest.fn();
const replace = jest.fn();
const setActiveGroupId = jest.fn();

const searchParamsMock = new Map<string, string | null>();
(usePathname as jest.Mock).mockReturnValue("/network");
(useSearchParams as jest.Mock).mockReturnValue({
  get: (key: string) => searchParamsMock.get(key) ?? null,
});
(useRouter as jest.Mock).mockReturnValue({ push, replace });
(useActiveGroup as unknown as jest.Mock).mockReturnValue({
  activeGroupId: "1",
  setActiveGroupId,
});

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
    (useActiveGroup as unknown as jest.Mock).mockReturnValue({
      activeGroupId: "1",
      setActiveGroupId,
    });
    (useAuth as jest.Mock).mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: null,
      isAuthenticated: false,
    });
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
    expect(screen.getByTestId("group-details")).toHaveTextContent("1");
    expect(
      screen.getByRole("heading", { name: "Members" })
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Clear selected group" })
    );
    expect(setActiveGroupId).toHaveBeenCalledWith(null);
  });

  it("does not render cached members when the scoped request fails", () => {
    searchParamsMock.set("group", "1");
    (useQuery as jest.Mock).mockReturnValue({
      isError: true,
      isLoading: false,
      isFetching: false,
      data: { page: 1, next: null, count: 1, data: [{ id: 1 }] },
    });

    renderComponent();

    expect(screen.queryByTestId("table")).not.toBeInTheDocument();
    expect(screen.getByText("Group members unavailable.")).toBeInTheDocument();
  });

  it("shows a scoped error while a deep-linked group syncs to context", () => {
    searchParamsMock.set("group", "deep-linked-group");
    (useActiveGroup as unknown as jest.Mock).mockReturnValue({
      activeGroupId: null,
      setActiveGroupId,
    });
    (useQuery as jest.Mock).mockReturnValue({
      isError: true,
      isLoading: false,
      isFetching: false,
      data: undefined,
    });

    renderComponent();

    expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    expect(screen.getByText("Group members unavailable.")).toBeInTheDocument();
  });

  it("partitions proxy results by the connected profile and proxy", () => {
    searchParamsMock.set("group", "group-1");
    (useAuth as jest.Mock).mockReturnValue({
      activeProfileProxy: { id: "proxy-1" },
      connectedProfile: { id: "viewer-1", handle: "viewer" },
      isAuthenticated: true,
    });
    let queryKey: readonly unknown[] | undefined;
    (useQuery as jest.Mock).mockImplementation(
      (options: { readonly queryKey: readonly unknown[] }) => {
        queryKey = options.queryKey;
        return {
          isError: false,
          isLoading: true,
          isFetching: true,
          data: undefined,
        };
      }
    );

    renderComponent();

    expect(queryKey?.[1]).toEqual(
      expect.objectContaining({
        viewerIdentityKey: "proxy:viewer-1:proxy-1",
      })
    );
  });

  it("only preserves previous results for the same group and viewer", () => {
    searchParamsMock.set("group", "group-1");
    (useAuth as jest.Mock).mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: { id: "viewer-1", handle: "viewer" },
      isAuthenticated: true,
    });
    type CapturedQueryOptions = {
      readonly queryKey: readonly unknown[];
      readonly placeholderData: (
        previousData: unknown,
        previousQuery: { readonly queryKey: readonly unknown[] }
      ) => unknown;
    };
    let queryOptions: CapturedQueryOptions | undefined;
    (useQuery as jest.Mock).mockImplementation(
      (options: CapturedQueryOptions) => {
        queryOptions = options;
        return {
          isError: false,
          isLoading: true,
          isFetching: true,
          data: undefined,
        };
      }
    );

    renderComponent();

    expect(queryOptions).toBeDefined();
    const capturedOptions = queryOptions!;
    const previousData = {
      page: 1,
      next: null,
      count: 1,
      data: [{ id: 1 }],
    };
    expect(capturedOptions.queryKey[1]).toEqual(
      expect.objectContaining({
        groupId: "group-1",
        viewerIdentityKey: "profile:viewer-1",
      })
    );
    expect(
      capturedOptions.placeholderData(previousData, {
        queryKey: [
          "COMMUNITY_MEMBERS_TOP",
          { groupId: "group-1", viewerIdentityKey: "profile:viewer-1" },
        ],
      })
    ).toBe(previousData);
    expect(
      capturedOptions.placeholderData(previousData, {
        queryKey: [
          "COMMUNITY_MEMBERS_TOP",
          { groupId: "another-group", viewerIdentityKey: "profile:viewer-1" },
        ],
      })
    ).toBeUndefined();
    expect(
      capturedOptions.placeholderData(previousData, {
        queryKey: [
          "COMMUNITY_MEMBERS_TOP",
          { groupId: "group-1", viewerIdentityKey: null },
        ],
      })
    ).toBeUndefined();
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

  it("opens group filters with top-padded dialog header", () => {
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      isFetching: false,
      data: { page: 1, next: null, count: 0, data: [] },
    });
    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: /Open group filters/ }));

    expect(screen.getByTestId("mobile-dialog")).toHaveAttribute(
      "data-header-class",
      expect.stringContaining("tw-pt-4")
    );
    expect(screen.getByTestId("mobile-dialog")).toHaveAttribute(
      "data-title",
      "Filter Network"
    );
    expect(screen.getByTestId("network-group-filter")).toHaveAttribute(
      "data-group-id",
      "1"
    );

    fireEvent.click(screen.getByRole("button", { name: "Apply group filter" }));
    expect(setActiveGroupId).toHaveBeenCalledWith("new-group");
  });
});
