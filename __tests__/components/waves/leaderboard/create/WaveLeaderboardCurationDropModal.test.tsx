import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByText("Drop Artwork")).toBeInTheDocument();

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
