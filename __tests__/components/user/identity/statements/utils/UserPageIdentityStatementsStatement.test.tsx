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
jest.mock("react-use", () => ({
  useCopyToClipboard: () => [null, mockCopyToClipboard],
}));

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockReturnValue({
      matches,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }),
  });
}

describe("UserPageIdentityStatementsStatement", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setMatchMedia(false);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("copies text when copy button clicked", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
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

    expect(mockCopyToClipboard).toHaveBeenCalledWith("test-value");

    // Check that the text changed to "Copied!"
    expect(screen.getByText("Copied!")).toBeInTheDocument();

    // Fast-forward time to check that the text reverts
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText("test-value")).toBeInTheDocument();
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
