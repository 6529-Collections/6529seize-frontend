import UserPageStatsActivityDistributions from "@/components/user/stats/activity/distributions/UserPageStatsActivityDistributions";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseQuery = jest.fn();

jest.mock(
  "@/components/user/stats/activity/distributions/UserPageStatsActivityDistributionsTableWrapper",
  () => (props: any) => (
    <div data-testid="wrapper" data-page={props.page}>
      <button data-testid="set-page" onClick={() => props.setPage(3)}>
        set
      </button>
    </div>
  )
);

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  keepPreviousData: {},
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const mockedCommonApiFetch = jest.mocked(commonApiFetch);

beforeEach(() => {
  mockUseQuery.mockReset();
  mockUseQuery.mockImplementation(() => ({
    isFetching: false,
    isLoading: false,
    data: { count: 20, data: [] },
  }));
  mockedCommonApiFetch.mockReset();
});

test("updates local page state", async () => {
  const profile = { wallets: [] } as any;
  render(
    <UserPageStatsActivityDistributions
      profile={profile}
      activeAddress={null}
    />
  );
  expect(screen.getByTestId("wrapper")).toHaveAttribute("data-page", "1");
  await userEvent.click(screen.getByTestId("set-page"));
  expect(screen.getByTestId("wrapper")).toHaveAttribute("data-page", "2");
});

test("fetches only the requested page for the current query key", async () => {
  render(
    <UserPageStatsActivityDistributions
      profile={{ wallets: [] } as any}
      activeAddress={null}
    />
  );

  await userEvent.click(screen.getByTestId("set-page"));

  await waitFor(() =>
    expect(screen.getByTestId("wrapper")).toHaveAttribute("data-page", "2")
  );

  const distributionsQuery = mockUseQuery.mock.calls
    .map(([config]) => config)
    .find(
      (config) =>
        config.queryKey[0] === QueryKey.PROFILE_DISTRIBUTIONS &&
        config.queryKey[1].page === "3"
    );

  if (!distributionsQuery) {
    throw new Error("Expected a distributions query for page 3");
  }

  mockedCommonApiFetch.mockResolvedValueOnce({
    count: 20,
    page: 3,
    next: null,
    data: [],
  } as any);

  await distributionsQuery.queryFn();

  expect(mockedCommonApiFetch).toHaveBeenCalledTimes(1);
  expect(mockedCommonApiFetch).toHaveBeenCalledWith({
    endpoint: "distributions",
    params: {
      page_size: "10",
      page: "3",
      wallet: "",
    },
  });
});
