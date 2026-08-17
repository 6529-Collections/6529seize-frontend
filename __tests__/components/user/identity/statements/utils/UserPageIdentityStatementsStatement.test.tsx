import UserPageIdentityStatementsStatement from "@/components/user/identity/statements/utils/UserPageIdentityStatementsStatement";
import { STATEMENT_TYPE } from "@/helpers/Types";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock(
  "@/components/user/identity/statements/utils/UserPageIdentityDeleteStatementButton",
  () => ({
    __esModule: true,
    default: () => <div data-testid="delete-button" />,
  })
);

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid="react-tooltip" data-tooltip-id={id}>
      {children}
    </div>
  ),
}));

const mockCopyToClipboard = jest.fn();
const mockClipboardWriteText = jest.fn().mockResolvedValue(undefined);
jest.mock("react-use", () => ({
  useCopyToClipboard: () => [null, mockCopyToClipboard],
}));

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: matches && query === "(any-pointer: coarse)",
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  });
}

describe("UserPageIdentityStatementsStatement", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setMatchMedia(false);
    mockCopyToClipboard.mockClear();
    mockClipboardWriteText.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("copies text when copy button clicked", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: mockClipboardWriteText },
    });
    const statement = {
      statement_value: "test-value",
      statement_type: STATEMENT_TYPE.X,
    } as any;
    const profile = {} as any;

    render(
      <UserPageIdentityStatementsStatement
        statement={statement}
        profile={profile}
        canEdit={false}
      />
    );

    // Wait for the component to finish initial render and useEffect
    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    const copyButton = screen.getByRole("button", { name: /copy/i });

    await act(async () => {
      await user.click(copyButton);
    });

    expect(mockClipboardWriteText).toHaveBeenCalledWith("test-value");
    expect(mockCopyToClipboard).not.toHaveBeenCalled();

    // Desktop keeps the value stable and announces the copy once.
    expect(screen.getAllByText("Copied!")).toHaveLength(1);
    expect(screen.getByText("test-value")).toBeInTheDocument();

    // Fast-forward time to check that the text reverts
    await act(async () => {
      jest.advanceTimersByTime(1800);
    });

    expect(screen.getByText("test-value")).toBeInTheDocument();
  });

  it("hides touch-only visual feedback from the accessibility tree", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    setMatchMedia(true);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: mockClipboardWriteText },
    });

    render(
      <UserPageIdentityStatementsStatement
        statement={
          {
            statement_value: "test-value",
            statement_type: STATEMENT_TYPE.X,
          } as any
        }
        profile={{} as any}
        canEdit={false}
      />
    );

    await user.click(screen.getByRole("button", { name: /copy/i }));

    const copiedMessages = screen.getAllByText("Copied!");
    expect(copiedMessages).toHaveLength(2);
    expect(
      copiedMessages.some(
        (message) => message.getAttribute("aria-hidden") === "true"
      )
    ).toBe(true);
  });

  it("shows external link when canOpen is true", () => {
    const statement = {
      statement_value: "https://x.com",
      statement_type: STATEMENT_TYPE.X,
    } as any;
    const profile = {} as any;
    render(
      <UserPageIdentityStatementsStatement
        statement={statement}
        profile={profile}
        canEdit={false}
      />
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://x.com");
  });
});
