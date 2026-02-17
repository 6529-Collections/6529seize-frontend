import React from "react";
import { render, screen } from "@testing-library/react";
import { createLinkRenderer } from "@/components/drops/view/part/dropPartMarkdown/linkHandlers";

const createLinkHandlers = jest.fn(() => [
  {
    match: () => true,
    render: () => <div data-testid="handled-link">handled</div>,
    display: "block",
  },
]);

const createSeizeHandlers = jest.fn(() => []);

jest.mock("@/components/drops/view/part/dropPartMarkdown/handlers", () => ({
  createLinkHandlers: (...args: any[]) => createLinkHandlers(...args),
  createSeizeHandlers: (...args: any[]) => createSeizeHandlers(...args),
}));

describe("createLinkRenderer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes marketplaceCompact option to link handlers", () => {
    const renderer = createLinkRenderer({
      onQuoteClick: jest.fn(),
      marketplaceCompact: true,
    });

    const rendered = renderer.renderAnchor({
      href: "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1",
      children: "nft",
    } as any);

    render(<>{rendered}</>);

    expect(createLinkHandlers).toHaveBeenCalledWith(
      expect.objectContaining({
        marketplaceCompact: true,
      })
    );
    expect(screen.getByTestId("handled-link")).toBeInTheDocument();
  });
});
