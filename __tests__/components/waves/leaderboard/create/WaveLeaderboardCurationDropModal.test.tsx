import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaveLeaderboardCurationDropModal } from "@/components/waves/leaderboard/create/WaveLeaderboardCurationDropModal";

jest.mock("@/components/waves/leaderboard/create/WaveDropCreate", () => ({
  WaveDropCreate: (props: any) => (
    <button data-testid="modal-create-drop" onClick={props.onSuccess} />
  ),
}));

const wave = { id: "wave-1" } as any;

describe("WaveLeaderboardCurationDropModal", () => {
  it("does not render when closed", () => {
    render(
      <WaveLeaderboardCurationDropModal
        isOpen={false}
        wave={wave}
        onClose={jest.fn()}
      />
    );

    expect(screen.queryByTestId("curation-drop-modal")).not.toBeInTheDocument();
  });

  it("renders and closes from backdrop and close button", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <WaveLeaderboardCurationDropModal
        isOpen={true}
        wave={wave}
        onClose={onClose}
      />
    );

    expect(
      await screen.findByTestId("curation-drop-modal")
    ).toBeInTheDocument();
    const panel = screen.getByTestId("curation-drop-modal-panel");
    expect(panel.className).toContain("tw-rounded-xl");
    expect(panel.className).toContain("tw-border-iron-800");

    const heading = screen.getByRole("heading", { name: "Drop Artwork" });
    expect(heading).toHaveClass("tw-text-2xl");

    await user.click(screen.getByLabelText("Close drop artwork modal"));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByLabelText("Close modal"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("closes on escape key", async () => {
    const onClose = jest.fn();

    render(
      <WaveLeaderboardCurationDropModal
        isOpen={true}
        wave={wave}
        onClose={onClose}
      />
    );

    await screen.findByTestId("curation-drop-modal");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("moves initial focus to the close button when opened", async () => {
    render(
      <WaveLeaderboardCurationDropModal
        isOpen={true}
        wave={wave}
        onClose={jest.fn()}
      />
    );

    const closeButton = await screen.findByLabelText("Close modal");
    await waitFor(() => {
      expect(closeButton).toHaveFocus();
    });
  });

  it("traps tab navigation inside the modal panel", async () => {
    const user = userEvent.setup();

    render(
      <WaveLeaderboardCurationDropModal
        isOpen={true}
        wave={wave}
        onClose={jest.fn()}
      />
    );

    const panel = await screen.findByTestId("curation-drop-modal-panel");
    const closeButton = screen.getByLabelText("Close modal");
    const createButton = screen.getByTestId("modal-create-drop");

    await waitFor(() => {
      expect(closeButton).toHaveFocus();
    });

    await user.tab();
    expect(createButton).toHaveFocus();
    expect(panel.contains(document.activeElement)).toBe(true);

    await user.tab();
    expect(closeButton).toHaveFocus();
    expect(panel.contains(document.activeElement)).toBe(true);

    await user.tab({ shift: true });
    expect(createButton).toHaveFocus();
    expect(panel.contains(document.activeElement)).toBe(true);
  });

  it("restores focus to the previously focused element when closed", async () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <>
        <button type="button" data-testid="opener">
          Open modal
        </button>
        <WaveLeaderboardCurationDropModal
          isOpen={false}
          wave={wave}
          onClose={onClose}
        />
      </>
    );

    const opener = screen.getByTestId("opener");
    opener.focus();
    expect(opener).toHaveFocus();

    rerender(
      <>
        <button type="button" data-testid="opener">
          Open modal
        </button>
        <WaveLeaderboardCurationDropModal
          isOpen={true}
          wave={wave}
          onClose={onClose}
        />
      </>
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Close modal")).toHaveFocus();
    });

    rerender(
      <>
        <button type="button" data-testid="opener">
          Open modal
        </button>
        <WaveLeaderboardCurationDropModal
          isOpen={false}
          wave={wave}
          onClose={onClose}
        />
      </>
    );

    await waitFor(() => {
      expect(opener).toHaveFocus();
    });
  });

  it("locks body scroll while open and restores it when closed", () => {
    const onClose = jest.fn();
    const originalOverflow = "scroll";
    document.body.style.overflow = originalOverflow;

    const { rerender } = render(
      <WaveLeaderboardCurationDropModal
        isOpen={true}
        wave={wave}
        onClose={onClose}
      />
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <WaveLeaderboardCurationDropModal
        isOpen={false}
        wave={wave}
        onClose={onClose}
      />
    );

    expect(document.body.style.overflow).toBe(originalOverflow);
  });

  it("closes after successful submission", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <WaveLeaderboardCurationDropModal
        isOpen={true}
        wave={wave}
        onClose={onClose}
      />
    );

    await user.click(await screen.findByTestId("modal-create-drop"));
    expect(onClose).toHaveBeenCalled();
  });
});
