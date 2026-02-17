import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageIdentityAddStatementsNFTAccountItems from "@/components/user/identity/statements/add/nft-accounts/UserPageIdentityAddStatementsNFTAccountItems";
import { NFT_ACCOUNTS_STATEMENT_TYPES, STATEMENT_TYPE } from "@/helpers/Types";

const mockButton = jest.fn((props: any) => (
  <button
    data-testid="btn"
    data-type={props.statementType}
    onClick={props.onClick}
  />
));

jest.mock(
  "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsTypeButton",
  () => (props: any) => mockButton(props)
);

describe("UserPageIdentityAddStatementsNFTAccountItems", () => {
  it("splits statement types into two rows and handles click", async () => {
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
    const buttonTypes = buttons.map((button) =>
      button.getAttribute("data-type")
    );
    expect(buttonTypes).toContain(STATEMENT_TYPE.MANIFOLD);
    expect(buttonTypes).toContain(STATEMENT_TYPE.TRANSIENT);
    const firstRowCount = Math.round(NFT_ACCOUNTS_STATEMENT_TYPES.length / 2);
    expect(buttons.slice(0, firstRowCount).length).toBe(firstRowCount);
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
