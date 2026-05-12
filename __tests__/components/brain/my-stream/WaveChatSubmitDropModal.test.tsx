import { WaveChatSubmitDropModal } from "@/components/brain/my-stream/WaveChatSubmitDropModal";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

let waveDropCreateProps: any;

jest.mock("@/components/waves/leaderboard/create/WaveDropCreate", () => ({
  WaveDropCreate: (props: any) => {
    waveDropCreateProps = props;
    return (
      <button data-testid="modal-create-drop" onClick={props.onSuccess}>
        create
      </button>
    );
  },
}));

const wave = { id: "wave-1" } as any;

describe("WaveChatSubmitDropModal", () => {
  beforeEach(() => {
    waveDropCreateProps = undefined;
  });

  it("does not render when closed", () => {
    render(
      <WaveChatSubmitDropModal
        isOpen={false}
        wave={wave}
        title="Submit drop"
        onClose={jest.fn()}
      />
    );

    expect(
      screen.queryByTestId("chat-submit-drop-modal")
    ).not.toBeInTheDocument();
  });

  it("renders with the modal title and drop creator", async () => {
    render(
      <WaveChatSubmitDropModal
        isOpen={true}
        wave={wave}
        title="Submit drop"
        initialCurationUrl="https://example.com/art"
        onClose={jest.fn()}
      />
    );

    expect(
      await screen.findByTestId("chat-submit-drop-modal")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Submit drop" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("modal-create-drop")).toBeInTheDocument();
    expect(waveDropCreateProps.isModalContent).toBe(true);
    expect(waveDropCreateProps.initialCurationUrl).toBe(
      "https://example.com/art"
    );
    expect(waveDropCreateProps.onExitFixedDropMode).toBeUndefined();
  });

  it("closes from backdrop, close button, and escape key", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <WaveChatSubmitDropModal
        isOpen={true}
        wave={wave}
        title="Submit drop"
        onClose={onClose}
      />
    );

    await screen.findByTestId("chat-submit-drop-modal");

    await user.click(screen.getByLabelText("Close submit drop modal"));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByLabelText("Close modal"));
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("moves initial focus into the modal", async () => {
    render(
      <WaveChatSubmitDropModal
        isOpen={true}
        wave={wave}
        title="Submit drop"
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
      <WaveChatSubmitDropModal
        isOpen={true}
        wave={wave}
        title="Submit drop"
        onClose={jest.fn()}
      />
    );

    const panel = await screen.findByTestId("chat-submit-drop-modal-panel");
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

  it("restores focus to the opener when closed", async () => {
    const { rerender } = render(
      <>
        <button type="button" data-testid="opener">
          Open modal
        </button>
        <WaveChatSubmitDropModal
          isOpen={false}
          wave={wave}
          title="Submit drop"
          onClose={jest.fn()}
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
        <WaveChatSubmitDropModal
          isOpen={true}
          wave={wave}
          title="Submit drop"
          onClose={jest.fn()}
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
        <WaveChatSubmitDropModal
          isOpen={false}
          wave={wave}
          title="Submit drop"
          onClose={jest.fn()}
        />
      </>
    );

    await waitFor(() => {
      expect(opener).toHaveFocus();
    });
  });

  it("locks body scroll while open and restores it when closed", () => {
    const originalOverflow = "scroll";
    document.body.style.overflow = originalOverflow;

    const { rerender } = render(
      <WaveChatSubmitDropModal
        isOpen={true}
        wave={wave}
        title="Submit drop"
        onClose={jest.fn()}
      />
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <WaveChatSubmitDropModal
        isOpen={false}
        wave={wave}
        title="Submit drop"
        onClose={jest.fn()}
      />
    );

    expect(document.body.style.overflow).toBe(originalOverflow);
  });

  it("closes after successful submission", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <WaveChatSubmitDropModal
        isOpen={true}
        wave={wave}
        title="Submit drop"
        onClose={onClose}
      />
    );

    await user.click(await screen.findByTestId("modal-create-drop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
