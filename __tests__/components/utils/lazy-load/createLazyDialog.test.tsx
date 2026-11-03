import { createLazyDialog } from "@/components/utils/lazy-load/createLazyDialog";
import { act, fireEvent, render, screen } from "@testing-library/react";

type DialogProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
};

const mountedDialogs: string[] = [];

function TestDialog({ isOpen, onClose, title }: DialogProps) {
  mountedDialogs.push(title);
  return isOpen ? (
    <div role="dialog" aria-label={title}>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  ) : (
    <div data-testid="closed-dialog" />
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup() {
  const gate = deferred<{ default: typeof TestDialog }>();
  const importer = jest.fn(() => gate.promise);
  const lazy = createLazyDialog<DialogProps>(importer);
  return { gate, importer, lazy };
}

beforeEach(() => {
  mountedDialogs.length = 0;
});

describe("createLazyDialog", () => {
  it("neither fetches nor mounts the dialog before the first open", () => {
    const { importer, lazy } = setup();
    const { container } = render(
      <lazy.Dialog isOpen={false} onClose={jest.fn()} title="Create" />
    );

    expect(importer).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });

  it("loads on the first open and stays mounted after closing", async () => {
    const { gate, importer, lazy } = setup();
    const onClose = jest.fn();
    const { rerender } = render(
      <lazy.Dialog isOpen={false} onClose={onClose} title="Create" />
    );

    rerender(<lazy.Dialog isOpen onClose={onClose} title="Create" />);
    expect(importer).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await act(async () => {
      gate.resolve({ default: TestDialog });
      await gate.promise;
    });
    expect(screen.getByRole("dialog", { name: "Create" })).toBeInTheDocument();

    // Closing keeps the dialog mounted, as a static import did, so its own
    // close transition and state survive.
    rerender(<lazy.Dialog isOpen={false} onClose={onClose} title="Create" />);
    expect(screen.getByTestId("closed-dialog")).toBeInTheDocument();
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it("renders an already cached dialog in the same commit as the open", async () => {
    const { gate, lazy } = setup();
    lazy.preload();
    await act(async () => {
      gate.resolve({ default: TestDialog });
      await gate.promise;
    });

    render(<lazy.Dialog isOpen onClose={jest.fn()} title="Submit" />);
    expect(screen.getByRole("dialog", { name: "Submit" })).toBeInTheDocument();
    expect(mountedDialogs).toEqual(["Submit"]);
  });

  it("closes on Escape while the chunk is still loading", () => {
    const { lazy } = setup();
    const onClose = jest.fn();
    render(<lazy.Dialog isOpen onClose={onClose} title="Create" />);

    fireEvent.keyDown(globalThis.window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes the pending dialog when its chunk fails to load", async () => {
    const { gate, lazy } = setup();
    const onClose = jest.fn();
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    try {
      render(<lazy.Dialog isOpen onClose={onClose} title="Create" />);
      await act(async () => {
        gate.reject(new Error("Loading chunk failed"));
        await gate.promise.catch(() => undefined);
      });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });
});
