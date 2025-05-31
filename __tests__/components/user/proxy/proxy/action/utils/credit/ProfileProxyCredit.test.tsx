import { renderWithAuth } from "../../../../../../../utils/testContexts";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import ProfileProxyCredit from "../../../../../../../../components/user/proxy/proxy/action/utils/credit/ProfileProxyCredit";

jest.mock("../../../../../../../../components/utils/icons/PencilIcon", () => ({
  __esModule: true,
  default: () => <svg data-testid="pencil" />,
  PencilIconSize: { SMALL: 'sm' },
}));

const profileProxy = { created_by: { id: "owner" } } as any;
const action = { credit_amount: 1000 } as any;

describe("ProfileProxyCredit", () => {
  it("shows edit button for owner and triggers callback", async () => {
    const onEdit = jest.fn();
    renderWithAuth(
      <ProfileProxyCredit profileProxy={profileProxy} profileProxyAction={action} onCreditEdit={onEdit} />,
      { connectedProfile: { id: "owner" } as any }
    );
    expect(screen.getByText("1,000")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /edit credit/i });
    await userEvent.click(button);
    expect(onEdit).toHaveBeenCalled();
  });

  it("hides edit button when not owner", () => {
    renderWithAuth(
      <ProfileProxyCredit profileProxy={profileProxy} profileProxyAction={action} onCreditEdit={() => {}} />,
      { connectedProfile: { id: "other" } as any }
    );
    expect(screen.queryByRole("button", { name: /edit credit/i })).toBeNull();
  });
});
