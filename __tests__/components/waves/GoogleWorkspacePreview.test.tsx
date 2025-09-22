import { render, waitFor } from "@testing-library/react";
import React from "react";

import GoogleWorkspacePreview from "../../../components/waves/GoogleWorkspacePreview";

const mockGoogleWorkspaceCard = jest.fn(({ href, data }: any) => (
  <div data-testid="google-card" data-href={href} data-type={data?.type} />
));

jest.mock("../../../components/waves/OpenGraphPreview", () => ({
  __esModule: true,
  default: () => <div data-testid="placeholder" />,
}));

jest.mock("../../../components/waves/GoogleWorkspaceCard", () => ({
  __esModule: true,
  default: (props: any) => mockGoogleWorkspaceCard(props),
}));

jest.mock("../../../services/api/link-preview-api", () => ({
  fetchLinkPreview: jest.fn(),
}));

describe("GoogleWorkspacePreview", () => {
  const { fetchLinkPreview } = require("../../../services/api/link-preview-api");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Google Workspace card when response matches", async () => {
    const response = {
      type: "google.docs",
      requestUrl: "https://docs.google.com/document/d/abc/edit",
    };

    fetchLinkPreview.mockResolvedValue(response);

    render(<GoogleWorkspacePreview href="https://docs.google.com/document/d/abc/edit" />);

    await waitFor(() =>
      expect(mockGoogleWorkspaceCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href: "https://docs.google.com/document/d/abc/edit",
          data: response,
        })
      )
    );
  });
});
