import WaveDropMobileMenuCopyLink from "@/components/waves/drops/WaveDropMobileMenuCopyLink";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockIsMemesWave = jest.fn();
const mockIsQuorumWave = jest.fn();
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

jest.mock("@/config/env", () => ({
  publicEnv: {
    BASE_ENDPOINT: "https://base",
  },
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({
    isMemesWave: mockIsMemesWave,
    isQuorumWave: mockIsQuorumWave,
  }),
}));

Object.defineProperty(globalThis.navigator, "clipboard", {
  configurable: true,
  value: { writeText },
});

describe("WaveDropMobileMenuCopyLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    mockIsMemesWave.mockReturnValue(false);
    mockIsQuorumWave.mockReturnValue(false);
  });

  it("closes after clipboard success and only uses the timer to reset copied state", async () => {
    jest.useFakeTimers();
    const clipboardWrite = createDeferredClipboardWrite();
    writeText.mockReturnValueOnce(clipboardWrite.promise);
    const onCopy = jest.fn();
    const drop: any = {
      id: "d1",
      wave: { id: "w1" },
      serial_no: 5,
      drop_type: ApiDropType.Chat,
    };

    try {
      render(<WaveDropMobileMenuCopyLink drop={drop} onCopy={onCopy} />);

      fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

      expect(writeText).toHaveBeenCalledWith(
        "https://base/waves/w1?serialNo=5"
      );
      expect(onCopy).not.toHaveBeenCalled();
      expect(screen.getByText("Copy link")).toBeInTheDocument();

      await act(async () => {
        clipboardWrite.resolve();
        await clipboardWrite.promise;
      });

      expect(screen.getByText("Copied!")).toBeInTheDocument();
      expect(onCopy).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByText("Copy link")).toBeInTheDocument();
      expect(onCopy).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it("copies canonical drop links for memes submissions", async () => {
    mockIsMemesWave.mockReturnValue(true);
    const onCopy = jest.fn();
    const drop: any = {
      id: "d1",
      wave: { id: "w1" },
      serial_no: 5,
      drop_type: ApiDropType.Participatory,
    };

    render(<WaveDropMobileMenuCopyLink drop={drop} onCopy={onCopy} />);

    await userEvent.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith("https://base/waves/w1?drop=d1");
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
  });

  it("does not bubble copy clicks to parent cards", async () => {
    const onCopy = jest.fn();
    const parentClick = jest.fn();
    const drop: any = {
      id: "d1",
      wave: { id: "w1" },
      serial_no: 5,
      drop_type: ApiDropType.Chat,
    };

    render(
      <div onClick={parentClick}>
        <WaveDropMobileMenuCopyLink drop={drop} onCopy={onCopy} />
      </div>
    );

    await userEvent.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith("https://base/waves/w1?serialNo=5");
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
    expect(parentClick).not.toHaveBeenCalled();
  });

  it("closes the menu once when clipboard write fails", async () => {
    const clipboardWrite = createDeferredClipboardWrite();
    writeText.mockReturnValueOnce(clipboardWrite.promise);
    const onCopy = jest.fn();
    const drop: any = {
      id: "d1",
      wave: { id: "w1" },
      serial_no: 5,
      drop_type: ApiDropType.Chat,
    };

    render(<WaveDropMobileMenuCopyLink drop={drop} onCopy={onCopy} />);

    await userEvent.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith("https://base/waves/w1?serialNo=5");
    expect(onCopy).not.toHaveBeenCalled();

    await act(async () => {
      clipboardWrite.reject(new Error("Clipboard write failed"));
      await clipboardWrite.promise.catch(() => undefined);
    });

    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Copy link")).toBeInTheDocument();
  });

  it("disables copy for temporary drops", async () => {
    const onCopy = jest.fn();
    const drop: any = {
      id: "temp-1",
      wave: { id: "w1" },
      serial_no: 5,
      drop_type: ApiDropType.Chat,
    };

    render(<WaveDropMobileMenuCopyLink drop={drop} onCopy={onCopy} />);

    const button = screen.getByRole("button", { name: "Copy link" });

    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(writeText).not.toHaveBeenCalled();
    expect(onCopy).not.toHaveBeenCalled();
  });
});
