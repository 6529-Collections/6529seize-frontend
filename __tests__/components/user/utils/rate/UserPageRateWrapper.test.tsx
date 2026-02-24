import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import UserPageRateWrapper from "@/components/user/utils/rate/UserPageRateWrapper";
import { RateMatter } from "@/types/enums";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/auth/SeizeConnectContext");
jest.mock("@/components/utils/CommonInfoBox", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="infobox">{props.message}</div>,
}));

describe("UserPageRateWrapper", () => {
  const useCtx = useSeizeConnectContext as jest.Mock;

  const profile: any = {
    query: "alice",
    handle: "alice",
    wallets: [{ wallet: "0xabc" }],
  };

  function renderWrapper(
    ctx: any,
    seize: any,
    type = RateMatter.NIC,
    options?: { hideOwnProfileMessage?: boolean }
  ) {
    useCtx.mockReturnValue(seize);
    return render(
      <AuthContext.Provider value={ctx as any}>
        <UserPageRateWrapper
          profile={profile}
          type={type}
          hideOwnProfileMessage={options?.hideOwnProfileMessage}>
          <div data-testid="child" />
        </UserPageRateWrapper>
      </AuthContext.Provider>
    );
  }

  it("shows message when not connected", () => {
    renderWrapper(
      { connectedProfile: undefined, activeProfileProxy: undefined },
      { address: undefined }
    );
    expect(screen.getByTestId("infobox")).toHaveTextContent(
      "Please connect to NIC rate alice"
    );
  });

  it("renders children when user can rate", () => {
    renderWrapper(
      { connectedProfile: { handle: "bob" }, activeProfileProxy: undefined },
      { address: "0xdef" }
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it.each([RateMatter.REP, RateMatter.NIC])(
    "shows own-profile message by default (%s)",
    (type) => {
      renderWrapper(
        { connectedProfile: { handle: "alice" }, activeProfileProxy: undefined },
        { address: "0xabc" },
        type
      );
      expect(screen.getByTestId("infobox")).toHaveTextContent(
        "You can't"
      );
      expect(screen.queryByTestId("child")).not.toBeInTheDocument();
    }
  );

  it.each([RateMatter.REP, RateMatter.NIC])(
    "hides own-profile section when hideOwnProfileMessage is true (%s)",
    (type) => {
      renderWrapper(
        { connectedProfile: { handle: "alice" }, activeProfileProxy: undefined },
        { address: "0xabc" },
        type,
        { hideOwnProfileMessage: true }
      );
      expect(screen.queryByTestId("infobox")).not.toBeInTheDocument();
      expect(screen.queryByTestId("child")).not.toBeInTheDocument();
    }
  );
});
