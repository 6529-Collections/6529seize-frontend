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
  actionsDisabled = false,
}: {
  readonly accounts: readonly (typeof activeAccount)[];
  readonly canAddAccount?: boolean;
  readonly actionsDisabled?: boolean;
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
      actionsDisabled={actionsDisabled}
    />
  );
  return { onSelectAccount, onAddAccount, onSignOutAll };
}

describe("HeaderUserConnectedAccounts", () => {
  it("keeps a single profile visually neutral and hides multi-profile actions", () => {
    renderAccounts({ accounts: [activeAccount] });

    const profilesHeading = screen.getByText("Profiles");
    expect(profilesHeading).toBeInTheDocument();
    expect(profilesHeading.parentElement).toHaveClass("tw-pl-3");
    expect(profilesHeading.parentElement).not.toHaveClass("tw-px-3");
    const addProfile = screen.getByRole("button", { name: "Add profile" });
    expect(addProfile).toBeInTheDocument();
    expect(addProfile.parentElement).toHaveClass("tw-ml-auto");
    expect(addProfile).toHaveClass(
      "hover:tw-border-primary-400",
      "hover:tw-text-primary-300"
    );
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
    const addProfile = screen.getByRole("button", { name: "Add profile" });
    const signOutAll = screen.getByRole("button", { name: "Sign out all" });
    expect(activeButton).toHaveClass("tw-bg-iron-700");
    expect(activeButton.querySelector("svg")).toBeInTheDocument();
    expect(addProfile).toHaveClass("tw-border", "tw-border-iron-600");
    expect(signOutAll).toHaveClass("tw-border", "tw-border-iron-600");
    expect(addProfile.parentElement).toHaveClass("tw-ml-auto");
    expect(addProfile.nextElementSibling).toBe(signOutAll);
    expect(addProfile).toHaveClass(
      "hover:tw-border-primary-400",
      "hover:tw-text-primary-300"
    );
    expect(signOutAll).toHaveClass(
      "hover:tw-border-primary-400",
      "hover:tw-text-primary-300"
    );

    fireEvent.click(addProfile);
    fireEvent.click(signOutAll);
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

  it("disables profile actions while another menu action is pending", () => {
    const { onSelectAccount, onAddAccount, onSignOutAll } = renderAccounts({
      accounts: [activeAccount, secondaryAccount],
      actionsDisabled: true,
    });

    const addProfile = screen.getByRole("button", { name: "Add profile" });
    const signOutAll = screen.getByRole("button", { name: "Sign out all" });
    const switchProfile = screen.getByRole("button", {
      name: /Switch to secondary/,
    });
    expect(addProfile).toBeDisabled();
    expect(signOutAll).toBeDisabled();
    expect(switchProfile).toBeDisabled();

    fireEvent.click(addProfile);
    fireEvent.click(signOutAll);
    fireEvent.click(switchProfile);

    expect(onAddAccount).not.toHaveBeenCalled();
    expect(onSignOutAll).not.toHaveBeenCalled();
    expect(onSelectAccount).not.toHaveBeenCalled();
  });
});
