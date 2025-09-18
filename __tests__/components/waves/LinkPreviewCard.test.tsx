import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import LinkPreviewCard from "../../../components/waves/LinkPreviewCard";

const mockOpenGraphPreview = jest.fn(({ href, preview }: any) => (
  <div data-testid="open-graph" data-href={href} data-preview={preview ? "ready" : "loading"} />
));

const mockCompoundCard = jest.fn(({ href, response }: any) => (
  <div data-testid="compound-card" data-href={href} data-type={response?.type} />
));

const mockToCompoundResponse = jest.fn((value: any) => {
  if (value && typeof value === "object" && typeof value.type === "string" && value.type.startsWith("compound.")) {
    return value;
  }
  return undefined;
});

jest.mock("../../../components/waves/OpenGraphPreview", () => {
  const actual = jest.requireActual("../../../components/waves/OpenGraphPreview");
  return {
    __esModule: true,
    ...actual,
    default: (props: any) => mockOpenGraphPreview(props),
  };
});

jest.mock("../../../components/waves/compound/CompoundCard", () => ({
  __esModule: true,
  default: (props: any) => mockCompoundCard(props),
  toCompoundResponse: (value: unknown) => mockToCompoundResponse(value),
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

  it("renders compound card when compound data is returned", async () => {
    const compoundResponse = {
      type: "compound.market",
      version: "v2",
      chainId: 1,
      market: {
        cToken: "0xToken",
        symbol: "cUSDC",
        underlying: { address: "0xUnderlying", symbol: "USDC", decimals: 6 },
      },
      metrics: {
        supplyApy: "0.01",
        borrowApy: "0.02",
        utilization: "0.5",
        tvlUnderlying: "1000",
        tvlUsd: "1000",
        collateralFactor: "0.5",
        reserveFactor: "0.1",
        exchangeRate: "0.02",
      },
      links: {},
    };

    fetchLinkPreview.mockResolvedValue(compoundResponse);

    render(
      <LinkPreviewCard
        href="https://example.com/compound"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    await waitFor(() => {
      expect(mockCompoundCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href: "https://example.com/compound",
          response: compoundResponse,
        })
      );
    });

    expect(mockToCompoundResponse).toHaveBeenCalledWith(compoundResponse);
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
