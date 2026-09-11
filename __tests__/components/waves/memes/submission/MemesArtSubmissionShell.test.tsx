import { fireEvent, render, screen } from "@testing-library/react";
import { MemesArtSubmissionShell } from "@/components/waves/memes/submission/MemesArtSubmissionShell";

describe("MemesArtSubmissionShell", () => {
  it("keeps the close action clear of a wrapping title", () => {
    const onClose = jest.fn();

    render(
      <MemesArtSubmissionShell
        title="Resubmit Work to The Memes"
        description="Supporting copy for the resubmission flow."
        onClose={onClose}
      >
        <div>Submission content</div>
      </MemesArtSubmissionShell>
    );

    const title = screen.getByRole("heading", {
      name: "Resubmit Work to The Memes",
      level: 3,
    });
    expect(title.parentElement).toHaveClass(
      "tw-grid-cols-[minmax(0,1fr)_auto]"
    );
    expect(title).toHaveClass(
      "tw-min-w-0",
      "tw-max-w-[21ch]",
      "tw-break-words",
      "tw-text-pretty",
      "sm:tw-max-w-none"
    );

    const description = screen.getByText(
      "Supporting copy for the resubmission flow."
    );
    expect(description).toHaveClass("tw-text-pretty");

    const closeButton = screen.getByRole("button", { name: "Close modal" });
    expect(closeButton).toHaveClass("tw-self-start");
    expect(closeButton).toHaveAttribute("data-autofocus");
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
