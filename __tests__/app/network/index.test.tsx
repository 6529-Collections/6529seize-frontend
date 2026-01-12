import { generateMetadata } from "@/app/network/page";
import CommunityMembers from "@/components/community/CommunityMembers";
import { useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useSelector } from "react-redux";

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  keepPreviousData: "keepPreviousData",
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock("@/components/network/NetworkPageLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));
jest.mock(
  "@/components/community/members-table/CommunityMembersTable",
  () => () => <div data-testid="community-table" />
);
jest.mock(
  "@/components/utils/table/paginator/CommonTablePagination",
  () => () => <div data-testid="pagination" />
);
jest.mock(
  "@/components/community/members-table/CommunityMembersTableSkeleton",
  () => () => <div data-testid="loading-skeleton" />
);
jest.mock("@/components/groups/sidebar/GroupsSidebar", () => () => (
  <div data-testid="groups-sidebar" />
));
jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperDialog",
  () =>
    ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
      isOpen ? <div data-testid="mobile-dialog">{children}</div> : null
);

jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: () => jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("CommunityPage (App Router)", () => {
  const useSelectorMock = useSelector as unknown as jest.Mock;
  const useQueryMock = useQuery as jest.Mock;
  const useSearchParamsMock = useSearchParams as jest.Mock;
  const usePathnameMock = usePathname as jest.Mock;
  const useRouterMock = useRouter as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    useSelectorMock.mockReturnValue("g1");

    useSearchParamsMock.mockReturnValue({
      get: (key: string) => {
        switch (key) {
          case "page":
            return "1";
          case "sort-by":
            return "level";
          case "sort-direction":
            return "DESC";
          case "group":
            return "g1";
          default:
            return null;
        }
      },
      toString: () =>
        new URLSearchParams({
          page: "1",
          "sort-by": "level",
          "sort-direction": "DESC",
          group: "g1",
        }).toString(),
    });

    usePathnameMock.mockReturnValue("/network");
    useRouterMock.mockReturnValue({
      replace: jest.fn(),
      push: jest.fn(),
    });
  });

  it("renders loading state", () => {
    useQueryMock.mockReturnValue({ isLoading: true, data: null });

    render(<CommunityMembers />);

    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("renders data state", () => {
    useQueryMock.mockReturnValue({
      isLoading: false,
      isFetching: false,
      data: {
        count: 120,
        data: [],
        page: 1,
        next: true,
      },
    });

    render(<CommunityMembers />);

    expect(screen.getByTestId("community-table")).toBeInTheDocument();
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("exports correct metadata", async () => {
    const metadata = await generateMetadata();

    expect(metadata).toMatchObject({
      title: "Network",
      description: expect.stringContaining("Network"),
      twitter: { card: "summary_large_image" },
      openGraph: {
        title: "Network",
        description: expect.stringContaining("Network"),
      },
    });
  });
});
