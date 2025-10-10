import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageXtdhReceived from "@/components/xtdh/user/received";

const mockUseReceivedCollections = jest.fn();
const mockUseReceivedNfts = jest.fn();
const mockUseSearchParams = jest.fn();
const mockPush = jest.fn();

jest.mock("@/hooks/useXtdhReceived", () => ({
  useReceivedCollections: (...args: unknown[]) => mockUseReceivedCollections(...args),
  useReceivedNfts: (...args: unknown[]) => mockUseReceivedNfts(...args),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/profiles/simo/xtdh",
}));

describe("UserPageXtdhReceived", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const baseToken = {
      tokenId: "memes-1",
      tokenName: "Token One",
      tokenImage: "https://example.com/token-1.png",
      xtdhRate: 50,
      totalXtdhReceived: 1000,
      granters: [
        {
          profileId: "alice",
          displayName: "Alice",
          profileImage: "https://example.com/alice.png",
          xtdhRateGranted: 50,
        },
      ],
    };

    mockUseReceivedCollections.mockReturnValue({
      data: {
        collections: [
          {
            collectionId: "memes",
            collectionName: "The Memes of Production",
            collectionImage: "https://example.com/memes.png",
            tokenCount: 1,
            totalXtdhRate: 50,
            totalXtdhReceived: 1000,
            granters: baseToken.granters,
            tokens: [baseToken],
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 20,
        availableCollections: [
          {
            collectionId: "memes",
            collectionName: "The Memes of Production",
            tokenCount: 1,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: undefined,
      refetch: jest.fn(),
    });

    mockUseReceivedNfts.mockReturnValue({
      data: {
        nfts: [
          {
            ...baseToken,
            collectionId: "memes",
            collectionName: "The Memes of Production",
            collectionImage: "https://example.com/memes.png",
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 20,
        availableCollections: [
          {
            collectionId: "memes",
            collectionName: "The Memes of Production",
            tokenCount: 1,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: undefined,
      refetch: jest.fn(),
    });

    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockPush.mockReset();
  });

  it("requests collections data with default parameters", () => {
    render(<UserPageXtdhReceived profileId="simo" />);

    expect(mockUseReceivedCollections).toHaveBeenCalled();
    const args = mockUseReceivedCollections.mock.calls[0]?.[0];
    expect(args).toMatchObject({
      profile: "simo",
      sort: "total_rate",
      dir: "desc",
      page: 1,
    });
    expect(args.filters).toEqual({ collections: [], minRate: undefined, minGrantors: undefined });
  });

  it("enables the NFTs query only after switching the view", async () => {
    const user = userEvent.setup();
    render(<UserPageXtdhReceived profileId="simo" />);

    const initialCalls = mockUseReceivedNfts.mock.calls.length;
    expect(initialCalls).toBeGreaterThan(0);
    for (let index = 0; index < initialCalls; index += 1) {
      expect(mockUseReceivedNfts.mock.calls[index]?.[0]).toMatchObject({
        enabled: false,
      });
    }

    await user.click(screen.getByRole("button", { name: /NFTs view/i }));

    expect(mockUseReceivedNfts.mock.calls.length).toBeGreaterThan(initialCalls);
    const latestCall =
      mockUseReceivedNfts.mock.calls[mockUseReceivedNfts.mock.calls.length - 1];
    expect(latestCall?.[0]).toMatchObject({
      enabled: true,
    });
  });

  it("shows the clear filters control when a collection filter is active", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("collection=memes"));

    render(<UserPageXtdhReceived profileId="simo" />);

    expect(
      screen.getByRole("button", { name: /Remove The Memes of Production/i })
    ).toBeInTheDocument();
    const clearButton = screen.getByRole("button", { name: /Clear filters/i });
    expect(clearButton).toBeInTheDocument();

    clearButton.click();
    expect(mockPush).toHaveBeenCalled();
  });
});
