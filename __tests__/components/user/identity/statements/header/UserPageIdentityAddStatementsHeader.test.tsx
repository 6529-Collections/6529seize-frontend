import {
  fireEvent,
  createEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageIdentityAddStatementsHeader from "@/components/user/identity/statements/header/UserPageIdentityAddStatementsHeader";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";

jest.mock(
  "@/components/user/identity/statements/add/UserPageIdentityStatementsAddButton",
  () => ({
    __esModule: true,
    default: () => <div data-testid="add-button" />,
  })
);

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

const mockedUseSeize = useSeizeConnectContext as jest.Mock;

const profile = { handle: "alice", wallets: [{ wallet: "0x1" }] } as any;

async function expectGuidanceDismissed(
  button: HTMLElement,
  tooltip: HTMLElement
) {
  await waitFor(() => {
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).not.toHaveAttribute("aria-describedby");
  });
  // JSDOM does not run the browser's opacity transition.
  const fadeOut = createEvent.transitionEnd(tooltip);
  Object.defineProperty(fadeOut, "propertyName", { value: "opacity" });
  fireEvent(tooltip, fadeOut);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
}

describe("UserPageIdentityAddStatementsHeader", () => {
  it("shows add button when viewing own profile", () => {
    mockedUseSeize.mockReturnValue({ address: "0x1" });
    render(
      <AuthContext.Provider value={{ activeProfileProxy: undefined } as any}>
        <UserPageIdentityAddStatementsHeader profile={profile} />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId("add-button")).toBeInTheDocument();
    expect(screen.getByRole("heading")).toHaveTextContent(
      "alice's ID Statements"
    );
  });

  it("hides add button when not my profile", () => {
    mockedUseSeize.mockReturnValue({ address: "0x2" });
    render(
      <AuthContext.Provider value={{ activeProfileProxy: undefined } as any}>
        <UserPageIdentityAddStatementsHeader profile={profile} />
      </AuthContext.Provider>
    );
    expect(screen.queryByTestId("add-button")).toBeNull();
  });

  it("keeps all four guidance points in the heading tooltip", async () => {
    mockedUseSeize.mockReturnValue({ address: "0x2" });
    const user = userEvent.setup();
    render(<UserPageIdentityAddStatementsHeader profile={profile} />);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    await user.hover(
      screen.getByRole("button", { name: "About identity statements" })
    );
    const tooltip = await screen.findByRole("tooltip");
    expect(within(tooltip).getAllByRole("listitem")).toHaveLength(4);
    expect(tooltip).toHaveTextContent("All statements are optional.");
    expect(tooltip).toHaveTextContent(
      "All statements are fully and permanently public."
    );
    expect(tooltip).toHaveTextContent(
      "Social accounts are self-declared. 6529 does not connect to social media accounts or verify account ownership or posts."
    );
    expect(tooltip).toHaveTextContent(
      "The community will rate statement accuracy."
    );
  });

  it("opens from keyboard focus and dismisses with Escape", async () => {
    mockedUseSeize.mockReturnValue({ address: "0x2" });
    const user = userEvent.setup();
    render(<UserPageIdentityAddStatementsHeader profile={profile} />);
    await user.tab();
    expect(
      screen.getByRole("button", { name: "About identity statements" })
    ).toHaveFocus();
    const tooltip = await screen.findByRole("tooltip");
    const button = screen.getByRole("button", {
      name: "About identity statements",
    });
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-expanded", "true")
    );
    await user.keyboard("{Escape}");
    await expectGuidanceDismissed(button, tooltip);
  });

  it("supports a tap without hover and closes on an outside click", async () => {
    mockedUseSeize.mockReturnValue({ address: "0x2" });
    render(<UserPageIdentityAddStatementsHeader profile={profile} />);
    fireEvent.click(
      screen.getByRole("button", { name: "About identity statements" })
    );
    const tooltip = await screen.findByRole("tooltip");
    const button = screen.getByRole("button", {
      name: "About identity statements",
    });
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-expanded", "true")
    );
    fireEvent.pointerDown(document.body);
    await expectGuidanceDismissed(button, tooltip);
  });
});
