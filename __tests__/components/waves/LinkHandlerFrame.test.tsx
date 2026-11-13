import { render, screen } from "@testing-library/react";

import LinkHandlerFrame from "@/components/waves/LinkHandlerFrame";

let mockHideActions = false;

jest.mock("@/components/waves/ChatItemHrefButtons", () => ({
  __esModule: true,
  default: ({
    href,
    layout,
    relativeHref,
  }: {
    href: string;
    layout: string;
    relativeHref?: string;
  }) => (
    <div
      data-testid="chat-item-href-buttons"
      data-href={href}
      data-layout={layout}
      data-relative-href={relativeHref ?? "none"}
    />
  ),
}));

jest.mock("@/components/waves/LinkPreviewContext", () => ({
  useLinkPreviewContext: () => ({ hideActions: mockHideActions }),
}));

describe("LinkHandlerFrame", () => {
  beforeEach(() => {
    mockHideActions = false;
  });

  it.each([
    ["https://test.6529.io/waves/123?drop=1#part", "/waves/123?drop=1#part"],
    ["https://test.6529.io//other.example/path", "none"],
    ["https://test.6529.io/\\other.example/path", "none"],
    ["https://example.com/tweet", "none"],
  ])("passes the on-site path of %s to the actions", (href, expected) => {
    render(
      <LinkHandlerFrame href={href}>
        <div>Preview</div>
      </LinkHandlerFrame>
    );

    expect(screen.getByTestId("chat-item-href-buttons")).toHaveAttribute(
      "data-relative-href",
      expected
    );
  });

  it("uses the full-width frame wrapper by default", () => {
    render(
      <LinkHandlerFrame href="https://example.com/tweet">
        <div data-testid="preview-card" className="lg:tw-max-w-[480px]">
          Preview
        </div>
      </LinkHandlerFrame>
    );

    const actions = screen.getByTestId("chat-item-href-buttons");
    const anchor = actions.parentElement;
    const outer = anchor?.parentElement;

    expect(anchor).not.toBeNull();
    expect(anchor?.className).toContain("tw-group/link-card");
    expect(anchor?.className).toContain("tw-relative");
    expect(anchor?.className).toContain("tw-w-full");
    expect(anchor?.className).toContain("tw-max-w-full");
    expect(anchor?.className).not.toContain("tw-inline-flex");
    expect(anchor?.className).not.toContain("tw-w-fit");
    expect(outer).not.toBeNull();
    expect(actions).toHaveAttribute("data-layout", "overlay");
  });

  it("supports content-width overlay anchoring when explicitly requested", () => {
    render(
      <LinkHandlerFrame
        href="https://example.com/tweet"
        overlayAnchor="content"
      >
        <div data-testid="preview-card" className="lg:tw-max-w-[480px]">
          Preview
        </div>
      </LinkHandlerFrame>
    );

    const actions = screen.getByTestId("chat-item-href-buttons");
    const anchor = actions.parentElement;
    const outer = anchor?.parentElement;

    expect(anchor).not.toBeNull();
    expect(anchor?.className).toContain("tw-group/link-card");
    expect(anchor?.className).toContain("tw-relative");
    expect(anchor?.className).toContain("tw-inline-flex");
    expect(anchor?.className).toContain("tw-w-fit");
    expect(anchor?.className).toContain("tw-max-w-full");

    expect(outer).not.toBeNull();
    expect(outer?.className).toContain("tw-flex");
    expect(outer?.className).toContain("tw-w-full");
    expect(actions).toHaveAttribute("data-layout", "overlay");
  });

  it("falls back to the full-width frame wrapper when actions are hidden", () => {
    mockHideActions = true;

    render(
      <LinkHandlerFrame
        href="https://example.com/tweet"
        overlayAnchor="content"
      >
        <div data-testid="preview-card" className="lg:tw-max-w-[480px]">
          Preview
        </div>
      </LinkHandlerFrame>
    );

    const preview = screen.getByTestId("preview-card");
    const anchor = preview.parentElement?.parentElement;

    expect(
      screen.queryByTestId("chat-item-href-buttons")
    ).not.toBeInTheDocument();
    expect(anchor).not.toBeNull();
    expect(anchor?.className).toContain("tw-group/link-card");
    expect(anchor?.className).toContain("tw-w-full");
    expect(anchor?.className).not.toContain("tw-inline-flex");
    expect(anchor?.className).not.toContain("tw-w-fit");
  });
});
