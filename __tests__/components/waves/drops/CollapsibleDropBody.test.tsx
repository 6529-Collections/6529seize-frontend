import { act, fireEvent, render, screen } from "@testing-library/react";
import CollapsibleDropBody from "@/components/waves/drops/CollapsibleDropBody";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

describe("CollapsibleDropBody", () => {
  const originalResizeObserver = globalThis.ResizeObserver;
  let resizeObserverCallback: ResizeObserverCallback | null = null;

  beforeEach(() => {
    resizeObserverCallback = null;
    globalThis.ResizeObserver = jest
      .fn()
      .mockImplementation((callback: ResizeObserverCallback) => {
        resizeObserverCallback = callback;
        return {
          disconnect: jest.fn(),
          observe: jest.fn(),
          unobserve: jest.fn(),
        };
      }) as unknown as typeof ResizeObserver;
    jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (this.getAttribute("aria-hidden") === "true") {
          return { bottom: 120, height: 120, top: 0 } as DOMRect;
        }

        return {
          bottom: this instanceof HTMLAnchorElement ? 240 : 120,
          height: 120,
          top: 0,
        } as DOMRect;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it("expands without triggering its parent and restores clipped links", () => {
    const onParentClick = jest.fn();

    render(
      <div onClick={onParentClick}>
        <CollapsibleDropBody>
          <p data-drop-body-text="true">Long Wave message</p>
          <a data-drop-body-text="true" href="https://example.com">
            Clipped link
          </a>
        </CollapsibleDropBody>
      </div>
    );

    const clippedLink = screen.getByRole("link", {
      hidden: true,
      name: "Clipped link",
    });
    const showMore = screen.getByRole("button", { name: "Show more" });
    const contentRegion = globalThis.document.getElementById(
      showMore.getAttribute("aria-controls") ?? ""
    );

    expect(showMore).toHaveAttribute("aria-expanded", "false");
    expect(clippedLink).toHaveAttribute("tabindex", "-1");
    expect(contentRegion).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(showMore);

    expect(onParentClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(clippedLink).not.toHaveAttribute("tabindex");
    expect(contentRegion).not.toHaveAttribute("aria-hidden");
  });

  it("does not show a disclosure control when the body fits", () => {
    jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (this.getAttribute("aria-hidden") === "true") {
          return { bottom: 120, height: 120, top: 0 } as DOMRect;
        }

        return { bottom: 40, height: 40, top: 0 } as DOMRect;
      });

    render(
      <CollapsibleDropBody>
        <p data-drop-body-text="true">Short Wave message</p>
      </CollapsibleDropBody>
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not collapse a short marked body because media is tall", () => {
    jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (this.getAttribute("aria-hidden") === "true") {
          return { bottom: 120, height: 120, top: 0 } as DOMRect;
        }

        const bottom = this.hasAttribute("data-drop-body-text") ? 40 : 240;
        return { bottom, height: bottom, top: 0 } as DOMRect;
      });

    render(
      <CollapsibleDropBody>
        <p data-drop-body-text="true">Short Wave message</p>
        <div>Media preview</div>
      </CollapsibleDropBody>
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(
      screen.getByText("Short Wave message").parentElement?.parentElement
    ).toHaveClass("tw-overflow-visible");
  });

  it("expands if a focused descendant becomes clipped", () => {
    let linkBottom = 100;
    jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (this.getAttribute("aria-hidden") === "true") {
          return { bottom: 120, height: 120, top: 0 } as DOMRect;
        }

        const bottom = this instanceof HTMLAnchorElement ? linkBottom : 240;
        return { bottom, height: bottom, top: 0 } as DOMRect;
      });

    render(
      <CollapsibleDropBody>
        <p data-drop-body-text="true">Long Wave message</p>
        <a href="https://example.com">Focusable link</a>
      </CollapsibleDropBody>
    );

    const link = screen.getByRole("link", {
      hidden: true,
      name: "Focusable link",
    });
    link.focus();
    linkBottom = 240;
    act(() => {
      resizeObserverCallback?.([], {} as ResizeObserver);
    });

    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(link).toHaveFocus();
  });

  it("recomputes clipped focus targets in the resize fallback", () => {
    let linkBottom = 240;
    globalThis.ResizeObserver = undefined as unknown as typeof ResizeObserver;
    jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (this.getAttribute("aria-hidden") === "true") {
          return { bottom: 120, height: 120, top: 0 } as DOMRect;
        }

        const bottom = this instanceof HTMLAnchorElement ? linkBottom : 240;
        return { bottom, height: bottom, top: 0 } as DOMRect;
      });

    render(
      <CollapsibleDropBody>
        <p data-drop-body-text="true">Long Wave message</p>
        <a href="https://example.com">Responsive link</a>
      </CollapsibleDropBody>
    );

    const link = screen.getByRole("link", {
      hidden: true,
      name: "Responsive link",
    });
    expect(link).toHaveAttribute("tabindex", "-1");

    linkBottom = 100;
    fireEvent(globalThis.window, new Event("resize"));

    expect(link).not.toHaveAttribute("tabindex");
  });
});
