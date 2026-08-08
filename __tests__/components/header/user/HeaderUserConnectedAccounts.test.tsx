import { fireEvent, render, screen } from "@testing-library/react";

import HeaderUserConnectedAccounts from "@/components/header/user/connected/HeaderUserConnectedAccounts";

jest.mock("@/components/auth/connection-state-indicator", () => ({
  getConnectionProfileIndicator: () => ({
    avatarClassName: "",
    overlayClassName: "",
    title: "Connected",
  }),
}));
jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (value: string) => value,
}));
jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: ({ handleOrWallet }: { readonly handleOrWallet: string }) => ({
    profile: {
      handle: handleOrWallet === "0xactive" ? "active" : "secondary",
      pfp: null,
    },
    isLoading: false,
  }),
}));

const activeAccount = {
  address: "0xactive",
  isActive: true,
  isConnected: true,
};
const secondaryAccount = {
  address: "0xsecondary",
  isActive: false,
  isConnected: true,
};

function renderAccounts({
  accounts,
  canAddAccount = true,
}: {
  readonly accounts: readonly (typeof activeAccount)[];
  readonly canAddAccount?: boolean;
}) {
  const onSelectAccount = jest.fn();
  const onAddAccount = jest.fn();
  const onSignOutAll = jest.fn();
  render(
    <HeaderUserConnectedAccounts
      accounts={accounts}
      onSelectAccount={onSelectAccount}
      canAddAccount={canAddAccount}
      onAddAccount={onAddAccount}
      onSignOutAll={onSignOutAll}
      actionsDisabled={false}
    />
  );
  return { onSelectAccount, onAddAccount, onSignOutAll };
}

describe("HeaderUserConnectedAccounts", () => {
  it("keeps a single profile visually neutral and hides multi-profile actions", () => {
    renderAccounts({ accounts: [activeAccount] });

    expect(screen.getByText("Profiles")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add profile" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign out all" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Switch to active/ })
    ).not.toBeInTheDocument();
    expect(screen.getByText("active").closest("div.tw-group")).not.toHaveClass(
      "tw-bg-iron-700"
    );
  });

  it("shows active selection and compact multi-profile controls", () => {
    const { onAddAccount, onSignOutAll, onSelectAccount } = renderAccounts({
      accounts: [activeAccount, secondaryAccount],
    });

    const activeButton = screen.getByRole("button", {
      name: /Switch to active/,
    });
    expect(activeButton).toHaveClass("tw-bg-iron-700");
    expect(activeButton.querySelector("svg")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add profile" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out all" }));
    fireEvent.click(
      screen.getByRole("button", { name: /Switch to secondary/ })
    );

    expect(onAddAccount).toHaveBeenCalledTimes(1);
    expect(onSignOutAll).toHaveBeenCalledTimes(1);
    expect(onSelectAccount).toHaveBeenCalledWith("0xsecondary");
  });

  it("hides add profile when no additional profile slot is available", () => {
    renderAccounts({
      accounts: [activeAccount, secondaryAccount],
      canAddAccount: false,
    });

    expect(
      screen.queryByRole("button", { name: "Add profile" })
    ).not.toBeInTheDocument();
  });
});
