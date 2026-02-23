import { QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { MarketplacePreviewData } from "@/components/waves/marketplace/common";
import type { WsMediaLinkUpdatedData } from "@/helpers/Types";
import { WsMessageType } from "@/helpers/Types";
import { createTestQueryClient } from "../../utils/reactQuery";
import { MarketplacePreviewWebSocketSync } from "@/services/websocket/MarketplacePreviewWebSocketSync";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: jest.fn(),
}));

const mockedUseWebSocketMessage = useWebSocketMessage as jest.MockedFunction<
  typeof useWebSocketMessage
>;

const createMediaLinkUpdatedEvent = (
  overrides: Partial<WsMediaLinkUpdatedData> = {}
): WsMediaLinkUpdatedData => ({
  canonical_id: "MANIFOLD:claim:1",
  platform: "MANIFOLD",
  chain: null,
  contract: null,
  token: null,
  name: "Updated title",
  description: "Updated description",
  media_uri: "https://cdn.example.com/updated-image.jpg",
  last_error_message: null,
  price: "1.5",
  last_successfully_updated: "1771516351724",
  failed_since: null,
  ...overrides,
});

describe("MarketplacePreviewWebSocketSync", () => {
  let mediaLinkUpdatedCallback:
    | ((messageData: WsMediaLinkUpdatedData) => void)
    | undefined;

  beforeEach(() => {
    mediaLinkUpdatedCallback = undefined;
    jest.clearAllMocks();

    mockedUseWebSocketMessage.mockImplementation((messageType, callback) => {
      if (messageType === WsMessageType.MEDIA_LINK_UPDATED) {
        mediaLinkUpdatedCallback = callback as (
          messageData: WsMediaLinkUpdatedData
        ) => void;
      }
      return { isConnected: true };
    });
  });

  it("patches matching marketplace preview cache entries by canonical id", () => {
    const queryClient = createTestQueryClient();
    const matchingQueryKey = [
      QueryKey.MARKETPLACE_PREVIEW,
      { href: "https://example.com/1", mode: "default" },
    ];
    const nonMatchingQueryKey = [
      QueryKey.MARKETPLACE_PREVIEW,
      { href: "https://example.com/2", mode: "default" },
    ];

    queryClient.setQueryData<MarketplacePreviewData>(matchingQueryKey, {
      href: "https://example.com/1",
      canonicalId: "manifold:claim:1",
      platform: "MANIFOLD",
      title: "Old title",
      description: "Old description",
      media: {
        url: "https://cdn.example.com/old-image.jpg",
        mimeType: "image/jpeg",
      },
      price: "1.0",
    });
    queryClient.setQueryData<MarketplacePreviewData>(nonMatchingQueryKey, {
      href: "https://example.com/2",
      canonicalId: "manifold:claim:999",
      platform: "MANIFOLD",
      title: "Other title",
      description: "Other description",
      media: {
        url: "https://cdn.example.com/other-image.jpg",
        mimeType: "image/jpeg",
      },
      price: "3.0",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MarketplacePreviewWebSocketSync />
      </QueryClientProvider>
    );

    expect(mediaLinkUpdatedCallback).toBeDefined();

    act(() => {
      mediaLinkUpdatedCallback?.(createMediaLinkUpdatedEvent());
    });

    expect(
      queryClient.getQueryData<MarketplacePreviewData>(matchingQueryKey)
    ).toEqual({
      href: "https://example.com/1",
      canonicalId: "MANIFOLD:claim:1",
      platform: "MANIFOLD",
      title: "Updated title",
      description: "Updated description",
      media: {
        url: "https://cdn.example.com/updated-image.jpg",
        mimeType: "image/jpeg",
      },
      price: "1.5",
    });

    expect(
      queryClient.getQueryData<MarketplacePreviewData>(nonMatchingQueryKey)
    ).toEqual({
      href: "https://example.com/2",
      canonicalId: "manifold:claim:999",
      platform: "MANIFOLD",
      title: "Other title",
      description: "Other description",
      media: {
        url: "https://cdn.example.com/other-image.jpg",
        mimeType: "image/jpeg",
      },
      price: "3.0",
    });
  });

  it("ignores updates when no canonical id matches cached data", () => {
    const queryClient = createTestQueryClient();
    const queryKey = [
      QueryKey.MARKETPLACE_PREVIEW,
      { href: "https://example.com/1", mode: "default" },
    ];

    queryClient.setQueryData<MarketplacePreviewData>(queryKey, {
      href: "https://example.com/1",
      canonicalId: "manifold:claim:777",
      platform: "MANIFOLD",
      title: "Title",
      description: "Description",
      media: {
        url: "https://cdn.example.com/image.jpg",
        mimeType: "image/jpeg",
      },
      price: "2.0",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MarketplacePreviewWebSocketSync />
      </QueryClientProvider>
    );

    const before = queryClient.getQueryData<MarketplacePreviewData>(queryKey);

    act(() => {
      mediaLinkUpdatedCallback?.(
        createMediaLinkUpdatedEvent({
          canonical_id: "MANIFOLD:claim:888",
        })
      );
    });

    const after = queryClient.getQueryData<MarketplacePreviewData>(queryKey);
    expect(after).toBe(before);
  });
});
