import NextGenMintBurnWidget from "@/components/nextGen/collections/collectionParts/mint/NextGenMintBurnWidget";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
} from "@/components/nextGen/nextgen_contracts";
import { Status } from "@/components/nextGen/nextgen_entities";
import { act, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";

jest.mock(
  "@/components/nextGen/collections/collectionParts/mint/NextGenMintShared",
  () => ({
    MINT_ACTION_BUTTON_CLASSNAME: "",
    MINT_SELECT_CLASSNAME: "",
    MintInfoTooltip: () => null,
    NextGenMintErrors: () => null,
    NextGenMintingFor: () => <div data-testid="minting-for" />,
  })
);

jest.mock("@/components/nextGen/NextGenContractWriteStatus", () => () => (
  <div data-testid="status" />
));

const mockFetchUrl = jest.fn();
jest.mock("@/services/6529api", () => ({
  fetchUrl: (...args: any[]) => mockFetchUrl(...args),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock("wagmi", () => ({
  useChainId: jest.fn(),
  useWriteContract: jest.fn(),
}));

jest.mock("@/components/nextGen/nextgen_helpers", () => ({
  useMintSharedState: jest.fn(),
  getStatusFromDates: jest.fn(),
}));

const { useChainId, useWriteContract } = require("wagmi");
const {
  useSeizeConnectContext,
} = require("@/components/auth/SeizeConnectContext");
const {
  useMintSharedState,
  getStatusFromDates,
} = require("@/components/nextGen/nextgen_helpers");

const originalFetch = global.fetch;
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

function createMintState(overrides: Partial<any> = {}) {
  return {
    burnProofResponse: undefined,
    setBurnProofResponse: jest.fn(),
    mintForAddress: "0xabc",
    setMintForAddress: jest.fn(),
    tokenId: "",
    setTokenId: jest.fn(),
    salt: 0,
    isMinting: false,
    setIsMinting: jest.fn(),
    fetchingProofs: false,
    setFetchingProofs: jest.fn(),
    errors: [],
    setErrors: jest.fn(),
    ...overrides,
  };
}

const baseProps = {
  collection: {
    allowlist_start: 0,
    allowlist_end: 0,
    public_start: 0,
    public_end: 0,
    max_purchases: 10,
  } as any,
  collection_merkle: {
    collection_id: 1,
    merkle_root: "root",
    burn_collection: NEXTGEN_CORE[NEXTGEN_CHAIN_ID],
    burn_collection_id: 1,
    min_token_index: 0,
    max_token_index: 0,
    status: true,
  } as any,
  available_supply: 5,
  mint_price: 0n,
  mint_counts: { airdrop: 0, allowlist: 0, public: 0, total: 0 },
  delegators: [],
  mintForAddress: jest.fn(),
  fetchingMintCounts: false,
  refreshMintCounts: jest.fn(),
};

function renderWidget(
  props: Partial<typeof baseProps> = {},
  state: any = {},
  context: any = {},
  chainId?: number
) {
  const mintState = createMintState(state);
  (useMintSharedState as jest.Mock).mockReturnValue(mintState);
  (useSeizeConnectContext as jest.Mock).mockReturnValue({
    isConnected: true,
    address: "0xabc",
    seizeConnect: jest.fn(),
    ...context,
  });
  (useChainId as jest.Mock).mockReturnValue(chainId ?? NEXTGEN_CHAIN_ID);
  (useWriteContract as jest.Mock).mockReturnValue({
    writeContract: jest.fn(),
    reset: jest.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
  });
  (getStatusFromDates as jest.Mock).mockReturnValue(Status.LIVE);
  return render(<NextGenMintBurnWidget {...baseProps} {...props} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockReset();
  global.fetch = mockFetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe("NextGenMintBurnWidget", () => {
  it("filters tokens by range and prefix", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ownedNfts: [
          { tokenId: "90" },
          { tokenId: "110", name: "A" },
          { tokenId: "115" },
          { tokenId: "201" },
        ],
      }),
    } as unknown as Response);

    renderWidget(
      {
        collection_merkle: {
          ...baseProps.collection_merkle,
          min_token_index: 100,
          max_token_index: 200,
          burn_collection_id: 1,
        },
      },
      { mintForAddress: "0xabc" }
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      expect(screen.getAllByRole("option").length).toBeGreaterThan(1);
    });
    const options = screen.getAllByRole("option");
    expect(options[1]).toHaveValue("110");
    expect(options[2]).toHaveValue("115");
  });

  it("shows connect wallet when not connected", () => {
    renderWidget({}, {}, { isConnected: false });
    expect(screen.getByRole("button")).toHaveTextContent("Connect Wallet");
  });

  it("prompts network switch when chain differs", () => {
    renderWidget({}, {}, {}, NEXTGEN_CHAIN_ID + 1);
    expect(screen.getByRole("button")).toHaveTextContent("Switch to");
  });

  it("shows processing state when minting", () => {
    const { container } = renderWidget({}, { isMinting: true });
    expect(screen.getByRole("button")).toHaveTextContent("Processing...");
    expect(container.querySelector("output")).toBeInTheDocument();
  });

  it("disables button when burn not active", () => {
    renderWidget({
      collection_merkle: { ...baseProps.collection_merkle, status: false },
    });
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent("Burn Not Active");
  });

  describe("burn proof loading", () => {
    const burnProof = (info: string) => ({
      keccak: `keccak-${info}`,
      info,
      proof: ["0xproof"],
    });

    function deferred<T>() {
      let resolve!: (value: T) => void;
      const promise = new Promise<T>((res) => {
        resolve = res;
      });
      return { promise, resolve };
    }

    beforeEach(() => {
      mockFetchUrl.mockReset();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ownedNfts: [] }),
      } as unknown as Response);
    });

    it("shows an accessible error instead of an endless fetch when the proof fails", async () => {
      mockFetchUrl.mockRejectedValue(new Error("HTTP error! status: 500"));
      const state = { tokenId: "7" };
      renderWidget({}, state);

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "The burn proof could not be loaded."
      );
      const mintState = (useMintSharedState as jest.Mock).mock.results[0]
        ?.value;
      await waitFor(() =>
        expect(mintState.setFetchingProofs).toHaveBeenLastCalledWith(false)
      );
    });

    it("never applies a late burn proof for a previously selected token", async () => {
      const first = deferred<unknown>();
      const second = deferred<unknown>();
      mockFetchUrl
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);

      const { rerender } = renderWidget({}, { tokenId: "7" });
      const firstState = (useMintSharedState as jest.Mock).mock.results[0]
        ?.value;
      const secondState = createMintState({ tokenId: "8" });
      (useMintSharedState as jest.Mock).mockReturnValue(secondState);
      rerender(<NextGenMintBurnWidget {...baseProps} />);

      const [[firstUrl, firstInit], [secondUrl]] = mockFetchUrl.mock.calls;
      expect(firstUrl).toContain("/burn_proofs/root/7");
      expect(firstInit.signal.aborted).toBe(true);
      expect(secondUrl).toContain("/burn_proofs/root/8");
      expect(firstState.setBurnProofResponse).toHaveBeenCalledWith(undefined);

      await act(async () => {
        second.resolve(burnProof("token-8"));
        await second.promise;
      });
      await act(async () => {
        first.resolve(burnProof("token-7"));
        await first.promise;
      });

      expect(secondState.setBurnProofResponse).toHaveBeenCalledWith(
        burnProof("token-8")
      );
      expect(firstState.setBurnProofResponse).not.toHaveBeenCalledWith(
        burnProof("token-7")
      );
      expect(secondState.setBurnProofResponse).not.toHaveBeenCalledWith(
        burnProof("token-7")
      );
    });

    it("drops the proof and the fetching state when the selected token is cleared", () => {
      mockFetchUrl.mockReturnValue(new Promise(() => {}));
      const { rerender } = renderWidget({}, { tokenId: "7" });
      const firstState = (useMintSharedState as jest.Mock).mock.results[0]
        ?.value;
      const clearedState = createMintState({ tokenId: "" });
      (useMintSharedState as jest.Mock).mockReturnValue(clearedState);
      rerender(<NextGenMintBurnWidget {...baseProps} />);

      expect(mockFetchUrl).toHaveBeenCalledTimes(1);
      expect(firstState.setBurnProofResponse).toHaveBeenCalledWith(undefined);
      expect(firstState.setFetchingProofs).toHaveBeenLastCalledWith(false);
      expect(clearedState.setBurnProofResponse).not.toHaveBeenCalled();
      expect(clearedState.setFetchingProofs).not.toHaveBeenCalled();
    });

    it("keeps the fetching state up and applies only the new proof when the token changes", async () => {
      const first = deferred<unknown>();
      const second = deferred<unknown>();
      mockFetchUrl
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);
      let selectToken: (tokenId: string) => void = () => {};
      let appliedProof: unknown;
      (useMintSharedState as jest.Mock).mockImplementation(() => {
        const [tokenId, setTokenId] = useState("");
        const [burnProofResponse, setBurnProofResponse] = useState<unknown>();
        const [fetchingProofs, setFetchingProofs] = useState(false);
        selectToken = setTokenId;
        appliedProof = burnProofResponse;
        return createMintState({
          tokenId,
          setTokenId,
          burnProofResponse,
          setBurnProofResponse,
          fetchingProofs,
          setFetchingProofs,
        });
      });
      (useSeizeConnectContext as jest.Mock).mockReturnValue({
        isConnected: true,
        address: "0xabc",
        seizeConnect: jest.fn(),
      });
      (useChainId as jest.Mock).mockReturnValue(NEXTGEN_CHAIN_ID);
      (useWriteContract as jest.Mock).mockReturnValue({
        writeContract: jest.fn(),
        reset: jest.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
      });
      (getStatusFromDates as jest.Mock).mockReturnValue(Status.LIVE);
      render(<NextGenMintBurnWidget {...baseProps} />);

      const button = screen.getByRole("button");
      expect(button).not.toHaveTextContent("fetching proofs");

      await act(async () => selectToken("7"));
      expect(button).toHaveTextContent("fetching proofs");

      await act(async () => selectToken("8"));
      expect(button).toHaveTextContent("fetching proofs");
      expect(mockFetchUrl.mock.calls[0][1].signal.aborted).toBe(true);

      await act(async () => {
        first.resolve(burnProof("token-7"));
        await first.promise;
      });
      expect(appliedProof).toBeUndefined();
      expect(button).toHaveTextContent("fetching proofs");

      await act(async () => {
        second.resolve(burnProof("token-8"));
        await second.promise;
      });
      expect(appliedProof).toEqual(burnProof("token-8"));
      expect(button).not.toHaveTextContent("fetching proofs");
    });

    it("mints with the exact wei price", () => {
      mockFetchUrl.mockReturnValue(new Promise(() => {}));
      renderWidget(
        { mint_price: 12345678901234567891n },
        { tokenId: "7", isMinting: true, burnProofResponse: burnProof("ok") }
      );
      const { writeContract } = (useWriteContract as jest.Mock).mock.results[0]
        ?.value;

      expect(writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "burnOrSwapExternalToMint",
          value: 12345678901234567891n,
        })
      );
    });
  });
});
