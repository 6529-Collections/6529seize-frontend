import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import LinkPreviewCard from "../../../components/waves/LinkPreviewCard";

const mockOpenGraphPreview = jest.fn(({ href, preview }: any) => (
  <div data-testid="open-graph" data-href={href} data-preview={preview ? "ready" : "loading"} />
));

const mockNostrCard = jest.fn(({ href, data }: any) => (
  <div data-testid="nostr-card" data-href={href} data-type={data?.type ?? ""} />
));

jest.mock("../../../components/waves/OpenGraphPreview", () => {
  const actual = jest.requireActual("../../../components/waves/OpenGraphPreview");
  return {
    __esModule: true,
    ...actual,
    default: (props: any) => mockOpenGraphPreview(props),
  };
});

jest.mock("../../../components/waves/nostr/NostrCard", () => ({
  __esModule: true,
  default: (props: any) => mockNostrCard(props),
}));

jest.mock("../../../services/api/link-preview-api", () => ({
  fetchLinkPreview: jest.fn(),
}));

describe("LinkPreviewCard", () => {
  const { fetchLinkPreview } = require("../../../services/api/link-preview-api");

  beforeEach(() => {
    jest.clearAllMocks();
    mockNostrCard.mockClear();
  });

  it("renders preview when metadata is available", async () => {
    fetchLinkPreview.mockResolvedValue({
      title: "Example Title",
      description: "Example description",
      image: { secureUrl: "https://cdn.example.com/img.png" },
    });

    render(
      <LinkPreviewCard
        href="https://example.com/article"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    expect(mockOpenGraphPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://example.com/article",
        preview: undefined,
      })
    );

    await waitFor(() =>
      expect(mockOpenGraphPreview).toHaveBeenLastCalledWith(
        expect.objectContaining({
          href: "https://example.com/article",
          preview: expect.objectContaining({ title: "Example Title" }),
        })
      )
    );

    expect(fetchLinkPreview).toHaveBeenCalledWith("https://example.com/article");
    expect(screen.queryByTestId("fallback")).toBeNull();
  });

  it("uses fallback when preview has no useful content", async () => {
    fetchLinkPreview.mockResolvedValue({});

    render(
      <LinkPreviewCard
        href="https://example.com/article"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("fallback")).toBeInTheDocument();
    });
  });

  it("uses fallback when request fails", async () => {
    fetchLinkPreview.mockRejectedValue(new Error("network"));

    render(
      <LinkPreviewCard
        href="https://example.com/article"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("fallback")).toBeInTheDocument();
    });
  });

  it("renders nostr card when response is a nostr payload", async () => {
    fetchLinkPreview.mockResolvedValue({
      type: "nostr.note",
      canonicalUrl: "https://snort.social/e/abcd",
      pointer: { id: "abcd" },
      author: null,
      createdAt: null,
      text: "gm",
      images: [],
      labels: [],
      links: { open: "https://snort.social/e/abcd" },
    });

    render(
      <LinkPreviewCard
        href="nostr:note1abcd"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    await waitFor(() => {
      expect(mockNostrCard).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId("nostr-card")).toBeInTheDocument();
    expect(mockOpenGraphPreview).toHaveBeenCalled();
  });
});
