import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LazyHeaderConnectModal } from "@/components/header/share/header-share/lazyHeaderQRModal";

// The loader caches its module for the life of this file, so the cases run
// in order: a failed chunk first (nothing cached), then a successful load.
const MODAL_MODULE = "@/components/header/share/header-share/HeaderQRModal";

function MockConnectModal({ show }: { readonly show: boolean }) {
  return show ? <div role="dialog" aria-label="Connect Device" /> : null;
}

describe("LazyHeaderConnectModal", () => {
  afterEach(() => {
    jest.dontMock(MODAL_MODULE);
  });

  it("closes the pending modal when its chunk fails to load", async () => {
    jest.doMock(MODAL_MODULE, () => {
      throw new Error("Loading chunk failed");
    });
    const onClose = jest.fn();
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    try {
      render(<LazyHeaderConnectModal show={true} onClose={onClose} />);

      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(consoleError).toHaveBeenCalledWith(
        "Failed to load a lazy component",
        expect.any(Error)
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("closes on Escape while loading, then opens once the chunk resolves", async () => {
    jest.doMock(MODAL_MODULE, () => ({
      HeaderConnectModal: MockConnectModal,
      HeaderPageShareModal: MockConnectModal,
    }));
    const onClose = jest.fn();
    const { rerender } = render(
      <LazyHeaderConnectModal show={true} onClose={onClose} />
    );

    // The chunk has not resolved yet: no dialog, and Escape still closes.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.keyDown(globalThis.window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    expect(
      await screen.findByRole("dialog", { name: "Connect Device" })
    ).toBeInTheDocument();

    // Once loaded, the modal owns Escape and closing is the caller's call.
    fireEvent.keyDown(globalThis.window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(<LazyHeaderConnectModal show={false} onClose={onClose} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
