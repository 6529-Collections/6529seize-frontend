import { render, screen } from "@testing-library/react";
import { ResubmitAcknowledgement } from "@/components/waves/memes/submission/ResubmitAcknowledgement";

describe("ResubmitAcknowledgement", () => {
  it("uses only the card padding above the resubmission notes", () => {
    render(
      <ResubmitAcknowledgement onAccept={jest.fn()} onCancel={jest.fn()} />
    );

    expect(screen.getByRole("list")).toHaveClass("tw-mt-0");
    expect(
      screen.getByText(/This is not editing your current submission/)
    ).toHaveClass("tw-text-pretty");

    const primary = screen.getByRole("button", {
      name: "I Understand, Start Resubmission",
    });
    const secondary = screen.getByRole("button", { name: "Cancel" });
    expect(primary).toHaveClass("tw-h-10", "tw-text-sm", "tw-bg-iron-200");
    expect(secondary).toHaveClass(
      "tw-h-10",
      "tw-text-sm",
      "tw-bg-white/[0.07]"
    );
  });
});
