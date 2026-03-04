import React from "react";
import { render, screen } from "@testing-library/react";
import { createLinkRenderer } from "@/components/drops/view/part/dropPartMarkdown/linkHandlers";
import { ensureStableSeizeLink } from "@/helpers/SeizeLinkParser";

const createLinkHandlers = jest.fn();
const createSeizeHandlers = jest.fn();

jest.mock("@/components/drops/view/part/dropPartMarkdown/handlers", () => ({
  createLinkHandlers: (...args: any[]) => createLinkHandlers(...args),
  createSeizeHandlers: (...args: any[]) => createSeizeHandlers(...args),
}));

jest.mock("@/helpers/SeizeLinkParser", () => ({
  ensureStableSeizeLink: jest.fn((href: string) => href),
}));

const mockedEnsureStableSeizeLink =
  ensureStableSeizeLink as jest.MockedFunction<typeof ensureStableSeizeLink>;

describe("createLinkRenderer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEnsureStableSeizeLink.mockImplementation((href) => href);
    createSeizeHandlers.mockReturnValue([]);
    createLinkHandlers.mockReturnValue([]);
  });

  it("matches and renders seize handlers using raw href", () => {
    const rawHref =
      "https://site.com/waves/123e4567-e89b-12d3-a456-426614174000?drop=drop-1";
    const stableHref = "https://site.com/messages?wave=current&drop=drop-1";
    mockedEnsureStableSeizeLink.mockReturnValue(stableHref);

    const seizeMatch = jest.fn((href: string) => href === rawHref);
    const seizeRender = jest.fn(() => (
      <div data-testid="seize-link">seize</div>
    ));
    createSeizeHandlers.mockReturnValue([
      {
        match: seizeMatch,
        render: seizeRender,
        display: "block",
      },
    ]);

    const { renderAnchor, isSmartLink } = createLinkRenderer({
      onQuoteClick: jest.fn(),
    });

    render(<>{renderAnchor({ href: rawHref, children: "link" } as any)}</>);

    expect(seizeMatch).toHaveBeenCalledWith(rawHref);
    expect(seizeMatch).not.toHaveBeenCalledWith(stableHref);
    expect(seizeRender).toHaveBeenCalledWith(rawHref);
    expect(screen.getByTestId("seize-link")).toBeTruthy();
    expect(isSmartLink(rawHref)).toBe(true);
  });

  it("continues to use stable href for non-seize handlers", () => {
    const rawHref =
      "https://site.com/waves/123e4567-e89b-12d3-a456-426614174000?foo=bar";
    const stableHref =
      "https://site.com/waves/123e4567-e89b-12d3-a456-426614174000?foo=bar&drop=normalized";
    mockedEnsureStableSeizeLink.mockReturnValue(stableHref);

    const externalMatch = jest.fn((href: string) => href === stableHref);
    const externalRender = jest.fn(() => (
      <div data-testid="external-link">external</div>
    ));
    createLinkHandlers.mockReturnValue([
      {
        match: externalMatch,
        render: externalRender,
        display: "block",
      },
    ]);

    const { renderAnchor, isSmartLink } = createLinkRenderer({
      onQuoteClick: jest.fn(),
    });

    render(<>{renderAnchor({ href: rawHref, children: "link" } as any)}</>);

    expect(externalMatch).toHaveBeenCalledWith(stableHref);
    expect(externalRender).toHaveBeenCalledWith(stableHref);
    expect(screen.getByTestId("external-link")).toBeTruthy();
    expect(isSmartLink(rawHref)).toBe(true);
  });
});
