import { render, screen, fireEvent } from "@testing-library/react";
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

  it("keeps the social disclaimer in a mobile disclosure", () => {
    render(<UserPageIdentityAddStatementsSelect onViewChange={jest.fn()} />);

    expect(screen.getByText("About identity statements")).toBeInTheDocument();
    const disclaimers = screen.getAllByText(
      "6529 does not connect to social media accounts or verify posts."
    );
    expect(disclaimers).toHaveLength(2);
    expect(disclaimers[0]?.closest("details")).not.toBeNull();
  });

  it("uses compact mobile typography while preserving desktop sizing", () => {
    render(<UserPageIdentityAddStatementsSelect onViewChange={jest.fn()} />);

    expect(screen.getByText("Social Media Accounts")).toHaveClass(
      "tw-text-sm",
      "tw-leading-4",
      "tw-tracking-tight",
      "md:tw-text-[15px]",
      "md:tw-leading-5",
      "md:tw-tracking-normal"
    );
  });
});
