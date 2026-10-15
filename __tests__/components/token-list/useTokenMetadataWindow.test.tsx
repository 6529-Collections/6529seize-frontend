import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { createTestQueryClient } from "@/__tests__/utils/reactQuery";
import { useTokenMetadataWindow } from "@/components/token-list/hooks/useTokenMetadataWindow";
import { fetchTokenUriMetadata } from "@/services/alchemy/token-uri";
import type { TokenMetadata } from "@/types/nft";

const tokenUri =
  "https://arweave.net/fLAMSnWmzM9tAso6xMRSSPC2ZYaRoqjRnqGKaxk7vRQ";
const image = "https://arweave.net/9zgKqfEqo7u1LbMKy34OTts6oUMatjH8HMNX97Lk-Rs";
let mockTokens: TokenMetadata[] = [];
jest.mock("@/hooks/useAlchemyNftQueries", () => ({
  useTokenMetadataQuery: () => ({
    data: mockTokens,
    isFetching: false,
    isError: false,
  }),
}));
jest.mock("@/services/alchemy/token-uri", () => ({
  ...jest.requireActual("@/services/alchemy/token-uri"),
  fetchTokenUriMetadata: jest.fn(),
}));

function renderWindow() {
  const client = createTestQueryClient();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(
    () =>
      useTokenMetadataWindow({
        contractAddress: "0xe5b281fa9117e8dA3d0502c2C4bB2831e391b471",
        chain: "ethereum",
        windowTokens: mockTokens.map((entry) => ({
          tokenId: entry.tokenId,
          decimalId: entry.tokenId.toString(),
          xtdh: 1,
        })),
      }),
    { wrapper }
  );
}

describe("token window metadata recovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTokens = [
      {
        tokenId: 1n,
        tokenIdRaw: "0x01",
        tokenUri,
        name: "#1",
        imageUrl: null,
        collectionName: "Errormendments",
        isSpam: false,
      },
      {
        tokenId: 4n,
        tokenIdRaw: "4",
        tokenUri,
        name: "Working artwork",
        imageUrl: image,
        collectionName: "Errormendments",
        isSpam: false,
      },
    ];
  });

  it("keeps working artwork visible while recovering a missing image and placeholder name", async () => {
    jest
      .mocked(fetchTokenUriMetadata)
      .mockResolvedValue({ name: "1. Deploy", imageUrl: image });
    const { result } = renderWindow();
    expect(result.current.metadataMap.get("4")?.imageUrl).toBe(image);
    await waitFor(() =>
      expect(result.current.metadataMap.get("1")).toMatchObject({
        name: "1. Deploy",
        imageUrl: image,
      })
    );
    expect(result.current.metadataMap.get("0x01")).toBe(
      result.current.metadataMap.get("1")
    );
    expect(fetchTokenUriMetadata).toHaveBeenCalledTimes(1);
  });

  it("keeps existing metadata when original metadata cannot load", async () => {
    jest
      .mocked(fetchTokenUriMetadata)
      .mockRejectedValue(new Error("Unavailable"));
    const { result } = renderWindow();
    await waitFor(() => expect(fetchTokenUriMetadata).toHaveBeenCalledTimes(1));
    expect(result.current.metadataMap.get("1")).toMatchObject({
      name: "#1",
      imageUrl: null,
    });
    expect(result.current.metadataMap.get("4")?.imageUrl).toBe(image);
  });

  it("preserves a meaningful provider name when recovering artwork", async () => {
    mockTokens[0] = { ...mockTokens[0]!, name: "Existing title" };
    jest
      .mocked(fetchTokenUriMetadata)
      .mockResolvedValue({ name: "Original title", imageUrl: image });
    const { result } = renderWindow();
    await waitFor(() =>
      expect(result.current.metadataMap.get("1")?.imageUrl).toBe(image)
    );
    expect(result.current.metadataMap.get("1")?.name).toBe("Existing title");
  });
});
