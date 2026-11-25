import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { WagmiContext } from "wagmi";
import { useChainWavesWriters } from "@/components/chain-waves/useChainWavesWriters";
import {
  writeChainPollBallot,
  writeChainVote,
  writeChainWaveRating,
} from "@/lib/chain-waves/writers";

const mockSetToast = jest.fn();
const WALLET = "0x00000000000000000000000000000000000000aa";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ activeProfileProxy: null, setToast: mockSetToast }),
}));
jest.mock("@/hooks/useWavesMovePhase", () => ({
  useChainWavesActive: () => true,
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("wagmi/actions", () => ({
  getAccount: () => ({ address: "0x00000000000000000000000000000000000000aa" }),
}));
jest.mock("@/lib/chain-waves/writers", () => ({
  writeChainVote: jest.fn(),
  writeChainPollBallot: jest.fn(),
  writeChainWaveRating: jest.fn(),
}));

const wrapper = ({ children }: { readonly children: ReactNode }) => (
  <WagmiContext.Provider value={{} as never}>{children}</WagmiContext.Provider>
);

const FEE_LINE =
  "This change's fee, at most 0.4125 $fake6529, is more than this browser's key signs on its own. Check your wallet.";

/** A writer whose session key's fee was above its cap. */
const aboveCap = async (
  _config: unknown,
  _wallet: unknown,
  input: { readonly onWalletFee?: (maxFee: bigint) => void }
) => {
  input.onWalletFee?.(412_500_000_000_000_000n);
};

beforeEach(() => jest.clearAllMocks());

it("says the fee before the wallet signs a vote, a ballot or wave REP in place of the key", async () => {
  (writeChainVote as jest.Mock).mockImplementation(aboveCap);
  (writeChainPollBallot as jest.Mock).mockImplementation(aboveCap);
  (writeChainWaveRating as jest.Mock).mockImplementation(aboveCap);
  const { result } = renderHook(() => useChainWavesWriters(), { wrapper });
  await result.current?.vote({ dropId: "d1", amount: 3 });
  await result.current?.pollBallot({ pollId: "p1", optionNumbers: [1] });
  await result.current?.waveRating({ waveId: "w1", category: "Art", amount: 2 });
  expect(mockSetToast).toHaveBeenCalledTimes(3);
  expect(mockSetToast).toHaveBeenCalledWith({
    message: FEE_LINE,
    type: "warning",
  });
  expect(writeChainVote).toHaveBeenCalledWith(
    {},
    WALLET,
    expect.objectContaining({ dropId: "d1", amount: 3n })
  );
});

it("says nothing extra when the key or the wallet signs as usual", async () => {
  (writeChainVote as jest.Mock).mockResolvedValue(undefined);
  const { result } = renderHook(() => useChainWavesWriters(), { wrapper });
  await result.current?.vote({ dropId: "d1", amount: 3 });
  expect(mockSetToast).not.toHaveBeenCalled();
});
