import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import LinkPreviewCard from "../../../components/waves/LinkPreviewCard";

const mockOpenGraphPreview = jest.fn(({ href, preview }: any) => (
  <div data-testid="open-graph" data-href={href} data-preview={preview ? "ready" : "loading"} />
));

const mockOfficePreviewCard = jest.fn(({ href, data }: any) => (
  <div data-testid="office-card" data-href={href} data-type={data?.type} />
));

jest.mock("../../../components/waves/OpenGraphPreview", () => {
  const actual = jest.requireActual("../../../components/waves/OpenGraphPreview");
  return {
    __esModule: true,
    ...actual,
    default: (props: any) => mockOpenGraphPreview(props),
  };
});

jest.mock("../../../components/waves/OfficePreviewCard", () => ({
  __esModule: true,
  default: (props: any) => mockOfficePreviewCard(props),
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

  it("renders Office preview card when response is a Microsoft 365 link", async () => {
    fetchLinkPreview.mockResolvedValue({
      type: "office.word",
      title: "Quarterly Report",
      canonicalUrl: "https://tenant.sharepoint.com/:w:/r/report.docx",
      thumbnail: null,
      links: {
        open: "https://tenant.sharepoint.com/:w:/r/report.docx",
        preview:
          "https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Ftenant.sharepoint.com%2F%3Aw%3A%2Fr%2Freport.docx",
        officeViewer: null,
        exportPdf: null,
      },
      availability: "public",
    });

    render(
      <LinkPreviewCard
        href="https://example.com/report"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    await waitFor(() =>
      expect(mockOfficePreviewCard).toHaveBeenLastCalledWith(
        expect.objectContaining({
          href: "https://example.com/report",
          data: expect.objectContaining({
            type: "office.word",
            title: "Quarterly Report",
          }),
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
