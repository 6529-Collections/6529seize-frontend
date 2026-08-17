import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import UserPageIdentityAddStatementsSelect from "@/components/user/identity/statements/add/UserPageIdentityAddStatementsSelect";
import { STATEMENT_ADD_VIEW } from "@/components/user/identity/statements/add/UserPageIdentityAddStatements";

describe("UserPageIdentityAddStatementsSelect", () => {
  it("triggers view changes", () => {
    const onViewChange = jest.fn();
    render(<UserPageIdentityAddStatementsSelect onViewChange={onViewChange} />);
    fireEvent.click(
      screen.getByRole("button", { name: /social media account/i })
    );
    expect(onViewChange).toHaveBeenCalledWith(
      STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT
    );
    fireEvent.click(screen.getByRole("button", { name: /nft account/i }));
    expect(onViewChange).toHaveBeenCalledWith(STATEMENT_ADD_VIEW.NFT_ACCOUNT);
    fireEvent.click(screen.getByRole("button", { name: /contact/i }));
    expect(onViewChange).toHaveBeenCalledWith(STATEMENT_ADD_VIEW.CONTACT);
    fireEvent.click(screen.getByRole("button", { name: /verification post/i }));
    expect(onViewChange).toHaveBeenCalledWith(
      STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST
    );
  });
});
