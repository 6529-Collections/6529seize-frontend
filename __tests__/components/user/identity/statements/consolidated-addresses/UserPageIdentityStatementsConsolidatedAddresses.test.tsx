import { fireEvent, render, screen } from "@testing-library/react";
import UserPageIdentityStatementsConsolidatedAddresses from "@/components/user/identity/statements/consolidated-addresses/UserPageIdentityStatementsConsolidatedAddresses";
import { AuthContext, type AuthContextType } from "@/components/auth/Auth";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";

let mockIsOwner = true;
let mockAddress: string | undefined = "0x2";

jest.mock(
  "@/components/user/identity/statements/consolidated-addresses/UserPageIdentityStatementsConsolidatedAddressesItem",
  () => (props: any) => (
    <li data-testid={`item-${props.address.wallet}`}>
      <button onClick={props.onToggleOpen}>
        toggle-{props.address.wallet}
      </button>
      <span data-testid={`state-${props.address.wallet}`}>
        {props.isOpen ? "open" : "closed"}
      </span>
      {props.address.wallet}
    </li>
  )
);
jest.mock("@/components/user/utils/icons/EthereumIcon", () => () => <div />);
jest.mock("next/link", () => ({
  __esModule: true,
  default: (props: any) => <a {...props}>{props.children}</a>,
}));
jest.mock("@tanstack/react-query", () => ({ useQueries: () => [] }));
jest.mock("@/helpers/Helpers", () => ({
  amIUser: () => mockIsOwner,
  formatNumberWithCommasOrDash: (x: number) => String(x),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: mockAddress }),
}));

describe("UserPageIdentityStatementsConsolidatedAddresses", () => {
  beforeEach(() => {
    mockIsOwner = true;
    mockAddress = "0x2";
  });

  const profile: ApiIdentity = {
    primary_wallet: null,
    wallets: [
      { wallet: "0x1", tdh: 1 } as any,
      { wallet: "0x2", tdh: 2 } as any,
    ],
  } as any;

  it("links owners to the existing consolidation form without prefills", () => {
    render(
      <AuthContext.Provider
        value={{ activeProfileProxy: null } as AuthContextType}
      >
        <UserPageIdentityStatementsConsolidatedAddresses profile={profile} />
      </AuthContext.Provider>
    );

    expect(
      screen.getByRole("link", { name: "Add another wallet" })
    ).toHaveAttribute("href", "/delegation/register-consolidation");
    expect(
      screen.getByText(
        "Link another wallet you control. Your NFTs stay in their wallets."
      )
    ).toBeInTheDocument();
  });

  it.each(["visitor", "disconnected", "proxy"] as const)(
    "hides the wallet entry for a %s while keeping Wallet Checker",
    (viewer) => {
      mockIsOwner = viewer === "proxy";
      mockAddress = viewer === "disconnected" ? undefined : "0x2";
      const activeProfileProxy =
        viewer === "proxy" ? ({ id: "proxy" } as ApiProfileProxy) : null;
      render(
        <AuthContext.Provider value={{ activeProfileProxy } as AuthContextType}>
          <UserPageIdentityStatementsConsolidatedAddresses profile={profile} />
        </AuthContext.Provider>
      );

      expect(
        screen.queryByRole("link", { name: "Add another wallet" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          "Link another wallet you control. Your NFTs stay in their wallets."
        )
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Wallet Checker" })
      ).toBeInTheDocument();
    }
  );

  it("sorts wallets and sets wallet checker link", () => {
    render(
      <AuthContext.Provider value={{ activeProfileProxy: null } as any}>
        <UserPageIdentityStatementsConsolidatedAddresses profile={profile} />
      </AuthContext.Provider>
    );
    const firstItem = screen.getByTestId("item-0x2");
    expect(firstItem).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Wallet Checker" })
    ).toHaveAttribute("href", "/delegation/wallet-checker?address=0x2");
  });

  it("omits wallet actions when the profile has no wallets", () => {
    render(
      <AuthContext.Provider value={{ activeProfileProxy: null } as any}>
        <UserPageIdentityStatementsConsolidatedAddresses
          profile={{ ...profile, wallets: [] }}
        />
      </AuthContext.Provider>
    );

    expect(
      screen.queryByRole("link", { name: "Wallet Checker" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Add another wallet" })
    ).not.toBeInTheDocument();
  });

  it("keeps a single row expanded at a time", () => {
    render(
      <AuthContext.Provider value={{ activeProfileProxy: null } as any}>
        <UserPageIdentityStatementsConsolidatedAddresses profile={profile} />
      </AuthContext.Provider>
    );

    expect(screen.getByTestId("state-0x1")).toHaveTextContent("closed");
    expect(screen.getByTestId("state-0x2")).toHaveTextContent("closed");

    fireEvent.click(screen.getByRole("button", { name: "toggle-0x2" }));
    expect(screen.getByTestId("state-0x2")).toHaveTextContent("open");
    expect(screen.getByTestId("state-0x1")).toHaveTextContent("closed");

    fireEvent.click(screen.getByRole("button", { name: "toggle-0x1" }));
    expect(screen.getByTestId("state-0x1")).toHaveTextContent("open");
    expect(screen.getByTestId("state-0x2")).toHaveTextContent("closed");

    fireEvent.click(screen.getByRole("button", { name: "toggle-0x1" }));
    expect(screen.getByTestId("state-0x1")).toHaveTextContent("closed");
  });
});
