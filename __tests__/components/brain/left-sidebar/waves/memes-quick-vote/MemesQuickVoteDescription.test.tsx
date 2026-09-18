import MemesQuickVoteDescription from "@/components/brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteDescription";
import { act, fireEvent, render, screen } from "@testing-library/react";

describe("MemesQuickVoteDescription", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  const renderDescription = (lineCount: number, isDesktop: boolean) => {
    const fullHeight = lineCount * 22.75;
    jest
      .spyOn(HTMLElement.prototype, "offsetHeight", "get")
      .mockImplementation(function getOffsetHeight(this: HTMLElement) {
        if (this.classList.contains("tw-line-clamp-none")) {
          return Math.round(fullHeight);
        }

        if (this.classList.contains("tw-line-clamp-2")) {
          const collapsedLines = isDesktop ? 4 : 2;
          return Math.round(Math.min(lineCount, collapsedLines) * 22.75);
        }

        return Math.round(fullHeight);
      });

    const renderResult = render(
      <MemesQuickVoteDescription description="Submission description" />
    );
    act(() => {
      jest.runOnlyPendingTimers();
    });

    return renderResult;
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

  it("keeps the collapse control outside the expanded mobile scroll area", () => {
    const fullHeight = 8 * 22.75;
    jest
      .spyOn(HTMLElement.prototype, "offsetHeight", "get")
      .mockImplementation(function getOffsetHeight(this: HTMLElement) {
        return this.classList.contains("tw-line-clamp-none")
          ? Math.round(fullHeight)
          : Math.round(2 * 22.75);
      });

    const { container } = render(
      <MemesQuickVoteDescription
        constrainHeight={true}
        description="Submission description"
      />
    );
    act(() => {
      jest.runOnlyPendingTimers();
    });

    fireEvent.click(screen.getByRole("button", { name: "See more" }));

    const scrollArea = container.querySelector(".tw-overflow-y-auto");
    const collapseButton = screen.getByRole("button", { name: "See less" });
    expect(scrollArea).toBeInTheDocument();
    expect(scrollArea).not.toContainElement(collapseButton);
    expect(collapseButton).toHaveAttribute("aria-expanded", "true");
  });
});
