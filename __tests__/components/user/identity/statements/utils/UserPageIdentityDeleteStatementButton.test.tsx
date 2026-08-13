import UserPageIdentityDeleteStatementButton from "@/components/user/identity/statements/utils/UserPageIdentityDeleteStatementButton";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let modalProps: any;
jest.mock(
  "@/components/user/identity/statements/utils/UserPageIdentityDeleteStatementModal",
  () => ({
    __esModule: true,
    default: (props: any) => {
      modalProps = props;
      return (
      <div data-testid="modal" data-open={String(props.isOpen)}>
        <button onClick={props.onClose}>close</button>
      </div>
      );
    },
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

let isTouchDevice = false;
jest.mock("@/hooks/useIsTouchDevice", () => () => isTouchDevice);

describe("UserPageIdentityDeleteStatementButton", () => {
  beforeEach(() => {
    isTouchDevice = false;
  });

  it("opens and closes modal when button clicked", async () => {
    render(
      <UserPageIdentityDeleteStatementButton
        statement={statement}
        profile={profile}
      />
    );
    expect(screen.getByTestId("modal")).toHaveAttribute("data-open", "false");
    await userEvent.click(
      screen.getByRole("button", { name: "Delete" })
    );
    expect(screen.getByTestId("modal")).toHaveAttribute("data-open", "true");
    await userEvent.click(screen.getByText("close"));
    expect(screen.getByTestId("modal")).toHaveAttribute("data-open", "false");
    expect(modalProps.statement).toBe(statement);
  });

  it("shows button when touchscreen", () => {
    isTouchDevice = true;
    render(
      <UserPageIdentityDeleteStatementButton
        statement={statement}
        profile={profile}
      />
    );
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.className).toContain("tw-opacity-100");
  });
});
