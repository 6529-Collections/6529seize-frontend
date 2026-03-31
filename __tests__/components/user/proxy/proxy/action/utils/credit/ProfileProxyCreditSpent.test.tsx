import React from "react";
import { render, screen } from "@testing-library/react";
import ProfileProxyCreditSpent from "@/components/user/proxy/proxy/action/utils/credit/ProfileProxyCreditSpent";

describe("ProfileProxyCreditSpent", () => {
  it("shows the formatted spent credit amount", () => {
    render(
      <ProfileProxyCreditSpent
        profileProxyAction={{ credit_spent: 12345 } as any}
      />
    );

    expect(screen.getByText("Spent:")).toBeInTheDocument();
    expect(screen.getByText("12,345")).toBeInTheDocument();
  });

  it("defaults missing spent credit to zero", () => {
    render(<ProfileProxyCreditSpent profileProxyAction={{} as any} />);

    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
