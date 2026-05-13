import { WaveChatSubmitDropModal } from "@/components/brain/my-stream/WaveChatSubmitDropModal";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { createPortal } from "react-dom";

let waveDropCreateProps: any;
let waveDropCreateExtra: React.ReactNode | null = null;

jest.mock("@/components/waves/leaderboard/create/WaveDropCreate", () => ({
  WaveDropCreate: (props: any) => {
    waveDropCreateProps = props;
    return (
      <>
        <button data-testid="modal-create-drop" onClick={props.onSuccess}>
          create
        </button>
        {waveDropCreateExtra}
      </>
    );
  },
}));

const wave = { id: "wave-1" } as any;

function FakeChildPortal() {
  return createPortal(
    <button type="button" data-testid="fake-child-portal-button">
      fake child portal
    </button>,
    document.body
  );
}

type EscapeBlockStrategy = "stopPropagation" | "preventDefault";

function EscapeBlockingChildPortal({
  strategy,
}: {
  readonly strategy: EscapeBlockStrategy;
}) {
  return createPortal(
    <button
      type="button"
      data-testid={`fake-child-portal-${strategy}`}
      onKeyDown={(event) => {
        if (event.key !== "Escape") {
          return;
        }

        if (strategy === "stopPropagation") {
          event.stopPropagation();
          return;
        }

        event.preventDefault();
      }}
    >
      fake child portal
    </button>,
    document.body
  );
}

describe("WaveChatSubmitDropModal", () => {
  beforeEach(() => {
    waveDropCreateProps = undefined;
    waveDropCreateExtra = null;
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

    const closeButton = screen.getByLabelText("Close modal");
    closeButton.focus();
    fireEvent.keyDown(closeButton, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("closes on Escape when focus is on document.body", async () => {
    const onClose = jest.fn();

    render(
      <WaveChatSubmitDropModal
        isOpen={true}
        wave={wave}
        title="Submit drop"
        onClose={onClose}
      />
    );

    const closeButton = await screen.findByLabelText("Close modal");
    await waitFor(() => {
      expect(closeButton).toHaveFocus();
    });

    document.body.tabIndex = -1;
    document.body.focus();
    expect(document.body).toHaveFocus();

    fireEvent.keyDown(document.body, { key: "Escape" });
    document.body.removeAttribute("tabindex");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape when focus is in an outside portal that does not stop the event", async () => {
    const onClose = jest.fn();

    render(
      <>
        <WaveChatSubmitDropModal
          isOpen={true}
          wave={wave}
          title="Submit drop"
          onClose={onClose}
        />
        <FakeChildPortal />
      </>
    );

    const panel = await screen.findByTestId("chat-submit-drop-modal-panel");
    const childPortalButton = screen.getByTestId("fake-child-portal-button");

    expect(panel).not.toContainElement(childPortalButton);

    childPortalButton.focus();
    expect(childPortalButton).toHaveFocus();

    fireEvent.keyDown(childPortalButton, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("moves Tab focus back into the modal when focus starts outside the panel", async () => {
    render(
      <>
        <WaveChatSubmitDropModal
          isOpen={true}
          wave={wave}
          title="Submit drop"
          onClose={jest.fn()}
        />
        <FakeChildPortal />
      </>
    );

    const panel = await screen.findByTestId("chat-submit-drop-modal-panel");
    const closeButton = screen.getByLabelText("Close modal");
    const childPortalButton = screen.getByTestId("fake-child-portal-button");

    expect(panel).not.toContainElement(childPortalButton);

    childPortalButton.focus();
    expect(childPortalButton).toHaveFocus();

    fireEvent.keyDown(childPortalButton, { key: "Tab" });
    expect(closeButton).toHaveFocus();
    expect(panel.contains(document.activeElement)).toBe(true);
  });

  it.each(["stopPropagation", "preventDefault"] as const)(
    "does not close when a nested portal handles Escape with %s",
    async (strategy) => {
      const onClose = jest.fn();
      waveDropCreateExtra = <EscapeBlockingChildPortal strategy={strategy} />;

      render(
        <WaveChatSubmitDropModal
          isOpen={true}
          wave={wave}
          title="Submit drop"
          onClose={onClose}
        />
      );

      const childPortalButton = await screen.findByTestId(
        `fake-child-portal-${strategy}`
      );

      childPortalButton.focus();
      expect(childPortalButton).toHaveFocus();

      fireEvent.keyDown(childPortalButton, { key: "Escape" });
      expect(onClose).not.toHaveBeenCalled();
    }
  );

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
