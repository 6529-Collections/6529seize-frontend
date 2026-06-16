import UserPageStatsActivityDistributions from "@/components/user/stats/activity/distributions/UserPageStatsActivityDistributions";
import { getDistributionsMessage } from "@/components/user/stats/activity/distributions/distributions.messages";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = jest.fn();
const search = new Map<string, string>();
const mockUseQuery = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/profile",
  useSearchParams: () => ({
    get: (key: string) => search.get(key) ?? null,
    toString: () =>
      new URLSearchParams(Array.from(search.entries())).toString(),
  }),
}));

jest.mock(
  "@/components/user/stats/activity/distributions/UserPageStatsActivityDistributionsTableWrapper",
  () =>
    (props: {
      page: number;
      setPage: (page: number) => void;
      locale: string;
    }) => (
      <div
        data-testid="wrapper"
        data-page={props.page}
        data-locale={props.locale}
      >
        <button data-testid="set-page" onClick={() => props.setPage(3)}>
          set
        </button>
      </div>
    )
);

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  keepPreviousData: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

beforeEach(() => {
  replace.mockClear();
  search.clear();
  mockUseQuery.mockReset();
  mockUseQuery.mockImplementation((config: { queryKey: unknown[] }) => {
    if (config.queryKey[0] === QueryKey.PROFILE_DISTRIBUTIONS) {
      return {
        isFetching: false,
        isLoading: false,
        data: { count: 20, page: 2, data: [] },
      };
    }

    return {
      isFetching: false,
      isLoading: false,
      data: [],
    };
  });
});

test("hydrates the page from query params and updates the url on page change", async () => {
  search.set("distribution-page", "2");

  render(
    <UserPageStatsActivityDistributions
      profile={{ wallets: [] } as any}
      activeAddress={null}
      locale="de-DE"
    />
  );

  expect(
    screen.getByRole("heading", {
      name: getDistributionsMessage(
        "user.collected.stats.distributions.title",
        undefined,
        "de-DE"
      ),
    })
  ).toBeInTheDocument();
  expect(screen.getByTestId("wrapper")).toHaveAttribute("data-page", "2");
  expect(screen.getByTestId("wrapper")).toHaveAttribute(
    "data-locale",
    "de-DE"
  );

  await userEvent.click(screen.getByTestId("set-page"));

  expect(replace).toHaveBeenCalledWith("/profile?distribution-page=3", {
    scroll: false,
  });
});

test("preserves collected page query param without using it for distributions", async () => {
  search.set("activity", "distributions");
  search.set("page", "4");

  render(
    <UserPageStatsActivityDistributions
      profile={{ wallets: [] } as any}
      activeAddress={null}
    />
  );

  const distributionsQuery = mockUseQuery.mock.calls
    .map((call) => call[0] as { queryKey: unknown[] })
    .find((config) => config.queryKey[0] === QueryKey.PROFILE_DISTRIBUTIONS);
  expect(distributionsQuery?.queryKey[1]).toMatchObject({ page: "1" });

  await userEvent.click(screen.getByTestId("set-page"));
  expect(replace).toHaveBeenCalledWith(
    "/profile?activity=distributions&page=4&distribution-page=3",
    {
      scroll: false,
    }
  );
});
