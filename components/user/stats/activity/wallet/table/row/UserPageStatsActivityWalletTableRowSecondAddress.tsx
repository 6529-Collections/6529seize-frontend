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
    [TransactionType.AIRDROPPED]: "to",
    [TransactionType.RECEIVED_AIRDROP]: "from",
    [TransactionType.MINTED]: "",
    [TransactionType.MINTED_TO]: "to",
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
      case TransactionType.MINTED:
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
      case TransactionType.MINTED_TO:
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
