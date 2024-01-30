import Link from "next/link";
import { Transaction } from "../../../../../../../entities/ITransaction";
import { assertUnreachable } from "../../../../../../../helpers/AllowlistToolHelpers";
import { formatAddress } from "../../../../../../../helpers/Helpers";
import { TransactionType } from "./UserPageStatsActivityWalletTableRow";

export default function UserPageStatsActivityWalletTableRowSecondAddress({
  transaction,
  type,
}: {
  readonly transaction: Transaction;
  readonly type: TransactionType;
}) {
  const TYPE_TO_ACTION: Record<TransactionType, string> = {
    [TransactionType.AIRDROP]: "",
    [TransactionType.MINT]: "",
    [TransactionType.SALE]: "to",
    [TransactionType.PURCHASE]: "from",
    [TransactionType.TRANSFER_IN]: "from",
    [TransactionType.TRANSFER_OUT]: "to",
    [TransactionType.BURN]: "",
  };

  const getWalletDisplayAndAddress = (): {
    display: string;
    address: string;
  } => {
    switch (type) {
      case TransactionType.AIRDROP:
      case TransactionType.MINT:
      case TransactionType.PURCHASE:
      case TransactionType.TRANSFER_IN:
        return {
          display:
            transaction.from_display ??
            formatAddress(transaction.from_address) ??
            "unknown",
          address: transaction.from_address,
        };
      case TransactionType.SALE:
      case TransactionType.BURN:
      case TransactionType.TRANSFER_OUT:
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

  return (
    <span className="tw-inline-flex tw-space-x-1">
      <span className="tw-text-iron-400">{TYPE_TO_ACTION[type]}</span>
      <Link className="tw-no-underline hover:tw-underline" href={`/${address}`}>
        {display}
      </Link>
    </span>
  );
}
