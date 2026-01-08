"use client";

import Link from "next/link";
import type { Transaction } from "@/entities/ITransaction";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import {
  formatAddress,
  getProfileTargetRoute,
} from "@/helpers/Helpers";
import { TransactionType } from "./UserPageStatsActivityWalletTableRow";
import { usePathname } from "next/navigation";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";

export default function UserPageStatsActivityWalletTableRowSecondAddress({
  transaction,
  type,
}: {
  readonly transaction: Transaction;
  readonly type: TransactionType;
}) {
  const pathname = usePathname();

  const TYPE_TO_ACTION: Record<TransactionType, string> = {
    [TransactionType.AIRDROPPED]: "to",
    [TransactionType.RECEIVED_AIRDROP]: "from",
    [TransactionType.SEIZED]: "",
    [TransactionType.SEIZED_TO]: "to",
    [TransactionType.SALE]: "to",
    [TransactionType.PURCHASE]: "from",
    [TransactionType.TRANSFER_IN]: "from",
    [TransactionType.TRANSFER_OUT]: "to",
    [TransactionType.BURNED]: "",
    [TransactionType.RECEIVED_BURN]: "from",
  };

  const getWalletDisplayAndAddress = (): {
    display: string;
    address: string;
  } => {
    switch (type) {
      case TransactionType.SEIZED:
      case TransactionType.PURCHASE:
      case TransactionType.TRANSFER_IN:
      case TransactionType.RECEIVED_BURN:
      case TransactionType.RECEIVED_AIRDROP:
        return {
          display:
            transaction.from_display ??
            formatAddress(transaction.from_address) ??
            "unknown",
          address: transaction.from_address,
        };
      case TransactionType.AIRDROPPED:
      case TransactionType.SALE:
      case TransactionType.BURNED:
      case TransactionType.TRANSFER_OUT:
      case TransactionType.SEIZED_TO:
        return {
          display:
            transaction.to_display ??
            formatAddress(transaction.to_address) ??
            "unknown",
          address: transaction.to_address,
        };
      default:
        assertUnreachable(type);
        return {
          display: "",
          address: "",
        };
    }
  };

  const { display, address } = getWalletDisplayAndAddress();
  const path = getProfileTargetRoute({
    handleOrWallet: address,
    pathname: pathname ?? "",
    defaultPath: USER_PAGE_TAB_IDS.STATS,
  });

  return (
    <span className="tw-inline-flex tw-space-x-1">
      <span className="tw-text-iron-400">{TYPE_TO_ACTION[type]}</span>
      <Link
        href={path}
        className="tw-text-iron-100 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out">
        {display}
      </Link>
    </span>
  );
}
