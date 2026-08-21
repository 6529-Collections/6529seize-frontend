import UserPageIdentityAddStatementsNFTAccountItems from "@/components/user/identity/statements/add/nft-accounts/UserPageIdentityAddStatementsNFTAccountItems";
import { STATEMENT_TYPE } from "@/helpers/Types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/components/user/utils/icons/SocialStatementIcon", () => ({
  __esModule: true,
  default: () => <span data-testid="platform-icon" />,
}));

describe("UserPageIdentityAddStatementsNFTAccountItems", () => {
  it("offers Ninfa and a custom Other option", async () => {
    const setType = jest.fn();
    render(
      <UserPageIdentityAddStatementsNFTAccountItems
        activeType={STATEMENT_TYPE.NINFA}
        setType={setType}
      />
    );

    expect(screen.getByRole("button", { name: "Ninfa" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await userEvent.click(screen.getByRole("button", { name: "Other" }));
    expect(setType).toHaveBeenCalledWith(STATEMENT_TYPE.LINK);
  });
});
