import { screen } from "@testing-library/react";
import React from "react";
import UserPageIdentityHeaderCICRateStats from "@/components/user/identity/header/cic-rate/UserPageIdentityHeaderCICRateStats";
import { renderWithAuth } from "@/__tests__/utils/testContexts";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";

jest.mock("next/link", () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));
jest.mock("@/helpers/Helpers", () => ({
  formatNumberWithCommas: (n: number) => `f${n}`,
}));

const profile = { handle: "bob" } as any;

function setup(authOverrides: any, props: any) {
  return renderWithAuth(
    <UserPageIdentityHeaderCICRateStats isTooltip={false} profile={profile} {...props} />,
    authOverrides
  );
}

describe("UserPageIdentityHeaderCICRateStats", () => {
  it("shows hero credit values without proxy", () => {
    setup({ activeProfileProxy: null }, {
      minMaxValues: { min: 1, max: 2 },
      heroAvailableCredit: 50,
    });

    expect(screen.queryByText(/acting as proxy/)).toBeNull();
    expect(screen.getByText("f50")).toBeInTheDocument();
    expect(screen.getByText("\+/\- f2")).toBeInTheDocument();
  });

  it("renders proxy information when active", () => {
    const proxy = {
      created_by: { handle: "alice" },
      actions: [
        {
          action_type: ApiProfileProxyActionType.AllocateCic,
          credit_amount: 100,
          credit_spent: 10,
        },
      ],
    };

    setup(
      { activeProfileProxy: proxy },
      { minMaxValues: { min: 3, max: 4 }, heroAvailableCredit: 50 }
    );

    expect(screen.getByText("alice").closest("a")).toHaveAttribute("href", "/alice");
    expect(screen.getByText("f50")).toBeInTheDocument();
    expect(screen.getByText("f4")).toBeInTheDocument();
    expect(screen.getByText("f3")).toBeInTheDocument();
  });
});
