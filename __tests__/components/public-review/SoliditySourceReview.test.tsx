import { createHash, webcrypto } from "node:crypto";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  SoliditySourceReview,
  usePublicReviewCodeSelection,
} from "@/components/public-review/SoliditySourceReview";

function SelectionProbe() {
  const { selection } = usePublicReviewCodeSelection();
  return (
    <output data-testid="selection">
      {selection ? JSON.stringify(selection) : "invalid"}
    </output>
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

  it("supports keyboard-equivalent numeric ranges and line-button selection", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Select line 3" }));
    expect(
      JSON.parse(screen.getByTestId("selection").textContent ?? "")
    ).toMatchObject({
      lineStart: 3,
      lineEnd: 3,
    });
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

    expect(
      screen.getByRole("button", { name: "Select line 201" })
    ).toBeInTheDocument();
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

  it("moves focus to the structured feedback slot", () => {
    render(
      <SoliditySourceReview
        source={SOURCE}
        feedbackSlot={
          <div>
            <textarea aria-label="Feedback comment" />
            <SelectionProbe />
          </div>
        }
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Comment on selected lines" })
    );
    expect(screen.getByLabelText("Feedback comment")).toHaveFocus();
  });
});
