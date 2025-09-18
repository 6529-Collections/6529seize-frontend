import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import LinkPreviewCard from "../../../components/waves/LinkPreviewCard";

const mockOpenGraphPreview = jest.fn(({ href, preview }: any) => (
  <div data-testid="open-graph" data-href={href} data-preview={preview ? "ready" : "loading"} />
));

const mockInstagramCard = jest.fn(({ href, preview }: any) => (
  <div
    data-testid="instagram-card"
    data-href={href}
    data-status={preview.status}
    data-resource={preview.resource}
  />
));

jest.mock("../../../components/waves/OpenGraphPreview", () => {
  const actual = jest.requireActual("../../../components/waves/OpenGraphPreview");
  return {
    __esModule: true,
    ...actual,
    default: (props: any) => mockOpenGraphPreview(props),
  };
});

jest.mock("../../../components/waves/InstagramCard", () => ({
  __esModule: true,
  default: (props: any) => mockInstagramCard(props),
}));

jest.mock("../../../services/api/link-preview-api", () => ({
  fetchLinkPreview: jest.fn(),
}));

describe("LinkPreviewCard", () => {
  const { fetchLinkPreview } = require("../../../services/api/link-preview-api");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders instagram card when instagram preview is provided", async () => {
    fetchLinkPreview.mockResolvedValue({
      instagram: {
        canonicalUrl: "https://instagram.com/p/abc/",
        resource: "post",
        status: "available",
      },
    });

    render(
      <LinkPreviewCard
        href="https://www.instagram.com/p/abc/"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    await waitFor(() => {
      expect(mockInstagramCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href: "https://www.instagram.com/p/abc/",
          preview: expect.objectContaining({
            canonicalUrl: "https://instagram.com/p/abc/",
            resource: "post",
            status: "available",
          }),
        })
      );
    });

    expect(screen.queryByTestId("open-graph")).toBeNull();
    expect(screen.queryByTestId("fallback")).toBeNull();
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
});
