import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import LinkPreviewCard from "../../../components/waves/LinkPreviewCard";

const mockOpenGraphPreview = jest.fn(({ href, preview }: any) => (
  <div data-testid="open-graph" data-href={href} data-preview={preview ? "ready" : "loading"} />
));

const mockJackButcherPreview = jest.fn(({ data, href }: any) => (
  <div data-testid="jack" data-href={href} data-type={data?.type ?? "unknown"} />
));

jest.mock("../../../components/waves/OpenGraphPreview", () => {
  const actual = jest.requireActual("../../../components/waves/OpenGraphPreview");
  return {
    __esModule: true,
    ...actual,
    default: (props: any) => mockOpenGraphPreview(props),
  };
});

jest.mock("../../../components/waves/JackButcherPreview", () => ({
  __esModule: true,
  default: (props: any) => mockJackButcherPreview(props),
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

  it("renders Jack Butcher preview when specialized payload is returned", async () => {
    fetchLinkPreview.mockResolvedValue({
      type: "jack.checks",
      chainId: 1,
      collection: { address: "0x123", name: "Checks" },
      token: { id: "1" },
      links: {},
    });

    render(
      <LinkPreviewCard
        href="https://checks.art/checks/1"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    await waitFor(() =>
      expect(mockJackButcherPreview).toHaveBeenLastCalledWith(
        expect.objectContaining({
          href: "https://checks.art/checks/1",
          data: expect.objectContaining({ type: "jack.checks" }),
        })
      )
    );

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
