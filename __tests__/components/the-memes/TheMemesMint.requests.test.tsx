import TheMemesMint from "@/components/the-memes/TheMemesMint";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { commonApiFetch } from "@/services/api/common-api";
import { act, render, screen, waitFor } from "@testing-library/react";

let mockShowCountdown = false;
const mockSetTitle = jest.fn();
const mockReadData = [
  574n,
  {
    startDate: 1794590400n,
    endDate: 1794668400n,
    total: 161n,
    totalMax: 328n,
    tokenId: 574n,
    cost: 65290000000000000n,
    merkleRoot: `0x${"0".repeat(64)}`,
  },
];

jest.mock("wagmi", () => ({
  useReadContract: () => ({
    data: mockReadData,
    error: null,
    isFetching: false,
    refetch: jest.fn(),
  }),
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/components/common/NftPurchasingGate", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: React.ReactNode }) => children,
}));
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({ setTitle: mockSetTitle }),
}));
jest.mock("@/components/drop-forge/drop-forge-config", () => ({
  useDropForgeMintingConfig: () => ({
    contract: MEMES_CONTRACT,
    chain: { id: 1 },
  }),
}));
jest.mock("next/dynamic", () => () => {
  const { useManifoldClaim } = jest.requireActual("@/hooks/useManifoldClaim");
  function Reader({ name }: { readonly name: string }) {
    const { claim } = useManifoldClaim({
      chainId: 1,
      contract: MEMES_CONTRACT,
      proxy: "0x26bbea7803dcac346d5f5f135b57cf2c752a02be",
      abi: [],
      identifier: 574,
    });
    return (
      <output data-testid={name}>
        {claim && `${claim.identifier}:${claim.total}/${claim.totalMax}`}
      </output>
    );
  }
  return function MintingWithLateCountdown() {
    return (
      <>
        <Reader name="mint-details" />
        {mockShowCountdown && <Reader name="mint-countdown" />}
      </>
    );
  };
});

const fetchRoots = jest.mocked(commonApiFetch);
const nft = {
  id: 574,
  name: "BORN TO BE FREE",
  metadata: {},
  mint_date: null,
} as unknown as ApiMemesExtendedData;

beforeEach(() => {
  mockShowCountdown = false;
  mockSetTitle.mockClear();
  fetchRoots.mockReset();
  fetchRoots.mockResolvedValue([]);
});

it.each([false, true])(
  "shares completed roots with a later countdown (standalone=%s)",
  async (standalone) => {
    const { rerender } = render(
      <TheMemesMint nft={nft} standalone={standalone} />
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchRoots).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("mint-details")).toHaveTextContent("574:161/328");

    mockShowCountdown = true;
    rerender(<TheMemesMint nft={nft} standalone={standalone} />);
    await waitFor(() =>
      expect(screen.getByTestId("mint-countdown")).toHaveTextContent(
        "574:161/328"
      )
    );
    expect(fetchRoots).toHaveBeenCalledTimes(1);
  }
);

it("fetches fresh roots when the mint page is revisited", async () => {
  const first = render(<TheMemesMint nft={nft} />);
  await act(async () => {
    await Promise.resolve();
  });
  first.unmount();

  render(<TheMemesMint nft={nft} />);
  await act(async () => {
    await Promise.resolve();
  });
  expect(fetchRoots).toHaveBeenCalledTimes(2);
  expect(screen.getByTestId("mint-details")).toHaveTextContent("574:161/328");
});

it("lets the later countdown retry roots after the initial failure", async () => {
  fetchRoots.mockRejectedValueOnce(new Error("roots unavailable"));
  const { rerender } = render(<TheMemesMint nft={nft} />);
  await act(async () => {
    await Promise.resolve();
  });

  mockShowCountdown = true;
  rerender(<TheMemesMint nft={nft} />);
  await act(async () => {
    await Promise.resolve();
  });
  expect(fetchRoots).toHaveBeenCalledTimes(2);
  expect(screen.getByTestId("mint-details")).toHaveTextContent("574:161/328");
  expect(screen.getByTestId("mint-countdown")).toHaveTextContent("574:161/328");
});
