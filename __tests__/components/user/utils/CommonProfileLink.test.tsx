import { render, screen } from "@testing-library/react";
import React from "react";
import CommonProfileLink from "@/components/user/utils/CommonProfileLink";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
jest.mock("@/helpers/Helpers", () => ({
  getProfileTargetRoute: jest.fn(() => "/target"),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/testuser/collected",
}));

const { getProfileTargetRoute } = require("@/helpers/Helpers");

describe("CommonProfileLink", () => {
  it("disables link for current user", () => {
    render(
      <CommonProfileLink
        handleOrWallet="alice"
        isCurrentUser={true}
        tabTarget={USER_PAGE_TAB_IDS.COLLECTED}
      />
    );
    const link = screen.getByRole("link");
    expect(link).toHaveClass("tw-pointer-events-none");
  });

  it("computes target route", () => {
    render(
      <CommonProfileLink
        handleOrWallet="bob"
        isCurrentUser={false}
        tabTarget={USER_PAGE_TAB_IDS.COLLECTED}
      />
    );
    expect(getProfileTargetRoute).toHaveBeenCalled();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/target");
  });

  it("abbreviates a wallet visually while preserving its full accessible name", () => {
    const wallet = "0x1234567890abcdef1234567890abcdef12345678";

    render(
      <CommonProfileLink
        handleOrWallet={wallet}
        isCurrentUser={false}
        tabTarget={USER_PAGE_TAB_IDS.COLLECTED}
      />
    );

    expect(screen.getByText("0x1234...5678")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: wallet })).toBeInTheDocument();
  });

  it("preserves the generated-profile prefix around an abbreviated wallet", () => {
    const generatedHandle = "id-0x1234567890abcdef1234567890abcdef12345678";

    render(
      <CommonProfileLink
        handleOrWallet={generatedHandle}
        isCurrentUser={false}
        tabTarget={USER_PAGE_TAB_IDS.COLLECTED}
      />
    );

    expect(screen.getByText("id-0x1234...5678")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: generatedHandle })
    ).toBeInTheDocument();
  });
});
