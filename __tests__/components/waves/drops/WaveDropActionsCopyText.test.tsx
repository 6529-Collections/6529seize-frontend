import WaveDropActionsCopyText from "@/components/waves/drops/WaveDropActionsCopyText";
import { buildDropClipboardText } from "@/helpers/waves/drop-clipboard.helpers";
import { ApiDropType } from "@/generated/models/ApiDropType";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const writeText = jest.fn().mockResolvedValue(undefined);

const createDeferredClipboardWrite = () => {
  let resolve!: () => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const createDrop = (overrides: Record<string, unknown> = {}): any => ({
  id: "d1",
  serial_no: 5,
  drop_type: ApiDropType.Chat,
  author: { handle: "alice" },
  created_at: 1735689600000,
  wave: { id: "w1", name: "Test Wave" },
  parts: [
    {
      part_id: 1,
      content: "gm **frens**",
      quoted_drop: null,
      media: [],
    },
  ],
  metadata: [],
  reply_to: null,
  ...overrides,
});

describe("WaveDropActionsCopyText", () => {
  const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(
    navigator,
    "clipboard"
  );

  beforeEach(() => {
    jest.clearAllMocks();
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    if (originalClipboardDescriptor) {
      Object.defineProperty(
        navigator,
        "clipboard",
        originalClipboardDescriptor
      );
    } else {
      delete (navigator as { clipboard?: unknown }).clipboard;
    }
  });

  it("copies the drop clipboard text and notifies the menu on success", async () => {
    const onCopy = jest.fn();
    const drop = createDrop();

    render(<WaveDropActionsCopyText drop={drop} onCopy={onCopy} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy text" }));

    expect(writeText).toHaveBeenCalledWith(
      buildDropClipboardText(drop, "en-US")
    );
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
  });

  it("keeps the dropdown open and shows failure feedback when clipboard write fails", async () => {
    jest.useFakeTimers();
    const clipboardWrite = createDeferredClipboardWrite();
    writeText.mockReturnValueOnce(clipboardWrite.promise);
    const onCopy = jest.fn();

    try {
      render(<WaveDropActionsCopyText drop={createDrop()} onCopy={onCopy} />);

      fireEvent.click(screen.getByRole("button", { name: "Copy text" }));

      expect(writeText).toHaveBeenCalledTimes(1);

      await act(async () => {
        clipboardWrite.reject(new Error("Clipboard write failed"));
        await clipboardWrite.promise.catch(() => undefined);
      });

      expect(onCopy).not.toHaveBeenCalled();
      expect(screen.getAllByText("Copy failed").length).toBeGreaterThan(0);
      expect(screen.getByRole("status")).toHaveTextContent("Copy failed");

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByText("Copy text")).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
      expect(onCopy).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it("shows failure feedback without closing the dropdown when the clipboard API is unavailable", () => {
    jest.useFakeTimers();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    const onCopy = jest.fn();

    try {
      render(<WaveDropActionsCopyText drop={createDrop()} onCopy={onCopy} />);

      fireEvent.click(screen.getByRole("button", { name: "Copy text" }));

      expect(writeText).not.toHaveBeenCalled();
      expect(onCopy).not.toHaveBeenCalled();
      expect(screen.getAllByText("Copy failed").length).toBeGreaterThan(0);
      expect(screen.getByRole("status")).toHaveTextContent("Copy failed");

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByText("Copy text")).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
      expect(onCopy).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it("is disabled for temporary drops and copies nothing", () => {
    const onCopy = jest.fn();

    render(
      <WaveDropActionsCopyText
        drop={createDrop({ id: "temp-123" })}
        onCopy={onCopy}
      />
    );

    const button = screen.getByRole("button", { name: "Copy text" });
    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(writeText).not.toHaveBeenCalled();
    expect(onCopy).not.toHaveBeenCalled();
  });
});
