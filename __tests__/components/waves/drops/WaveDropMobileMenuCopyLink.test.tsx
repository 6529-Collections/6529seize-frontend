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

describe("WaveDropMobileMenuCopyLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
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

      expect(screen.getAllByText("Copied!").length).toBeGreaterThan(0);
      expect(screen.getByRole("status")).toHaveTextContent("Copied!");
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

  it("keeps the menu open and shows failure feedback when clipboard write fails", async () => {
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

      expect(screen.getByText("Copy link")).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
      expect(onCopy).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
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
