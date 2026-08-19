import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageIdentityAddStatementsNFTAccountItems from "@/components/user/identity/statements/add/nft-accounts/UserPageIdentityAddStatementsNFTAccountItems";
import type UserPageIdentityAddStatementsTypeButton from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsTypeButton";
import { NFT_ACCOUNTS_STATEMENT_TYPES, STATEMENT_TYPE } from "@/helpers/Types";
import type { ComponentProps } from "react";

type TypeButtonProps = ComponentProps<
  typeof UserPageIdentityAddStatementsTypeButton
>;

const mockButton = jest.fn((props: TypeButtonProps) => (
  <button
    data-testid="btn"
    data-type={props.statementType}
    onClick={props.onClick}
  />
));

jest.mock(
  "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsTypeButton",
  () => ({
    __esModule: true,
    ADD_STATEMENT_PLATFORM_TOOLTIP_ID: "platform-tooltip",
    default: (props: TypeButtonProps) => mockButton(props),
  })
);

jest.mock("@/hooks/useIsTouchDevice", () => () => false);
jest.mock("react-tooltip", () => ({ Tooltip: () => null }));

describe("UserPageIdentityAddStatementsNFTAccountItems", () => {
  it("renders every statement type in the compact picker and handles click", async () => {
    const user = userEvent.setup();
    const onSet = jest.fn();
    render(
      <UserPageIdentityAddStatementsNFTAccountItems
        activeType={NFT_ACCOUNTS_STATEMENT_TYPES[0]}
        setType={onSet}
      />
    );
    const buttons = screen.getAllByTestId("btn");
    expect(buttons).toHaveLength(NFT_ACCOUNTS_STATEMENT_TYPES.length);
    const picker = screen.getByRole("group", { name: "Choose a platform" });
    const rows = Array.from(picker.querySelectorAll(":scope > span"));
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.querySelectorAll("button").length)).toEqual([
      7, 7,
    ]);
    const buttonTypes = buttons.map((button) =>
      button.getAttribute("data-type")
    );
    expect(buttonTypes).toContain(STATEMENT_TYPE.MANIFOLD);
    expect(buttonTypes).toContain(STATEMENT_TYPE.TRANSIENT);
    await user.click(buttons[0]);
    expect(onSet).toHaveBeenCalledWith(NFT_ACCOUNTS_STATEMENT_TYPES[0]);
    const transientButton = buttons.find(
      (button) => button.getAttribute("data-type") === STATEMENT_TYPE.TRANSIENT
    );
    expect(transientButton).toBeDefined();
    await user.click(transientButton!);
    expect(onSet).toHaveBeenCalledWith(STATEMENT_TYPE.TRANSIENT);
  });
});
