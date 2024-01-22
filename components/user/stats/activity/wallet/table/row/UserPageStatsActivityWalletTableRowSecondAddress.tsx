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

  const getWalletDisplay = (): string => {
    switch (type) {
      case TransactionType.AIRDROP:
      case TransactionType.MINT:
      case TransactionType.PURCHASE:
      case TransactionType.TRANSFER_IN:
        return (
          transaction.from_display ??
          formatAddress(transaction.from_address) ??
          "unknown"
        );
      case TransactionType.SALE:
      case TransactionType.BURN:
      case TransactionType.TRANSFER_OUT:
        return (
          transaction.to_display ??
          formatAddress(transaction.to_address) ??
          "unknown"
        );
      default:
        assertUnreachable(type);
        return "";
    }
  };

  const walletDisplay = getWalletDisplay();

  return (
    <span className="tw-inline-flex tw-space-x-1">
      <span>{TYPE_TO_ACTION[type]}</span>
      <span>{walletDisplay}</span>
    </span>
  );
}
