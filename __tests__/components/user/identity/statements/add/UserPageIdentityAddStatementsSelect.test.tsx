import { render, screen, fireEvent, within } from "@testing-library/react";
import React from "react";
import UserPageIdentityAddStatementsSelect from "@/components/user/identity/statements/add/UserPageIdentityAddStatementsSelect";
import { STATEMENT_ADD_VIEW } from "@/components/user/identity/statements/add/UserPageIdentityAddStatements.constants";

describe("UserPageIdentityAddStatementsSelect", () => {
  it("triggers view changes", () => {
    const onViewChange = jest.fn();
    render(<UserPageIdentityAddStatementsSelect onViewChange={onViewChange} />);
    fireEvent.click(screen.getByText("Social Media Accounts"));
    expect(onViewChange).toHaveBeenCalledWith(
      STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT
    );
    fireEvent.click(screen.getByText("NFT Accounts"));
    expect(onViewChange).toHaveBeenCalledWith(STATEMENT_ADD_VIEW.NFT_ACCOUNT);
    fireEvent.click(screen.getByText("Contact"));
    expect(onViewChange).toHaveBeenCalledWith(STATEMENT_ADD_VIEW.CONTACT);
    fireEvent.click(screen.getByText("Social Media Verification Posts"));
    expect(onViewChange).toHaveBeenCalledWith(
      STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST
    );
  });

  it("keeps the public and verification notices visible in the information footer", () => {
    render(<UserPageIdentityAddStatementsSelect onViewChange={jest.fn()} />);

    const footer = screen.getByRole("complementary", {
      name: "About identity statements",
    });
    expect(
      within(footer).getByText(
        "Statements are optional and fully and permanently public."
      )
    ).toBeVisible();
    expect(
      within(footer).getByText(
        "6529 does not connect to social media accounts or verify posts."
      )
    ).toBeVisible();
    expect(footer.querySelector("details")).toBeNull();
  });

  it("describes each of the four available statement groups", () => {
    render(<UserPageIdentityAddStatementsSelect onViewChange={jest.fn()} />);

    expect(
      screen.getByText(
        "6529 users can make statements asserting their identity (eponymous, pseudonymous or organizational)."
      )
    ).toBeVisible();
    expect(screen.getAllByRole("button")).toHaveLength(4);
    for (const description of [
      "Your handle on social media platforms.",
      "Your handle on NFT platforms.",
      "Your handle on messaging platforms.",
      "Your posts verifying your profile here.",
    ]) {
      expect(screen.getByText(description)).toBeVisible();
    }
  });
});
