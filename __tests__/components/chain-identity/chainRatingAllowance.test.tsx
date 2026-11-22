import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Hex } from "viem";
import { SeizeConnectContext } from "@/components/auth/seizeConnectContextValue";
import type { SeizeConnectContextType } from "@/components/auth/seizeConnectTypes";
import { useNicRatingState } from "@/components/user/identity/header/cic-rate/useNicRatingState";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useRepAllocation } from "@/hooks/useRepAllocation";
import { readRatingAllowance } from "@/lib/chain-identity/ratings";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/hooks/useIdentityMovePhase", () => ({
  useChainIdentityActive: () => true,
}));
jest.mock("@/lib/chain-identity/ratings", () => ({
  readRatingAllowance: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

const WALLET = "0x00000000000000000000000000000000000000aa";
const allowance = (available: bigint | null, current: bigint) => ({
  rater: `0x${"0a".repeat(32)}` as Hex,
  target: `0x${"0b".repeat(32)}` as Hex,
  cap: available === null ? null : 1000n,
  spent: 900n,
  available,
  current,
  version: 7,
});

function wrapper({ children }: { readonly children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <SeizeConnectContext.Provider
        value={{ address: WALLET } as unknown as SeizeConnectContextType}
      >
        {children}
      </SeizeConnectContext.Provider>
    </QueryClientProvider>
  );
}

beforeEach(() => jest.resetAllMocks());

it("gives the REP forms the chain's figures: the TDH left and this category's rating", async () => {
  jest.mocked(commonApiFetch).mockResolvedValue({
    rep_rates_left_for_rater: 5,
    rating_stats: [{ category: "Artist", rater_contribution: 1 }],
  });
  jest.mocked(readRatingAllowance).mockResolvedValue(allowance(100n, 50n));
  const profile = { handle: "rated_one", query: "rated_one" } as ApiIdentity;
  const { result } = renderHook(
    () => useRepAllocation({ profile, category: "Artist" }),
    { wrapper }
  );
  await waitFor(() => expect(result.current.heroAvailableRep).toBe(100));
  expect(result.current.repState?.rater_contribution).toBe(50);
  expect(result.current.minMaxValues).toEqual({ min: -150, max: 150 });
  expect(readRatingAllowance).toHaveBeenCalledWith(
    WALLET,
    {
      matter: "REP",
      target: { handle: "rated_one", wallets: [] },
      category: "Artist",
    },
    expect.any(AbortSignal)
  );
});

it("gives the NIC form the chain's figures, and 6529.io's only while the chain can't say", async () => {
  jest.mocked(readRatingAllowance).mockResolvedValue(allowance(300n, -20n));
  const { result } = renderHook(() => useNicRatingState("rated_one"), {
    wrapper,
  });
  await waitFor(() =>
    expect(result.current.data).toEqual({
      cic_rating_by_rater: -20,
      cic_ratings_left_to_give_by_rater: 300,
    })
  );
  expect(commonApiFetch).not.toHaveBeenCalled();

  jest.mocked(readRatingAllowance).mockResolvedValue(allowance(null, -20n));
  jest.mocked(commonApiFetch).mockResolvedValue({
    cic_rating_by_rater: -20,
    cic_ratings_left_to_give_by_rater: 42,
  });
  const second = renderHook(() => useNicRatingState("rated_two"), { wrapper });
  await waitFor(() =>
    expect(second.result.current.data?.cic_ratings_left_to_give_by_rater).toBe(
      42
    )
  );
  expect(commonApiFetch).toHaveBeenCalledWith({
    endpoint: `profiles/rated_two/cic/rating/${WALLET}`,
    signal: expect.any(AbortSignal),
  });
});
