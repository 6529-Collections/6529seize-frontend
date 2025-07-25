import { render, screen } from "@testing-library/react";
import React from "react";
import ProfileActivityLogProxyAction from "@/components/profile-activity/list/items/ProfileActivityLogProxyAction";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";

jest.mock("@/components/user/utils/CommonProfileLink", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="link" />),
}));
jest.mock("next/navigation", () => ({ useSearchParams: jest.fn() }));

const {
  default: CommonProfileLink,
} = require("@/components/user/utils/CommonProfileLink");
const { useSearchParams } = require("next/navigation");

describe("ProfileActivityLogProxyAction", () => {
  it("renders label and passes props to CommonProfileLink", () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ user: "alice" })
    );
    render(
      <ProfileActivityLogProxyAction
        log={
          {
            target_profile_handle: "Alice",
            contents: { type: ApiProfileProxyActionType.CreateWave },
          } as any
        }
      />
    );
    expect(screen.getByText("Create Wave")).toBeInTheDocument();
    expect(screen.getByTestId("link")).toBeInTheDocument();
    const props = (CommonProfileLink as jest.Mock).mock.calls[0][0];
    expect(props.handleOrWallet).toBe("Alice");
    expect(props.isCurrentUser).toBe(true);
  });
});
