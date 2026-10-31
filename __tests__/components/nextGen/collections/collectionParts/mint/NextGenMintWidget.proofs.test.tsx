import NextGenMintWidget from "@/components/nextGen/collections/collectionParts/mint/NextGenMintWidget";
import { Status } from "@/components/nextGen/nextgen_entities";
import { act, render, screen, waitFor } from "@testing-library/react";

const mockSetProofResponse = jest.fn();
const mockWriteContract = jest.fn();
const mockFetchUrl = jest.fn();
const mockState = {
  mintForAddress: "0xA",
  isMinting: false,
  mintCount: 1,
};

jest.mock("@/components/nextGen/nextgen_helpers", () => ({
  useMintSharedState: () => ({
    proofResponse: [],
    setProofResponse: mockSetProofResponse,
    mintForAddress: mockState.mintForAddress,
    setMintForAddress: jest.fn(),
    salt: 0,
    mintCount: mockState.mintCount,
    setMintCount: jest.fn(),
    mintToInput: "",
    setMintToInput: jest.fn(),
    mintToAddress: "",
    setMintToAddress: jest.fn(),
    isMinting: mockState.isMinting,
    setIsMinting: jest.fn(),
    errors: [],
    setErrors: jest.fn(),
  }),
  // Allowlist phase is live, public phase has not started.
  getStatusFromDates: (start: number) =>
    start === 100 ? Status.LIVE : Status.UPCOMING,
}));

jest.mock("@/services/6529api", () => ({
  fetchUrl: (...args: unknown[]) => mockFetchUrl(...args),
}));
jest.mock("@/components/nextGen/NextGenContractWriteStatus", () => () => (
  <div />
));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    isConnected: true,
    address: "0x1",
    seizeConnect: jest.fn(),
  }),
}));
jest.mock("wagmi", () => ({
  useChainId: () => 1,
  useEnsAddress: () => ({ data: undefined }),
  useEnsName: () => ({ data: undefined }),
  useWriteContract: () => ({
    writeContract: mockWriteContract,
    isSuccess: false,
    isError: false,
    isPending: false,
    reset: jest.fn(),
    data: undefined,
    error: undefined,
  }),
}));
jest.mock("@/components/dotLoader/DotLoader", () => () => <div />);
jest.mock(
  "@/components/nextGen/collections/collectionParts/mint/NextGenMintShared",
  () => ({
    MINT_ACTION_BUTTON_CLASSNAME: "",
    MINT_INPUT_CLASSNAME: "",
    MINT_SELECT_CLASSNAME: "",
    MintInfoTooltip: () => null,
    NextGenMintErrors: () => null,
    NextGenMintingFor: () => <div />,
  })
);
jest.mock("@/components/nextGen/nextgen_contracts", () => ({
  NEXTGEN_CHAIN_ID: 1,
  NEXTGEN_MINTER: { 1: "0x0", abi: [] },
}));

const collection = {
  id: 1,
  allowlist_start: 100,
  allowlist_end: 200,
  public_start: 300,
  public_end: 400,
  merkle_root: "root",
  max_purchases: 1,
} as any;

const baseProps = {
  collection,
  available_supply: 10,
  mint_price: BigInt(1),
  mint_counts: { allowlist: 0, public: 0, airdrop: 0, total: 0 },
  delegators: [],
  mintForAddress: jest.fn(),
  fetchingMintCounts: false,
  refreshMintCounts: jest.fn(),
};

const proof = (keccak: string) => ({
  keccak,
  spots: 1,
  info: "{}",
  proof: ["0xproof"],
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const appliedProofs = () =>
  mockSetProofResponse.mock.calls
    .map(([value]) => value as Array<{ keccak: string }>)
    .filter((value) => value.length > 0);

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchUrl.mockReset();
  mockState.mintForAddress = "0xA";
  mockState.isMinting = false;
  mockState.mintCount = 1;
});

