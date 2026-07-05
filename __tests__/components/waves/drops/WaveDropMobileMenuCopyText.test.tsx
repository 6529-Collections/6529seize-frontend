import WaveDropMobileMenuCopyText from "@/components/waves/drops/WaveDropMobileMenuCopyText";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

describe("WaveDropMobileMenuCopyText", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  it("copies the drop text with author heading and closes after clipboard success", async () => {
    jest.useFakeTimers();
    const clipboardWrite = createDeferredClipboardWrite();
    writeText.mockReturnValueOnce(clipboardWrite.promise);
    const onCopy = jest.fn();

    try {
      render(<WaveDropMobileMenuCopyText drop={createDrop()} onCopy={onCopy} />);

      fireEvent.click(screen.getByRole("button", { name: "Copy text" }));

      expect(writeText).toHaveBeenCalledTimes(1);
      const payload = writeText.mock.calls[0][0] as string;
      expect(payload).toContain("alice");
      expect(payload).toContain("gm frens");
      expect(payload).not.toContain("**");
      expect(onCopy).not.toHaveBeenCalled();
      expect(screen.getByText("Copy text")).toBeInTheDocument();

      await act(async () => {
        clipboardWrite.resolve();
        await clipboardWrite.promise;
      });

      expect(screen.getByText("Copied!")).toBeInTheDocument();
      expect(onCopy).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByText("Copy text")).toBeInTheDocument();
      expect(onCopy).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it("includes attachment urls in the copied text", async () => {
    const onCopy = jest.fn();
    const drop = createDrop({
      parts: [
        {
          part_id: 1,
          content: "look at this",
          quoted_drop: null,
          media: [{ url: "https://media.example/img.png" }],
        },
      ],
    });

    render(<WaveDropMobileMenuCopyText drop={drop} onCopy={onCopy} />);

    await userEvent.click(screen.getByRole("button", { name: "Copy text" }));

    const payload = writeText.mock.calls[0][0] as string;
    expect(payload).toContain("look at this");
    expect(payload).toContain("https://media.example/img.png");
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
  });

  it("does not bubble copy clicks to parent cards", async () => {
    const onCopy = jest.fn();
    const parentClick = jest.fn();

    render(
      <div onClick={parentClick}>
        <WaveDropMobileMenuCopyText drop={createDrop()} onCopy={onCopy} />
      </div>
    );

    await userEvent.click(screen.getByRole("button", { name: "Copy text" }));

    expect(writeText).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
    expect(parentClick).not.toHaveBeenCalled();
  });

  it("closes the menu once when clipboard write fails", async () => {
    const clipboardWrite = createDeferredClipboardWrite();
    writeText.mockReturnValueOnce(clipboardWrite.promise);
    const onCopy = jest.fn();

    render(<WaveDropMobileMenuCopyText drop={createDrop()} onCopy={onCopy} />);

    await userEvent.click(screen.getByRole("button", { name: "Copy text" }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(onCopy).not.toHaveBeenCalled();

    await act(async () => {
      clipboardWrite.reject(new Error("Clipboard write failed"));
      await clipboardWrite.promise.catch(() => undefined);
    });

    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Copy text")).toBeInTheDocument();
  });

  it("disables copy for temporary drops", async () => {
    const onCopy = jest.fn();

    render(
      <WaveDropMobileMenuCopyText
        drop={createDrop({ id: "temp-1" })}
        onCopy={onCopy}
      />
    );

    const button = screen.getByRole("button", { name: "Copy text" });

    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(writeText).not.toHaveBeenCalled();
    expect(onCopy).not.toHaveBeenCalled();
  });
});
