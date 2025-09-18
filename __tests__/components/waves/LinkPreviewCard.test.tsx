import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import LinkPreviewCard from "../../../components/waves/LinkPreviewCard";

const mockOpenGraphPreview = jest.fn(({ href, preview }: any) => (
  <div data-testid="open-graph" data-href={href} data-preview={preview ? "ready" : "loading"} />
));
const mockFacebookPreview = jest.fn(({ href, preview }: any) => (
  <div data-testid="facebook" data-href={href} data-type={preview?.type} />
));

jest.mock("../../../components/waves/OpenGraphPreview", () => {
  const actual = jest.requireActual("../../../components/waves/OpenGraphPreview");
  return {
    __esModule: true,
    ...actual,
    default: (props: any) => mockOpenGraphPreview(props),
  };
});

jest.mock("../../../components/waves/FacebookPreview", () => ({
  __esModule: true,
  default: (props: any) => mockFacebookPreview(props),
}));

jest.mock("../../../services/api/link-preview-api", () => ({
  fetchLinkPreview: jest.fn(),
}));

describe("LinkPreviewCard", () => {
  const { fetchLinkPreview } = require("../../../services/api/link-preview-api");

  beforeEach(() => {
    jest.clearAllMocks();
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

  it("renders facebook preview when facebook data is returned", async () => {
    fetchLinkPreview.mockResolvedValue({
      type: "facebook.post",
      canonicalUrl: "https://facebook.com/Page/posts/1",
      post: {
        page: "Page",
        postId: "1",
        authorName: "Page",
        authorUrl: "https://facebook.com/Page",
        createdAt: null,
        text: "Hello",
        images: [{ url: "https://cdn.facebook.com/img.jpg", alt: "Image from Facebook post" }],
      },
      requestUrl: "https://facebook.com/Page/posts/1",
      url: "https://facebook.com/Page/posts/1",
      title: "Page",
      description: "Hello",
      siteName: null,
      mediaType: null,
      contentType: "text/html",
      favicon: null,
      favicons: null,
      image: null,
      images: null,
    });

    render(
      <LinkPreviewCard
        href="https://facebook.com/Page/posts/1"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    await waitFor(() => {
      expect(mockFacebookPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          href: "https://facebook.com/Page/posts/1",
          preview: expect.objectContaining({ type: "facebook.post" }),
        })
      );
    });

    expect(screen.queryByTestId("fallback")).toBeNull();
    expect(mockOpenGraphPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://facebook.com/Page/posts/1",
        preview: undefined,
      })
    );
  });
});
