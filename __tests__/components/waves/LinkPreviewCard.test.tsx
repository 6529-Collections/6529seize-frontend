import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import LinkPreviewCard from "../../../components/waves/LinkPreviewCard";

const mockOpenGraphPreview = jest.fn(({ href, preview }: any) => (
  <div data-testid="open-graph" data-href={href} data-preview={preview ? "ready" : "loading"} />
));

const mockTruthSocialCard = jest.fn(({ href, data }: any) => (
  <div data-testid="truth-card" data-kind={data?.kind} data-href={href} />
));

jest.mock("../../../components/waves/OpenGraphPreview", () => {
  const actual = jest.requireActual("../../../components/waves/OpenGraphPreview");
  return {
    __esModule: true,
    ...actual,
    default: (props: any) => mockOpenGraphPreview(props),
  };
});

jest.mock("../../../components/waves/truth/TruthSocialCard", () => ({
  __esModule: true,
  default: (props: any) => mockTruthSocialCard(props),
}));

jest.mock("../../../services/api/link-preview-api", () => ({
  fetchLinkPreview: jest.fn(),
}));

describe("LinkPreviewCard", () => {
  const { fetchLinkPreview } = require("../../../services/api/link-preview-api");

  beforeEach(() => {
    jest.clearAllMocks();
    mockTruthSocialCard.mockClear();
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

  it("renders Truth Social post card when response type is truth.post", async () => {
    fetchLinkPreview.mockResolvedValue({
      type: "truth.post",
      canonicalUrl: "https://truthsocial.com/@alice/posts/123",
      requestUrl: "https://truthsocial.com/@alice/posts/123?ref=foo",
      post: {
        handle: "alice",
        postId: "123",
        author: { displayName: "Alice" },
        text: "Hello",
        images: [{ url: "https://images.example.com/a.jpg", alt: "test" }],
      },
    });

    render(
      <LinkPreviewCard
        href="https://truthsocial.com/@alice/posts/123"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    await waitFor(() => {
      expect(mockTruthSocialCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href: "https://truthsocial.com/@alice/posts/123",
          data: expect.objectContaining({ kind: "post" }),
        })
      );
    });

    expect(mockOpenGraphPreview).toHaveBeenCalled();
  });

  it("renders Truth Social profile card when response type is truth.profile", async () => {
    fetchLinkPreview.mockResolvedValue({
      type: "truth.profile",
      canonicalUrl: "https://truthsocial.com/@alice",
      profile: {
        handle: "alice",
        displayName: "Alice",
        avatar: "https://images.example.com/avatar.jpg",
        bio: "Bio",
      },
    });

    render(
      <LinkPreviewCard
        href="https://truthsocial.com/@alice"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    await waitFor(() => {
      expect(mockTruthSocialCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href: "https://truthsocial.com/@alice",
          data: expect.objectContaining({ kind: "profile" }),
        })
      );
    });

    expect(mockOpenGraphPreview).toHaveBeenCalled();
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
});
