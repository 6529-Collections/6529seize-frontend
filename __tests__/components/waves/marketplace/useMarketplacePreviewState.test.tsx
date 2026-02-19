import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";

import { useMarketplacePreviewState } from "@/components/waves/marketplace/useMarketplacePreviewState";
import { fetchLinkPreview } from "@/services/api/link-preview-api";
import { fetchNftLink } from "@/services/api/nft-link-api";
import { createTestQueryClient } from "../../../utils/reactQuery";

jest.mock("@/services/api/link-preview-api", () => ({
  fetchLinkPreview: jest.fn(),
}));

jest.mock("@/services/api/nft-link-api", () => ({
  fetchNftLink: jest.fn(),
}));

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useMarketplacePreviewState", () => {
  const mockedFetchLinkPreview = fetchLinkPreview as jest.MockedFunction<
    typeof fetchLinkPreview
  >;
  const mockedFetchNftLink = fetchNftLink as jest.MockedFunction<
    typeof fetchNftLink
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetchNftLink.mockResolvedValue({
      is_enrichable: true,
      validation_error: null,
      data: null,
    });
  });

  it("returns success from nft-link media and skips open-graph fallback", async () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";
    mockedFetchNftLink.mockResolvedValue({
      is_enrichable: true,
      validation_error: null,
      data: {
        canonical_id: "manifold:123",
        platform: "manifold",
        chain: "ethereum",
        contract: "0x123",
        token: "1",
        media_uri: "https://cdn.example.com/nft-image.png",
        last_error_message: null,
        price: "1.25 ETH",
        last_successfully_updated: 1735689600,
        failed_since: null,
      },
    });

    const { result } = renderHook(() => useMarketplacePreviewState({ href }), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(result.current).toEqual(
        expect.objectContaining({
          type: "success",
          href,
          resolvedPrice: "1.25 ETH",
          resolvedMedia: {
            url: "https://cdn.example.com/nft-image.png",
            mimeType: "image/png",
          },
        })
      )
    );
    expect(mockedFetchLinkPreview).not.toHaveBeenCalled();
  });

  it("falls back to link preview media when nft-link has no media", async () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";
    mockedFetchLinkPreview.mockResolvedValue({
      type: "manifold.listing",
      image: {
        url: "https://arweave.net/test-image.webp",
        type: "image/webp",
      },
      manifold: {
        listingId: "123",
      },
    });

    const { result } = renderHook(() => useMarketplacePreviewState({ href }), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(result.current).toEqual(
        expect.objectContaining({
          type: "success",
          href,
          resolvedMedia: {
            url: "https://arweave.net/test-image.webp",
            mimeType: "image/webp",
          },
        })
      )
    );
    expect(mockedFetchLinkPreview).toHaveBeenCalledWith(href);
  });

  it("sanitizes OpenSea overlay media in opensea-sanitized mode", async () => {
    const href =
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/31136811317196283853097434082447684930607990400663529852029007509349076041729";
    mockedFetchLinkPreview.mockResolvedValue({
      image: {
        url: "https://opensea.io/item/test/opengraph-image?ts=1",
        type: "image/png",
      },
      images: [
        {
          url: "https://opensea.io/item/test/opengraph-image?ts=1",
          type: "image/png",
        },
        {
          url: "https://i.seadn.io/s/raw/files/radar-dome.png",
          type: "image/png",
        },
      ],
    });

    const { result } = renderHook(
      () => useMarketplacePreviewState({ href, mode: "opensea-sanitized" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current).toEqual(
        expect.objectContaining({
          type: "success",
          href,
          resolvedMedia: {
            url: "https://i.seadn.io/s/raw/files/radar-dome.png",
            mimeType: "image/png",
          },
        })
      )
    );
  });

  it("returns error when both sources provide no media", async () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";
    mockedFetchLinkPreview.mockResolvedValue({
      type: "manifold.listing",
      title: "No media",
      manifold: {
        listingId: "123",
      },
    });

    const { result } = renderHook(() => useMarketplacePreviewState({ href }), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(result.current).toEqual(
        expect.objectContaining({
          type: "error",
          href,
          error: expect.objectContaining({
            message: "Failed to load marketplace preview",
          }),
        })
      )
    );
  });

  it("returns validation error and skips requests for blank href", () => {
    const { result } = renderHook(
      () => useMarketplacePreviewState({ href: "   " }),
      { wrapper: createWrapper() }
    );

    expect(result.current).toEqual(
      expect.objectContaining({
        type: "error",
        href: "   ",
        error: expect.objectContaining({
          message: "A valid URL is required to fetch link preview metadata.",
        }),
      })
    );
    expect(mockedFetchNftLink).not.toHaveBeenCalled();
    expect(mockedFetchLinkPreview).not.toHaveBeenCalled();
  });
});
