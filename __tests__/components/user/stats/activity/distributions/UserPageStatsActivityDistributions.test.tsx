import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageStatsActivityDistributions from "../../../../../../components/user/stats/activity/distributions/UserPageStatsActivityDistributions";

jest.mock("../../../../../../components/user/stats/activity/distributions/UserPageStatsActivityDistributionsTableWrapper", () => (props: any) => (
  <button data-testid="set-page" onClick={() => props.setPage(3)}>set</button>
));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(() => ({ isFetching: false, isLoading: false, data: { count: 0, page: 1, data: [] } })),
  keepPreviousData: {},
}));

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

const { useRouter } = jest.requireMock("next/router");
const { usePathname, useSearchParams } = jest.requireMock("next/navigation");

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({ replace: jest.fn() });
  (usePathname as jest.Mock).mockReturnValue("/profile");
  (useSearchParams as jest.Mock).mockReturnValue({
    get: (k: string) => (k === "page" ? "2" : null),
    toString: () => "page=2",
  });
});

test("calls router replace on page change", async () => {
  const profile = { wallets: [] } as any;
  render(
    <UserPageStatsActivityDistributions profile={profile} activeAddress={null} />
  );
  await userEvent.click(screen.getByTestId("set-page"));
  const router = useRouter();
  expect(router.replace).toHaveBeenCalledWith(
    "/profile?" + new URLSearchParams({ page: "3" }).toString(),
    undefined,
    { shallow: true }
  );
});
