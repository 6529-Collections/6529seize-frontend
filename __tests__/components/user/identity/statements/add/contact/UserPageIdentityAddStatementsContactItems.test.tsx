import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageIdentityAddStatementsContactItems from "@/components/user/identity/statements/add/contact/UserPageIdentityAddStatementsContactItems";
import type UserPageIdentityAddStatementsTypeButton from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsTypeButton";
import { CONTACT_STATEMENT_TYPES } from "@/helpers/Types";
import type { ComponentProps } from "react";

type TypeButtonProps = ComponentProps<
  typeof UserPageIdentityAddStatementsTypeButton
>;

jest.mock(
  "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsTypeButton",
  () => ({
    __esModule: true,
    ADD_STATEMENT_PLATFORM_TOOLTIP_ID: "platform-tooltip",
    default: ({ statementType, onClick, isActive }: TypeButtonProps) => (
      <button data-testid="btn" onClick={onClick}>
        {statementType}
        {isActive ? "!" : ""}
      </button>
    ),
  })
);

jest.mock("@/hooks/useIsTouchDevice", () => () => false);
jest.mock("react-tooltip", () => ({ Tooltip: () => null }));

describe("UserPageIdentityAddStatementsContactItems", () => {
  it("renders all buttons in the compact picker and handles click", async () => {
    const user = userEvent.setup();
    const setContactType = jest.fn();
    render(
      <UserPageIdentityAddStatementsContactItems
        activeType={CONTACT_STATEMENT_TYPES[0]}
        setContactType={setContactType}
      />
    );
    const buttons = screen.getAllByTestId("btn");
    expect(buttons).toHaveLength(CONTACT_STATEMENT_TYPES.length);
    const picker = screen.getByRole("group", { name: "Choose a platform" });
    const rows = Array.from(picker.querySelectorAll(":scope > span"));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.querySelectorAll("button")).toHaveLength(6);
    await user.click(buttons[1]);
    expect(setContactType).toHaveBeenCalledWith(CONTACT_STATEMENT_TYPES[1]);
  });
});
