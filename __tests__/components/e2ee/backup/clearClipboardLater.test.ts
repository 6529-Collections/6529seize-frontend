import { clearClipboardLater } from "@/components/e2ee/backup/clearClipboardLater";

describe("clearClipboardLater", () => {
  const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  let contents = "";
  const clipboard = {
    readText: jest.fn(async () => contents),
    writeText: jest.fn(async (value: string) => {
      contents = value;
    }),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: clipboard,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    if (original) {
      Object.defineProperty(navigator, "clipboard", original);
    } else {
      delete (navigator as { clipboard?: unknown }).clipboard;
    }
  });

  it("clears the code after the delay when the clipboard still holds it", async () => {
    contents = "CODE-1234";
    clearClipboardLater("CODE-1234", 1000);
    await jest.advanceTimersByTimeAsync(999);
    expect(contents).toBe("CODE-1234");
    await jest.advanceTimersByTimeAsync(1);
    expect(contents).toBe("");
  });

  it("leaves something copied since in place", async () => {
    contents = "something else";
    clearClipboardLater("CODE-1234", 1000);
    await jest.advanceTimersByTimeAsync(1000);
    expect(contents).toBe("something else");
    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  it("fails silently where reading the clipboard is not allowed", async () => {
    clipboard.readText.mockRejectedValueOnce(new Error("NotAllowedError"));
    contents = "CODE-1234";
    clearClipboardLater("CODE-1234", 1000);
    await jest.advanceTimersByTimeAsync(1000);
    expect(contents).toBe("CODE-1234");
  });
});
