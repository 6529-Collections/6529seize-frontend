import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import UserPageIdentityAddStatementsContactHeader from "../../../../../../../components/user/identity/statements/add/contact/UserPageIdentityAddStatementsContactHeader";

describe("UserPageIdentityAddStatementsContactHeader", () => {
  it("calls onClose when close button clicked", async () => {
    const onClose = jest.fn();
    render(<UserPageIdentityAddStatementsContactHeader onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders title", () => {
    render(<UserPageIdentityAddStatementsContactHeader onClose={() => {}} />);
    expect(screen.getByText("Add Contact")).toBeInTheDocument();
  });
});
