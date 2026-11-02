import { useCollectedStatsData } from "@/components/user/collected/stats/useCollectedStatsData";
import UserPageStatsCollected from "@/components/user/stats/UserPageStatsCollected";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/hooks/useMediaQuery", () => ({ useMediaQuery: () => true }));

const wallets = ["0xaaa", "0xbbb", "0xccc", "0xddd"];
const consolidationKey = wallets.join("-");
const profile = {
  handle: "four-wallet-collector",
  primary_wallet: wallets[0],
  consolidation_key: consolidationKey,
  wallets: wallets.map((wallet) => ({ wallet, display: wallet, tdh: 100 })),
} as ApiIdentity;
const apiMock = commonApiFetch as jest.Mock;

function CollectedDetails({
  activeAddress,
}: {
  readonly activeAddress: string | null;
}) {
  const data = useCollectedStatsData({
    profile,
    activeAddress,
    isDetailsOpen: true,
    initialStatsData: {
      initialActiveAddress: activeAddress,
      initialCollectedStats: undefined,
      initialSeasons: [],
      initialTdh: undefined,
      initialOwnerBalance: undefined,
      initialBalanceMemes: [],
    },
  });
  return (
    <UserPageStatsCollected
      ownerBalance={data.ownerBalance}
      balanceMemes={data.balanceMemes}
      seasons={data.seasons}
    />
  );
}

describe("four-wallet collected statistics", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockImplementation(async ({ endpoint }: { endpoint: string }) => {
      switch (endpoint) {
        case "collected-stats/four-wallet-collector":
          return { boost: 1, memes_balance: 4, unique_memes: 4, seasons: [] };
        case "new_memes_seasons":
          return [{ id: 1, count: 4 }];
        case `tdh/consolidation/${consolidationKey}`:
          return { wallets, boosted_tdh: 400 };
        case `owners-balances/consolidation/${consolidationKey}`:
          return {
            total_balance: 4,
            memes_balance: 4,
            boosted_tdh: 400,
            boosted_memes_tdh: 400,
          };
        case `owners-balances/consolidation/${consolidationKey}/memes`:
          return [
            { season: 1, balance: 4, unique: 4, sets: 1, boosted_tdh: 400 },
          ];
        default:
          throw new Error(`Unexpected statistics endpoint: ${endpoint}`);
      }
    });
  });

  it.each([null, wallets[3]!])(
    "renders the full group's holdings and TDH with custody filter %s",
    async (activeAddress) => {
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      render(
        <QueryClientProvider client={client}>
          <CollectedDetails activeAddress={activeAddress} />
        </QueryClientProvider>
      );

      const seasonRow = await screen.findByRole("row", { name: /Season 1/ });
      const seasonCells = within(seasonRow).getAllByRole("cell");
      expect(seasonCells.map((cell) => cell.textContent)).toEqual([
        "4",
        "4 / 4 (100%)",
        "1",
        "400",
      ]);
      const cardsRow = screen.getByRole("row", { name: /^Cards/ });
      expect(within(cardsRow).getAllByRole("cell")[0]).toHaveTextContent(/^4$/);
      const tdhRow = screen.getByRole("row", { name: /^TDH/ });
      expect(within(tdhRow).getAllByRole("cell")[0]).toHaveTextContent(/^400$/);
      expect(apiMock.mock.calls.map(([request]) => request.endpoint)).toEqual([
        "collected-stats/four-wallet-collector",
        "new_memes_seasons",
        `tdh/consolidation/${consolidationKey}`,
        `owners-balances/consolidation/${consolidationKey}`,
        `owners-balances/consolidation/${consolidationKey}/memes`,
      ]);
    }
  );
});