describe("NextGenMintWidget allowlist proofs", () => {
  it("never applies a late proof response for a previous address", async () => {
    const first = deferred<unknown[]>();
    const second = deferred<unknown[]>();
    mockFetchUrl
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { rerender } = render(<NextGenMintWidget {...baseProps} />);
    mockState.mintForAddress = "0xB";
    rerender(<NextGenMintWidget {...baseProps} />);

    const [[firstUrl, firstInit], [secondUrl]] = mockFetchUrl.mock.calls;
    expect(firstUrl).toContain("/api/nextgen/proofs/root/0xA");
    expect(firstInit.signal.aborted).toBe(true);
    expect(secondUrl).toContain("/api/nextgen/proofs/root/0xB");

    await act(async () => {
      second.resolve([proof("proof-b")]);
      await second.promise;
    });
    await act(async () => {
      first.resolve([proof("proof-a")]);
      await first.promise;
    });

    expect(appliedProofs()).toEqual([
      [expect.objectContaining({ keccak: "proof-b" })],
    ]);
  });

  it("drops proofs held for the previous address while the new ones load", async () => {
    mockFetchUrl.mockResolvedValueOnce([proof("proof-a")]);
    const { rerender } = render(<NextGenMintWidget {...baseProps} />);
    await act(async () => {});
    expect(appliedProofs()).toHaveLength(1);

    mockSetProofResponse.mockClear();
    mockFetchUrl.mockReturnValueOnce(new Promise(() => {}));
    mockState.mintForAddress = "0xB";
    rerender(<NextGenMintWidget {...baseProps} />);

    expect(mockSetProofResponse).toHaveBeenCalledWith([]);
    expect(appliedProofs()).toHaveLength(0);
  });

  it("aborts the proof request on unmount", () => {
    mockFetchUrl.mockReturnValue(new Promise(() => {}));
    const { unmount } = render(<NextGenMintWidget {...baseProps} />);
    const [, init] = mockFetchUrl.mock.calls[0];

    expect(init.signal.aborted).toBe(false);
    unmount();
    expect(init.signal.aborted).toBe(true);
  });

  it("shows an accessible error instead of an endless loader when proofs fail", async () => {
    mockFetchUrl.mockRejectedValue(new Error("HTTP error! status: 500"));
    render(<NextGenMintWidget {...baseProps} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Allowlist proofs could not be loaded."
    );
    expect(screen.queryByLabelText("Loading allowlist proofs")).toBeNull();
  });

  it("clears the error and reloads when the mint-for address changes", async () => {
    mockFetchUrl
      .mockRejectedValueOnce(new Error("HTTP error! status: 500"))
      .mockResolvedValueOnce([proof("proof-b")]);
    const { rerender } = render(<NextGenMintWidget {...baseProps} />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    mockState.mintForAddress = "0xB";
    rerender(<NextGenMintWidget {...baseProps} />);

    await waitFor(() =>
      expect(appliedProofs()).toEqual([
        [expect.objectContaining({ keccak: "proof-b" })],
      ])
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("NextGenMintWidget mint value", () => {
  const mintWith = (mintCount: number, price: bigint) => {
    mockState.isMinting = true;
    mockState.mintCount = mintCount;
    render(
      <NextGenMintWidget
        {...baseProps}
        collection={{ ...collection, allowlist_end: 0 }}
        mint_price={price}
      />
    );
  };

  it("multiplies the wei price by the count without precision loss", () => {
    mintWith(3, 12345678901234567891n);

    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "mint",
        value: 37037036703703703673n,
      })
    );
    // Number math rounds both of these to a different wei amount.
    expect(37037036703703703673n).not.toBe(
      BigInt(Number(12345678901234567891n) * 3)
    );
  });

  it("sends the exact price for a single mint", () => {
    mintWith(1, 10000000000000001n);

    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({ value: 10000000000000001n })
    );
  });

  it.each([
    [0, 5n],
    [2, 0n],
    [-1, 5n],
    [Number.NaN, 5n],
  ])("sends no value for count %p at price %p", (count, price) => {
    mintWith(count, price);

    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({ value: 0n })
    );
  });
});
