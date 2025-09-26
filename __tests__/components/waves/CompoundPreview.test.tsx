import { render, waitFor } from "@testing-library/react";
import React from "react";

import CompoundPreview from "../../../components/waves/CompoundPreview";

const mockCompoundCard = jest.fn(({ href, response }: any) => (
  <div data-testid="compound-card" data-href={href} data-type={response?.type} />
));

jest.mock("../../../components/waves/OpenGraphPreview", () => ({
  __esModule: true,
  default: () => <div data-testid="placeholder" />,
}));

jest.mock("../../../components/waves/compound/CompoundCard", () => ({
  __esModule: true,
  default: (props: any) => mockCompoundCard(props),
  toCompoundResponse: (value: any) =>
    value && typeof value.type === "string" && value.type.startsWith("compound.") ? value : undefined,
}));

jest.mock("../../../services/api/link-preview-api", () => ({
  fetchLinkPreview: jest.fn(),
}));

describe("CompoundPreview", () => {
  const { fetchLinkPreview } = require("../../../services/api/link-preview-api");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Compound card when response is recognized", async () => {
    const response = {
      type: "compound.market",
      version: "v2",
      chainId: 1,
    };

    fetchLinkPreview.mockResolvedValue(response);

    render(<CompoundPreview href="https://app.compound.finance/markets" />);

    await waitFor(() =>
      expect(mockCompoundCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href: "https://app.compound.finance/markets",
          response,
        })
      )
    );
  });
});
