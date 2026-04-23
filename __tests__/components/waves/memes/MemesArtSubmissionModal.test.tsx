import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import MemesArtSubmissionModal from "@/components/waves/memes/MemesArtSubmissionModal";

jest.mock(
  "@/components/waves/memes/submission/MemesArtSubmissionContainer",
  () => ({
    __esModule: true,
    default: () => <div data-testid="container" />,
  })
);

describe("MemesArtSubmissionModal", () => {
  const wave = { id: "w", participation: { terms: "" } } as any;

  it("renders nothing when closed", () => {
    const { container } = render(
      <MemesArtSubmissionModal isOpen={false} wave={wave} onClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not call onClose on Escape when closed", () => {
    const onClose = jest.fn();
    render(
      <MemesArtSubmissionModal isOpen={false} wave={wave} onClose={onClose} />
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose on Escape when open", () => {
    const onClose = jest.fn();
    render(
      <MemesArtSubmissionModal isOpen={true} wave={wave} onClose={onClose} />
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop clicked", () => {
    const onClose = jest.fn();
    render(
      <MemesArtSubmissionModal isOpen={true} wave={wave} onClose={onClose} />
    );
    const overlay = document.querySelector(".tailwind-scope") as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it("uses full mobile viewport height constraints", () => {
    render(
      <MemesArtSubmissionModal isOpen={true} wave={wave} onClose={jest.fn()} />
    );
    const panel = screen.getByTestId("memes-art-submission-modal-panel");
    expect(panel).toHaveClass("tw-h-[100dvh]");
    expect(panel).toHaveClass("tw-max-h-[100dvh]");
  });
});
