import { act, render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { WalletAddress } from "@/components/address/WalletAddress";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

const formatAddress = jest.fn((v: string) => `fmt-${v}`);

jest.mock("@/helpers/Helpers", () => ({
  containsEmojis: jest.fn((s: string) => s.includes("U+")),
  formatAddress: (v: string) => formatAddress(v),
}));

const COPY_OPTIONS_LABEL = "Copy wallet options";
const COPY_ENS_LABEL = "Copy ENS name";
const COPY_WALLET_LABEL = "Copy wallet address";
const COPIED_LABEL = "Copied";

let writeTextMock: jest.Mock;

function installClipboardMock() {
  Object.defineProperty(globalThis.navigator, "clipboard", {
    configurable: true,
    value: { writeText: writeTextMock },
  });
}

function setupUser() {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  installClipboardMock();
  return user;
}

async function flushAsyncClipboard() {
  await act(async () => {
    await Promise.resolve();
  });
}

function flushCopiedResetTimer() {
  act(() => {
    jest.advanceTimersByTime(1000);
  });
}

describe("WalletAddress", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    writeTextMock = jest.fn().mockResolvedValue(undefined);
    installClipboardMock();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders address link without copy", () => {
    render(<WalletAddress wallet="0xabc" display="display" hideCopy />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/display");
    expect(link).toHaveTextContent("fmt-display");
  });

  it("renders link with query when requested", () => {
    render(<WalletAddress wallet="0xabc" display="Bob" setLinkQueryAddress />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/Bob?address=0xabc");
  });

  it("copies wallet address on click with userEvent", async () => {
    const user = setupUser();
    render(<WalletAddress wallet="0xabc" display="display" />);
    await user.click(screen.getByRole("button", { name: COPY_WALLET_LABEL }));
    await flushAsyncClipboard();
    expect(writeTextMock).toHaveBeenCalledWith("0xabc");
    expect(screen.getByRole("status")).toHaveTextContent(COPIED_LABEL);
    flushCopiedResetTimer();
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("copies address when toggle clicked with fireEvent", async () => {
    render(<WalletAddress wallet="0xabc" display="Bob" />);
    fireEvent.click(screen.getByRole("button", { name: COPY_WALLET_LABEL }));
    await flushAsyncClipboard();
    expect(writeTextMock.mock.calls[0][0]).toBe("0xabc");
    flushCopiedResetTimer();
  });

  it("parses emoji display names", () => {
    render(<WalletAddress wallet="0x1" display="U+1F60A" hideCopy />);
    expect(screen.getByRole("link")).toHaveTextContent(
      String.fromCodePoint(0x1f60a)
    );
  });

  it("keeps tooltip ids stable across rerenders", () => {
    const { rerender } = render(
      <WalletAddress wallet="0xabc" display="display" />
    );
    const copyButton = screen.getByRole("button", {
      name: COPY_WALLET_LABEL,
    });
    const tooltipId = copyButton.getAttribute("data-tooltip-id");

    rerender(<WalletAddress wallet="0xabc" display="display" />);

    expect(
      screen
        .getByRole("button", { name: COPY_WALLET_LABEL })
        .getAttribute("data-tooltip-id")
    ).toBe(tooltipId);
  });

  it("renders accessible ENS copy choices", async () => {
    const user = setupUser();
    render(
      <WalletAddress
        wallet="0xabc"
        display={undefined}
        displayEns="vitalik.eth"
      />
    );

    const copyOptions = screen.getByLabelText(COPY_OPTIONS_LABEL);
    expect(copyOptions.tagName.toLowerCase()).toBe("summary");

    await user.click(copyOptions);
    fireEvent.click(screen.getByLabelText(COPY_ENS_LABEL));
    await flushAsyncClipboard();

    expect(writeTextMock).toHaveBeenCalledWith("vitalik.eth");
    expect(screen.getByLabelText(COPY_WALLET_LABEL)).toBeInTheDocument();
    flushCopiedResetTimer();
  });

  it("renders without copy controls when clipboard is unavailable", () => {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });

    render(<WalletAddress wallet="0xabc" display="display" />);

    expect(
      screen.queryByRole("button", { name: COPY_WALLET_LABEL })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveTextContent("fmt-display");
  });

  it("does not emit max update depth errors for copyable addresses", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      const { rerender } = render(
        <WalletAddress wallet="0xabc" display="display" />
      );

      rerender(<WalletAddress wallet="0xabc" display="display" />);
      fireEvent.click(screen.getByRole("button", { name: COPY_WALLET_LABEL }));
      await flushAsyncClipboard();

      const maxDepthErrors = errorSpy.mock.calls.filter(([message]) =>
        String(message).includes("Maximum update depth exceeded")
      );

      expect(maxDepthErrors).toHaveLength(0);
      flushCopiedResetTimer();
    } finally {
      errorSpy.mockRestore();
    }
  });
});
