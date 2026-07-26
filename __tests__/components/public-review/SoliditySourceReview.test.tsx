import { createHash, webcrypto } from "node:crypto";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  SoliditySourceReview,
  usePublicReviewCodeSelection,
} from "@/components/public-review/SoliditySourceReview";

function SelectionProbe() {
  const { integrityStatus, selection } = usePublicReviewCodeSelection();
  return (
    <>
      <output data-testid="integrity-status">{integrityStatus}</output>
      <output data-testid="selection">
        {selection ? JSON.stringify(selection) : "invalid"}
      </output>
    </>
  );
}

const SOURCE = {
  contract: "StreamCore",
  declaration: "burn(uint256)",
  githubUrl:
    "https://github.com/6529-Collections/6529Stream/blob/abc/smart-contracts/StreamCore.sol#L2",
  initialLineEnd: 2,
  initialLineStart: 2,
  lines: [
    "contract StreamCore {",
    "  function burn(uint256 tokenId) external {}",
    "}",
  ],
  path: "smart-contracts/StreamCore.sol",
  sourceSha256: `sha256:${"1".repeat(64)}`,
} as const;

describe("SoliditySourceReview", () => {
  const cryptoDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "crypto"
  );

  beforeAll(() => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: webcrypto,
    });
  });

  afterAll(() => {
    if (cryptoDescriptor) {
      Object.defineProperty(globalThis, "crypto", cryptoDescriptor);
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.history.replaceState({}, "", window.location.pathname);
  });

  it("hashes exactly the visible whole-line selection for feedback", async () => {
    render(
      <SoliditySourceReview source={SOURCE} feedbackSlot={<SelectionProbe />} />
    );

    const selectedSource = SOURCE.lines[1];
    const snippetSha256 = `sha256:${createHash("sha256")
      .update(selectedSource)
      .digest("hex")}`;
    await waitFor(() => {
      expect(
        JSON.parse(screen.getByTestId("selection").textContent ?? "")
      ).toEqual({
        kind: "code",
        path: "smart-contracts/StreamCore.sol",
        sourceSha256: SOURCE.sourceSha256,
        lineStart: 2,
        lineEnd: 2,
        contract: "StreamCore",
        declaration: "burn(uint256)",
        snippetSha256,
      });
    });
    expect(
      screen.getByRole("link", { name: "Open selected lines on GitHub" })
    ).toHaveAttribute("href", expect.stringContaining("#L2"));
  });

  it("uses explicit keyboard ranges without adding a tab stop per source line", async () => {
    render(
      <SoliditySourceReview source={SOURCE} feedbackSlot={<SelectionProbe />} />
    );

    fireEvent.change(screen.getByLabelText("Start line"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("End line"), {
      target: { value: "3" },
    });

    await waitFor(() => {
      const selection = JSON.parse(
        screen.getByTestId("selection").textContent ?? ""
      );
      expect(selection).toMatchObject({ lineStart: 1, lineEnd: 3 });
    });

    expect(
      screen.queryByRole("button", { name: "Select line 3" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Solidity source code" })
    ).toHaveAttribute("tabindex", "0");
  });

  it("keeps absolute source coordinates for bounded declaration excerpts", async () => {
    render(
      <SoliditySourceReview
        source={{
          ...SOURCE,
          firstLineNumber: 200,
          initialLineEnd: 201,
          initialLineStart: 201,
        }}
        feedbackSlot={<SelectionProbe />}
      />
    );

    expect(screen.getByText("201")).toBeInTheDocument();
    await waitFor(() => {
      expect(
        JSON.parse(screen.getByTestId("selection").textContent ?? "")
      ).toMatchObject({ lineStart: 201, lineEnd: 201 });
    });
    expect(
      screen.getByRole("link", { name: "Open selected lines on GitHub" })
    ).toHaveAttribute("href", expect.stringContaining("#L201"));
  });

  it("uses an in-page source line anchor as the initial feedback range", async () => {
    window.history.replaceState({}, "", "#L2-L3");
    render(
      <SoliditySourceReview source={SOURCE} feedbackSlot={<SelectionProbe />} />
    );

    await waitFor(() => {
      expect(
        JSON.parse(screen.getByTestId("selection").textContent ?? "")
      ).toMatchObject({ lineStart: 2, lineEnd: 3 });
    });
  });

  it("associates an invalid cross-field range with both numeric controls", () => {
    render(
      <SoliditySourceReview source={SOURCE} feedbackSlot={<SelectionProbe />} />
    );

    const startLine = screen.getByLabelText("Start line");
    const endLine = screen.getByLabelText("End line");
    fireEvent.change(startLine, { target: { value: "3" } });
    fireEvent.change(endLine, { target: { value: "1" } });

    expect(startLine).toHaveAttribute("aria-invalid", "true");
    expect(endLine).toHaveAttribute("aria-invalid", "true");
    expect(startLine).toHaveAttribute(
      "aria-describedby",
      endLine.getAttribute("aria-describedby")
    );
    expect(
      screen.getByText("The start line must not be after the end line.")
    ).toHaveAttribute("aria-live", "polite");
  });

  it("moves focus to the structured feedback slot", () => {
    const scrollDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollIntoView"
    );
    const scrollIntoView = jest.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    jest.spyOn(globalThis, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    render(
      <SoliditySourceReview
        feedbackSubmissionsOpen
        source={SOURCE}
        feedbackSlot={
          <div>
            <textarea
              aria-label="Feedback comment"
              data-public-review-feedback-primary
            />
            <SelectionProbe />
          </div>
        }
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Comment on selected lines" })
    );
    expect(screen.getByLabelText("Feedback comment")).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
    if (scrollDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        "scrollIntoView",
        scrollDescriptor
      );
    } else {
      delete (
        HTMLElement.prototype as Partial<Pick<HTMLElement, "scrollIntoView">>
      ).scrollIntoView;
    }
  });

  it("falls back to the feedback region when its primary control is disabled", () => {
    const scrollDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollIntoView"
    );
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: jest.fn(),
    });
    render(
      <SoliditySourceReview
        feedbackSubmissionsOpen
        source={SOURCE}
        feedbackSlot={
          <button type="button" data-public-review-feedback-primary disabled>
            Connecting
          </button>
        }
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Comment on selected lines" })
    );
    expect(
      document.querySelector("[data-public-review-feedback]")
    ).toHaveFocus();

    if (scrollDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        "scrollIntoView",
        scrollDescriptor
      );
    } else {
      delete (
        HTMLElement.prototype as Partial<Pick<HTMLElement, "scrollIntoView">>
      ).scrollIntoView;
    }
  });

  it("does not advertise line comments when submissions are closed or no feedback region exists", () => {
    const { rerender } = render(
      <SoliditySourceReview
        feedbackSubmissionsOpen={false}
        source={SOURCE}
        feedbackSlot={<p>Feedback is closed.</p>}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Comment on selected lines" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Feedback for selected source lines" })
    ).toBeInTheDocument();

    rerender(
      <SoliditySourceReview
        feedbackSubmissionsOpen
        source={SOURCE}
        feedbackSlot={null}
      />
    );
    expect(
      screen.queryByRole("button", { name: "Comment on selected lines" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", {
        name: "Feedback for selected source lines",
      })
    ).not.toBeInTheDocument();
  });

  it("withholds code evidence until its exact snippet hash settles", async () => {
    let resolveDigest: ((value: ArrayBuffer) => void) | undefined;
    jest.spyOn(globalThis.crypto.subtle, "digest").mockImplementation(
      () =>
        new Promise<ArrayBuffer>((resolve) => {
          resolveDigest = resolve;
        })
    );

    render(
      <SoliditySourceReview source={SOURCE} feedbackSlot={<SelectionProbe />} />
    );

    expect(screen.getByTestId("integrity-status")).toHaveTextContent("pending");
    expect(screen.getByTestId("selection")).toHaveTextContent("invalid");

    resolveDigest?.(new Uint8Array(32).buffer);

    await waitFor(() => {
      expect(screen.getByTestId("integrity-status")).toHaveTextContent("ready");
      expect(
        JSON.parse(screen.getByTestId("selection").textContent ?? "")
      ).toMatchObject({
        lineStart: 2,
        lineEnd: 2,
        snippetSha256: `sha256:${"0".repeat(64)}`,
      });
    });
  });

  it("keeps a 5,335-line source to one code-region tab stop", () => {
    const lines = Array.from(
      { length: 5_335 },
      (_, index) => `uint256 value${index};`
    );
    const { container } = render(
      <SoliditySourceReview
        source={{
          ...SOURCE,
          initialLineEnd: 1,
          initialLineStart: 1,
          lines,
        }}
      />
    );

    const sourceRegion = screen.getByRole("region", {
      name: "Solidity source code",
    });
    expect(sourceRegion.querySelectorAll("li")).toHaveLength(5_335);
    expect(sourceRegion.querySelectorAll("button")).toHaveLength(0);
    expect(sourceRegion.querySelectorAll('[tabindex="0"]')).toHaveLength(0);
    expect(
      container.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
      ).length
    ).toBeLessThan(10);
  });
});
