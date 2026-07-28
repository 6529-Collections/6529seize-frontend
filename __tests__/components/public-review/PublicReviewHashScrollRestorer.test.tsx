import { render, waitFor } from "@testing-library/react";

import { PublicReviewHashScrollRestorer } from "@/components/public-review/PublicReviewHashScrollRestorer";

describe("PublicReviewHashScrollRestorer", () => {
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  const originalCancelAnimationFrame = window.cancelAnimationFrame;
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

  beforeEach(() => {
    window.history.replaceState(
      null,
      "",
      "/reviews/6529-stream/reference#solidity-global-declarations"
    );
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: jest.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: originalRequestAnimationFrame,
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: originalCancelAnimationFrame,
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: originalScrollIntoView,
    });
  });

  it("restores a hash target that exists when the page hydrates", () => {
    render(
      <>
        <PublicReviewHashScrollRestorer />
        <h2 id="solidity-global-declarations">All callable declarations</h2>
      </>
    );

    expect(
      document.getElementById("solidity-global-declarations")?.scrollIntoView
    ).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });

  it("waits for a streamed hash target to enter the document", async () => {
    render(<PublicReviewHashScrollRestorer />);
    const target = document.createElement("h2");
    target.id = "solidity-global-declarations";
    document.body.append(target);

    await waitFor(() =>
      expect(target.scrollIntoView).toHaveBeenCalledWith({
        behavior: "auto",
        block: "start",
      })
    );
  });
});
