import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ErrorComponent from "@/components/error/Error";

const setTitleMock = jest.fn();
const copyToClipboardMock = jest.fn();
let mockSearchParams: URLSearchParams;

jest.mock("@/contexts/TitleContext", () => ({
  __esModule: true,
  useTitle: () => ({
    setTitle: setTitleMock,
  }),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  useSearchParams: () => mockSearchParams,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ unoptimized, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt="SummerGlasses" />;
  },
}));

jest.mock("react-use", () => ({
  __esModule: true,
  useCopyToClipboard: () => [null, copyToClipboardMock],
}));

jest.mock("framer-motion", () => ({
  __esModule: true,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe("ErrorComponent", () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
    setTitleMock.mockClear();
    copyToClipboardMock.mockClear();
    mockSearchParams = new URLSearchParams();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("sets the error page title and shows contact email", () => {
    render(<ErrorComponent />);

    expect(setTitleMock).toHaveBeenCalledWith("6529 Error");

    const supportLink = screen.getByRole("link", { name: "support@6529.io" });
    expect(supportLink).toHaveAttribute("href", "mailto:support@6529.io");
  });

  it("reveals a provided stack trace when toggled", () => {
    render(<ErrorComponent stackTrace="Error: stack" />);

    const toggleButton = screen.getByRole("button", {
      name: /show stacktrace/i,
    });
    fireEvent.click(toggleButton);

    expect(screen.getByText("Error: stack")).toBeInTheDocument();
  });

  it("uses the stack trace from the URL when no prop is provided", () => {
    mockSearchParams = new URLSearchParams("stack=FromQuery");

    render(<ErrorComponent />);

    fireEvent.click(screen.getByRole("button", { name: /show stacktrace/i }));

    expect(screen.getByText("FromQuery")).toBeInTheDocument();
  });

  it("does not show stack trace section when no stack trace or digest is provided", () => {
    render(<ErrorComponent />);

    expect(
      screen.queryByRole("button", { name: /show stacktrace/i })
    ).not.toBeInTheDocument();
  });

  it("shows stack trace section when digest is provided even without stack trace", () => {
    render(<ErrorComponent digest="123456" />);

    expect(
      screen.getByRole("button", { name: /show stacktrace/i })
    ).toBeInTheDocument();
  });

  it("toggles stack trace visibility", () => {
    render(<ErrorComponent stackTrace="Error: test" />);

    const toggleButton = screen.getByRole("button", {
      name: /show stacktrace/i,
    });
    expect(screen.queryByText("Error: test")).not.toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(screen.getByText("Error: test")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /hide stacktrace/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /hide stacktrace/i }));
    expect(screen.queryByText("Error: test")).not.toBeInTheDocument();
  });

  it("shows copy button when stack trace is expanded", () => {
    render(<ErrorComponent stackTrace="Error: test" />);

    const toggleButton = screen.getByRole("button", {
      name: /show stacktrace/i,
    });
    expect(screen.queryByRole("button", { name: /copy/i })).not.toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
  });

  it("copies stack trace to clipboard when copy button is clicked", () => {
    render(<ErrorComponent stackTrace="Error: test" />);

    fireEvent.click(screen.getByRole("button", { name: /show stacktrace/i }));
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    expect(copyToClipboardMock).toHaveBeenCalledWith("Error: test");
  });

  it("includes digest in copied text when digest is provided", () => {
    render(<ErrorComponent stackTrace="Error: test" digest="123456" />);

    fireEvent.click(screen.getByRole("button", { name: /show stacktrace/i }));
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    expect(copyToClipboardMock).toHaveBeenCalledWith("123456\n\nError: test");
  });

  it("shows 'Copied' and disables button after copy is clicked", () => {
    render(<ErrorComponent stackTrace="Error: test" />);

    fireEvent.click(screen.getByRole("button", { name: /show stacktrace/i }));
    const copyButton = screen.getByRole("button", { name: /copy/i });
    
    fireEvent.click(copyButton);

    expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copied/i })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /copy/i })).not.toBeInTheDocument();
  });

  it("resets copy button state after 2 seconds", async () => {
    render(<ErrorComponent stackTrace="Error: test" />);

    fireEvent.click(screen.getByRole("button", { name: /show stacktrace/i }));
    const copyButton = screen.getByRole("button", { name: /copy/i });
    
    fireEvent.click(copyButton);
    expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument();

    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /copied/i })).not.toBeInTheDocument();
    });
  });

  it("displays digest in stack trace when provided", () => {
    render(<ErrorComponent stackTrace="Error: test" digest="123456" />);

    fireEvent.click(screen.getByRole("button", { name: /show stacktrace/i }));

    expect(screen.getByText("Digest: 123456")).toBeInTheDocument();
    expect(screen.getByText("Error: test")).toBeInTheDocument();
  });

  it("shows Try Again button when onReset is provided", () => {
    const resetMock = jest.fn();
    render(<ErrorComponent onReset={resetMock} />);

    const tryAgainButton = screen.getByRole("button", { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();

    fireEvent.click(tryAgainButton);
    expect(resetMock).toHaveBeenCalledTimes(1);
  });

  it("does not show Try Again button when onReset is not provided", () => {
    render(<ErrorComponent />);

    expect(
      screen.queryByRole("button", { name: /try again/i })
    ).not.toBeInTheDocument();
  });
});
