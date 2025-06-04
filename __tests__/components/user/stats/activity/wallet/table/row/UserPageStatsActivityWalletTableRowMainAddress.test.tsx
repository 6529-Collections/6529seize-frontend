import { render, screen } from "@testing-library/react";
import React from "react";
import UserPageStatsActivityWalletTableRowMainAddress from "../../../../../../../../components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRowMainAddress";
import { TransactionType } from "../../../../../../../../components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRow";

const profile = {
  wallets: [{ wallet: "0xabc", display: "Main" }],
} as any;

const baseTx = { to_address: "0xabc", from_address: "0xdef" } as any;

test("shows display for matching wallet", () => {
  render(
    <UserPageStatsActivityWalletTableRowMainAddress
      transaction={baseTx}
      type={TransactionType.RECEIVED_AIRDROP}
      profile={profile}
    />
  );
  expect(screen.getByText("Main")).toBeInTheDocument();
});

test("shows unknown when wallet not found", () => {
  const tx = { to_address: "0x123", from_address: "0xdef" } as any;
  render(
    <UserPageStatsActivityWalletTableRowMainAddress
      transaction={tx}
      type={TransactionType.RECEIVED_AIRDROP}
      profile={profile}
    />
  );
  expect(screen.getByText("unknown")).toBeInTheDocument();
});

test("shows Null Address for burn types", () => {
  render(
    <UserPageStatsActivityWalletTableRowMainAddress
      transaction={baseTx}
      type={TransactionType.RECEIVED_BURN}
      profile={profile}
    />
  );
  expect(screen.getByText("Null Address")).toBeInTheDocument();
});
