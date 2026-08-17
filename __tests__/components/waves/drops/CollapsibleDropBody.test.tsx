import { fireEvent, render, screen } from "@testing-library/react";
import CollapsibleDropBody from "@/components/waves/drops/CollapsibleDropBody";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

describe("CollapsibleDropBody", () => {
  beforeEach(() => {
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

    const clippedLink = screen.getByRole("link", { name: "Clipped link" });
    const showMore = screen.getByRole("button", { name: "Show more" });

    expect(showMore).toHaveAttribute("aria-expanded", "false");
    expect(clippedLink).toHaveAttribute("tabindex", "-1");

    fireEvent.click(showMore);

    expect(onParentClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(clippedLink).not.toHaveAttribute("tabindex");
  });

  it("does not show a disclosure control when the body fits", () => {
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
});
