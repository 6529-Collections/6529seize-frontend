import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import UserPageIdentityStatementsAddButton from "@/components/user/identity/statements/add/UserPageIdentityStatementsAddButton";
import type UserPageIdentityAddStatements from "@/components/user/identity/statements/add/UserPageIdentityAddStatements";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

type ModalProps = ComponentProps<typeof UserPageIdentityAddStatements>;
let modalProps: ModalProps;

jest.mock(
  "@/components/user/identity/statements/add/UserPageIdentityAddStatements",
  () => (props: ModalProps) => {
    modalProps = props;
    return <div data-testid="modal-content" />;
  }
);

const profile = { id: "1" } as ApiIdentity;

describe("UserPageIdentityStatementsAddButton", () => {
  it("opens and closes the add statements modal", async () => {
    render(<UserPageIdentityStatementsAddButton profile={profile} />);
    expect(screen.getByTestId("modal-content")).toBeInTheDocument();
    expect(modalProps.isOpen).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(modalProps.isOpen).toBe(true);
    expect(modalProps.profile).toBe(profile);

    await act(async () => {
      modalProps.onClose();
    });
    expect(modalProps.isOpen).toBe(false);
  });
});
