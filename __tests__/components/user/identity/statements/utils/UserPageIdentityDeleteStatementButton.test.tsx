import UserPageIdentityDeleteStatementButton from "@/components/user/identity/statements/utils/UserPageIdentityDeleteStatementButton";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock(
  "@/components/user/identity/statements/utils/UserPageIdentityDeleteStatementModal",
  () => ({
    __esModule: true,
    default: (props: any) => (
      <div data-testid="modal">
        <button onClick={props.onClose}>close</button>
      </div>
    ),
  })
);

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid="react-tooltip" data-tooltip-id={id}>
      {children}
    </div>
  ),
}));

const statement = { id: "1" } as any;
const profile = { id: "p" } as any;

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

describe("UserPageIdentityDeleteStatementButton", () => {
  beforeEach(() => {
    setMatchMedia(false);
  });

  it("opens and closes modal when button clicked", async () => {
    render(
      <UserPageIdentityDeleteStatementButton
        statement={statement}
        profile={profile}
      />
    );
    expect(screen.queryByTestId("modal")).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: /delete statement/i })
    );
    expect(screen.getByTestId("modal")).toBeInTheDocument();
    await userEvent.click(screen.getByText("close"));
    await waitFor(() => expect(screen.queryByTestId("modal")).toBeNull());
  });

  it("shows button when touchscreen", () => {
    setMatchMedia(true);
    render(
      <UserPageIdentityDeleteStatementButton
        statement={statement}
        profile={profile}
      />
    );
    const button = screen.getByRole("button", { name: /delete statement/i });
    expect(button.className).toContain("tw-opacity-100");
  });
});
