import UserPageIdentityDeleteStatementButton from "@/components/user/identity/statements/utils/UserPageIdentityDeleteStatementButton";
import type UserPageIdentityDeleteStatementModal from "@/components/user/identity/statements/utils/UserPageIdentityDeleteStatementModal";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";

type DeleteStatementModalProps = ComponentProps<
  typeof UserPageIdentityDeleteStatementModal
>;

let modalProps: DeleteStatementModalProps;
jest.mock(
  "@/components/user/identity/statements/utils/UserPageIdentityDeleteStatementModal",
  () => ({
    __esModule: true,
    default: (props: DeleteStatementModalProps) => {
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
  Tooltip: ({ children, id }: { children: ReactNode; id: string }) => (
    <div data-testid="react-tooltip" data-tooltip-id={id}>
      {children}
    </div>
  ),
}));

const statement = { id: "1" } as CicStatement;
const profile = { id: "p" } as ApiIdentity;

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
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
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

  it("includes the no-hover CSS fallback on the desktop-layout button", () => {
    render(
      <UserPageIdentityDeleteStatementButton
        statement={statement}
        profile={profile}
      />
    );

    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
      "tw-opacity-0",
      "desktop-hover:group-hover:tw-opacity-100",
      "touch-only:tw-opacity-100"
    );
  });
});
