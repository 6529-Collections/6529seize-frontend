import MemesQuickVoteDescription from "@/components/brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteDescription";
import { act, fireEvent, render, screen } from "@testing-library/react";

describe("MemesQuickVoteDescription", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(globalThis, "getComputedStyle").mockReturnValue(
      Object.assign(document.createElement("p").style, {
        lineHeight: "22.75px",
      })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  const renderDescription = (lineCount: number, isDesktop: boolean) => {
    const mediaQuery = globalThis.matchMedia("(min-width: 768px)");
    jest.spyOn(globalThis, "matchMedia").mockReturnValue({
      ...mediaQuery,
      matches: isDesktop,
    });

    const fullHeight = lineCount * 22.75;
    jest
      .spyOn(HTMLElement.prototype, "offsetHeight", "get")
      .mockReturnValue(Math.round(fullHeight));
    // The swipe card scales visually without changing the text's layout height.
    jest.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 320,
      bottom: fullHeight * 1.05,
      width: 320,
      height: fullHeight * 1.05,
      toJSON: () => ({}),
    });

    render(<MemesQuickVoteDescription description="Submission description" />);
    act(() => {
      jest.runOnlyPendingTimers();
    });
  };

  it.each([
    { viewport: "mobile", lineCount: 2, isDesktop: false },
    { viewport: "desktop", lineCount: 4, isDesktop: true },
  ])(
    "hides the toggle when scaled $viewport text fits the collapsed line limit",
    ({ lineCount, isDesktop }) => {
      renderDescription(lineCount, isDesktop);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    }
  );

  it.each([
    { viewport: "mobile", lineCount: 3, isDesktop: false },
    { viewport: "desktop", lineCount: 5, isDesktop: true },
  ])(
    "allows expanding and collapsing $viewport text beyond the line limit",
    ({ lineCount, isDesktop }) => {
      renderDescription(lineCount, isDesktop);

      const toggle = screen.getByRole("button", { name: "See more" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(toggle);
      expect(screen.getByRole("button", { name: "See less" })).toHaveAttribute(
        "aria-expanded",
        "true"
      );

      fireEvent.click(toggle);
      expect(screen.getByRole("button", { name: "See more" })).toHaveAttribute(
        "aria-expanded",
        "false"
      );
    }
  );
});
