import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("calls onClose on Escape when open", async () => {
    const onClose = jest.fn();
    render(
      <MemesArtSubmissionModal isOpen={true} wave={wave} onClose={onClose} />
    );

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("calls onClose when backdrop clicked", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(
      <MemesArtSubmissionModal isOpen={true} wave={wave} onClose={onClose} />
    );
    await user.click(screen.getByTestId("memes-art-submission-modal-backdrop"));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders above the mobile drop detail layer with an accessible name", () => {
    render(
      <MemesArtSubmissionModal isOpen={true} wave={wave} onClose={jest.fn()} />
    );

    expect(
      screen.getByRole("dialog", { name: "Submit Work to The Memes" })
    ).toHaveClass("tw-z-[1020]");
    expect(
      within(screen.getByTestId("memes-art-submission-modal-panel")).getByText(
        "Submit Work to The Memes"
      )
    ).toBeInTheDocument();
  });

  it("uses keyboard-aware mobile viewport height constraints", () => {
    render(
      <MemesArtSubmissionModal isOpen={true} wave={wave} onClose={jest.fn()} />
    );
    const panel = screen.getByTestId("memes-art-submission-modal-panel");
    expect(panel).toHaveClass(
      "tw-h-[calc(100dvh-var(--native-keyboard-inset-bottom,0px))]"
    );
    expect(panel).toHaveClass(
      "tw-max-h-[calc(100dvh-var(--native-keyboard-inset-bottom,0px))]"
    );
  });
});
