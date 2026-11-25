import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { WagmiContext } from "wagmi";
import { useChainRatingWriter } from "@/components/chain-identity/useChainRatingWriter";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { writeChainRating } from "@/lib/chain-identity/ratings";

const mockSetToast = jest.fn();

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: mockSetToast }),
}));
jest.mock("@/hooks/useIdentityMovePhase", () => ({
  useChainIdentityActive: () => true,
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("wagmi/actions", () => ({
  getAccount: () => ({ address: "0x00000000000000000000000000000000000000aa" }),
}));
jest.mock("@/lib/chain-identity/ratings", () => ({
  writeChainRating: jest.fn(),
}));

const wrapper = ({ children }: { readonly children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    <WagmiContext.Provider value={{} as never}>{children}</WagmiContext.Provider>
  </QueryClientProvider>
);

const profile = { handle: "rated_one", wallets: [] } as unknown as ApiIdentity;

beforeEach(() => jest.clearAllMocks());

it("says the fee before the wallet signs in place of this browser's key", async () => {
  (writeChainRating as jest.Mock).mockImplementation(
    async (
      _config: unknown,
      _wallet: unknown,
      input: { readonly onWalletFee?: (maxFee: bigint) => void }
    ) => {
      input.onWalletFee?.(412_500_000_000_000_000n);
    }
  );
  const { result } = renderHook(() => useChainRatingWriter(), { wrapper });
  await result.current?.({
    matter: "REP",
    profile,
    category: "Art",
    amount: 5,
  });
  expect(mockSetToast).toHaveBeenCalledWith({
    message:
      "This rating's fee, at most 0.4125 $fake6529, is more than this browser's key signs on its own. Check your wallet.",
    type: "warning",
  });
});

it("says nothing extra when the key or the wallet signs as usual", async () => {
  (writeChainRating as jest.Mock).mockResolvedValue(undefined);
  const { result } = renderHook(() => useChainRatingWriter(), { wrapper });
  await result.current?.({
    matter: "NIC",
    profile,
    category: null,
    amount: -2,
  });
  expect(writeChainRating).toHaveBeenCalledWith(
    {},
    "0x00000000000000000000000000000000000000aa",
    expect.objectContaining({ matter: "NIC", value: -2n, category: null })
  );
  expect(mockSetToast).not.toHaveBeenCalled();
});
