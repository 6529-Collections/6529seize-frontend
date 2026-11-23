import CollectRuleCard from "@/components/collect/CollectRuleCard";
import { PersonalRecordsError } from "@/lib/personal-records/personal-records-errors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const WALLET = "0x00000000000000000000000000000000000000b1";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: "profile-1", wallets: [{ wallet: WALLET }] },
    activeProfileProxy: null,
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: WALLET,
    canSignActiveWallet: true,
    isSafeWallet: false,
  }),
}));
jest.mock("@/hooks/useNftPurchasingVisibility", () => ({
  useNftPurchasingVisibility: () => ({ hideNftPurchasing: false }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/collect/CollectAssetReference", () => ({
  __esModule: true,
  default: () => <span>artwork</span>,
}));
const mockSetPaused = jest.fn();
jest.mock("@/services/api/collect-rules-api", () => ({
  setCollectRulePaused: (...args: unknown[]) => mockSetPaused(...args),
  prepareCollectRule: jest.fn(),
  reconcileCollectRule: jest.fn(),
}));
const mockOrders = jest.fn();
jest.mock("@/services/api/market-api", () => ({
  fetchMarketOrders: (...args: unknown[]) => mockOrders(...args),
  fetchMarketOperation: jest.fn(),
}));

const rule = {
  id: "d9ae3ffc-6cff-4a29-b997-7908c632c121",
  revision: 2,
  state: "ACTIVE",
  pause_reason: null,
  pending_review: null,
  acquired: [],
  action_count: 0,
  review_count: 0,
  spent_item_cost_wei: "0",
  spent_gas_cost_wei: "0",
  definition: {
    profile_id: "profile-1",
    funding_wallet: WALLET,
    recipient: WALLET,
    plan_id: null,
    analysis_id: null,
    targets: [
      {
        asset_key: "1:0x0000000000000000000000000000000000000abc:7",
        target_quantity: "1",
        maximum_unit_price_wei: "100",
      },
    ],
    max_total_cost_wei: "1000",
    max_gas_reserve_wei: "10",
    expires_at: 2_000_000_000_000,
    max_actions: 2,
  },
} as never;

it("shows the reason of the action that failed last", async () => {
  mockSetPaused.mockRejectedValue(
    new PersonalRecordsError(
      "Settings are paused for a few minutes. Try again shortly.",
      { reason: "paused" }
    )
  );
  const nonce =
    "The rule's last purchase was sent at nonce 5 and isn't mined. Reconcile it; if it was dropped, send a replacement at nonce 5 from the funding wallet, then reconcile.";
  mockOrders.mockRejectedValue({
    status: 409,
    response: {
      status: 409,
      headers: new Headers(),
      body: { error: nonce, code: "RULE_PENDING" },
    },
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CollectRuleCard
        rule={rule}
        onUpdated={jest.fn()}
        onOperation={jest.fn()}
      />
    </QueryClientProvider>
  );
  fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Settings are paused for a few minutes."
  );
  // A later prepare fails: its reason shows, not the pause's.
  fireEvent.click(
    screen.getByRole("button", { name: "Find purchase to review" })
  );
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "send a replacement at nonce 5"
    )
  );
});
