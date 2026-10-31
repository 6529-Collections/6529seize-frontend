import { render, screen } from "@testing-library/react";
import { SeizeConnectContext } from "@/components/auth/seizeConnectContextValue";
import { E2eeEnrollmentIdentity } from "@/components/e2ee/gate/E2eeEnrollmentIdentity";
import type { SeizeConnectContextType } from "@/components/auth/seizeConnectTypes";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: { handle: "alice" } }),
}));

const renderWithAddress = (address: string) =>
  render(
    <SeizeConnectContext.Provider
      value={{ address } as unknown as SeizeConnectContextType}
    >
      <E2eeEnrollmentIdentity />
    </SeizeConnectContext.Provider>
  );

describe("E2eeEnrollmentIdentity", () => {
  it("names the profile and the checksummed short wallet", () => {
    renderWithAddress("0x5a30c2a1f2e1e7fd7a0d2b5e5d0cfa62c1b336eb");
    expect(
      screen.getByText("You’ll sign as alice with 0x5a30…36Eb.")
    ).toBeInTheDocument();
  });

  it("never echoes an invalid address", () => {
    renderWithAddress("<img src=x>");
    expect(
      screen.getByText("You’ll sign with the wallet connected to this profile.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/img/u)).toBeNull();
  });
});
