import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageIdentityAddStatementsTypeButton from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsTypeButton";
import { STATEMENT_TYPE } from "@/helpers/Types";

jest.mock("@/components/user/utils/icons/SocialStatementIcon", () => ({
  __esModule: true,
  default: () => <div data-testid="icon" />,
}));

describe("UserPageIdentityAddStatementsTypeButton", () => {
  it("renders a compact accessible control and handles selection", async () => {
    const onClick = jest.fn();
    const onParentTouchStart = jest.fn();
    const { rerender, getByRole } = render(
      <div onTouchStart={onParentTouchStart}>
        <UserPageIdentityAddStatementsTypeButton
          statementType={STATEMENT_TYPE.X}
          label="Other"
          isActive={false}
          isFirst
          isLast
          onClick={onClick}
        />
      </div>
    );
    const button = getByRole("button", { name: "Other" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).toHaveAttribute("data-tooltip-content", "Other");
    expect(button.className).toContain("tw-min-h-11");
    expect(button.className).toContain("tw-flex-1");
    expect(button.className).toContain("tw-rounded-l-md");
    expect(button.className).toContain("tw-rounded-r-md");
    expect(button.className).toContain("focus-visible:tw-ring-offset-2");

    fireEvent.touchStart(button, {
      touches: [{ clientX: 1, clientY: 1 }],
    });
    expect(onParentTouchStart).not.toHaveBeenCalled();

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <div onTouchStart={onParentTouchStart}>
        <UserPageIdentityAddStatementsTypeButton
          statementType={STATEMENT_TYPE.X}
          label="Other"
          isActive
          isFirst
          isLast
          onClick={onClick}
        />
      </div>
    );
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button.className).toContain("tw-bg-iron-800");
    expect(button.className).toContain("tw-ring-2");
  });
});
