import { render, screen, waitFor } from "@testing-library/react";
import { ErrorBoundary } from "react-error-boundary";
import React from "react";

import EnsLinkPreview from "@/components/waves/ens/EnsLinkPreview";

const mockEnsPreviewCard = jest.fn(({ preview }: any) => (
  <div data-testid="ens-preview" data-type={preview?.type} />
));

jest.mock("@/components/waves/ens/EnsPreviewCard", () => ({
  __esModule: true,
  default: (props: any) => mockEnsPreviewCard(props),
}));

jest.mock("@/services/api/link-preview-api", () => ({
  fetchLinkPreview: jest.fn(),
}));

describe("EnsLinkPreview", () => {
  const { fetchLinkPreview } = require("@/services/api/link-preview-api");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state and then ENS preview", async () => {
    const preview = { type: "ens.name", name: "vitalik.eth" };
    fetchLinkPreview.mockResolvedValue(preview);

    render(<EnsLinkPreview href="vitalik.eth" />);

    expect(screen.getByTestId("ens-preview-loading")).toBeInTheDocument();
    expect(fetchLinkPreview).toHaveBeenCalledWith("vitalik.eth");

    await waitFor(() => {
      expect(mockEnsPreviewCard).toHaveBeenCalledWith({ preview });
    });

    expect(screen.getByTestId("ens-preview")).toHaveAttribute(
      "data-type",
      "ens.name"
    );
  });

  it("throws when ENS preview data is unavailable", async () => {
    fetchLinkPreview.mockResolvedValue({ title: "Not ENS" });

    render(
      <ErrorBoundary
        fallbackRender={({ error }) => (
          <div data-testid="ens-error">{error.message}</div>
        )}>
        <EnsLinkPreview href="vitalik.eth" />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByTestId("ens-error")).toHaveTextContent(
        "ENS preview unavailable"
      );
    });
  });
});
