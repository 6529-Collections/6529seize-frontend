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
  generatedSnippetSha256: `sha256:${"2".repeat(64)}`,
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
  it("feeds the exact generated declaration selection to feedback children", () => {
    render(
      <SoliditySourceReview source={SOURCE} feedbackSlot={<SelectionProbe />} />
    );

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
      snippetSha256: SOURCE.generatedSnippetSha256,
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
