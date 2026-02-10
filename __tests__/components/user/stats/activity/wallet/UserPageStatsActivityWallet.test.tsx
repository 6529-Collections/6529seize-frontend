import UserPageStatsActivityWallet, {
  UserPageStatsActivityWalletFilterType,
} from "@/components/user/stats/activity/wallet/UserPageStatsActivityWallet";
import { render } from "@testing-library/react";

const replace = jest.fn();

jest.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const searchParams = new Map<string, string | null>();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/path",
  useSearchParams: () => ({ get: (key: string) => searchParams.get(key) }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    isFetching: false,
    isLoading: false,
    data: { count: 0, data: [] },
  }),
  keepPreviousData: jest.fn(),
}));

jest.mock(
  "@/components/user/stats/activity/wallet/table/UserPageStatsActivityWalletTableWrapper",
  () => (props: any) => {
    props.onActiveFilter(UserPageStatsActivityWalletFilterType.MINTS);
    return <div data-testid="wrapper">{JSON.stringify(props)}</div>;
  }
);

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

describe("UserPageStatsActivityWallet", () => {
  it("uses query params and navigates on filter change", () => {
    searchParams.set("wallet_activity_filter", "airdrops");
    render(
      <UserPageStatsActivityWallet
        profile={{ wallets: [] } as any}
        activeAddress={null}
      />
    );
    expect(replace).toHaveBeenCalled();
  });
});
