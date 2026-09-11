import { render, screen } from "@testing-library/react";
import { MuseumResearchReading } from "@/components/museum/research/MuseumResearchReading";

describe("MuseumResearchReading", () => {
  it("gives the complete-record summary an accessible level-two heading", () => {
    render(
      <MuseumResearchReading
        completeMarkdown="# Complete record\n\nThe complete governed text."
        sourceCommit={"a".repeat(40)}
        sourcePath="records/research/complete.md"
        selectedTitle="Selected reading"
        selectedDescription="A selected passage."
        completeLabel="Read the complete research manuscript"
        completeDescription="Open the complete governed text."
      />
    );

    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Read the complete research manuscript",
    });
    expect(heading.tagName).toBe("SPAN");
    expect(heading).toHaveAttribute("aria-level", "2");
    expect(heading.closest("summary")).not.toBeNull();
    expect(
      screen.getByText("Open the complete governed text.")
    ).toBeInTheDocument();
  });
});
