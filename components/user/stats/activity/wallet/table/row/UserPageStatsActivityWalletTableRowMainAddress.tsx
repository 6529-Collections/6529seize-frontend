import { ApiIdentity } from "../../../../../../../generated/models/ApiIdentity";
import { Transaction } from "../../../../../../../entities/ITransaction";
import { assertUnreachable } from "../../../../../../../helpers/AllowlistToolHelpers";
import { formatAddress } from "../../../../../../../helpers/Helpers";
import { TransactionType } from "./UserPageStatsActivityWalletTableRow";

export default function UserPageStatsActivityWalletTableRowMainAddress({
  transaction,
  type,
  profile,
}: {
  readonly transaction: Transaction;
  readonly type: TransactionType;
  readonly profile: ApiIdentity;
}) {
  const wallet = profile.wallets?.find((w) => {
    switch (type) {
      case TransactionType.RECEIVED_AIRDROP:
      case TransactionType.SEIZED:
      case TransactionType.PURCHASE:
      case TransactionType.TRANSFER_IN:
        return w.wallet.toLowerCase() === transaction.to_address.toLowerCase();
      case TransactionType.SALE:
      case TransactionType.BURNED:
      case TransactionType.TRANSFER_OUT:
        return (
          w.wallet.toLowerCase() === transaction.from_address.toLowerCase()
        );
      case TransactionType.RECEIVED_BURN:
      case TransactionType.AIRDROPPED:
      case TransactionType.SEIZED_TO:
        return false;
      default:
        assertUnreachable(type);
        return false;
    }
  });

  const getWalletDisplay = () => {
    if (
      type === TransactionType.RECEIVED_BURN ||
      type === TransactionType.AIRDROPPED ||
      type === TransactionType.SEIZED_TO
    ) {
      return "Null Address";
    }
    if (!wallet) {
      return "unknown";
    }
    return wallet.display ?? formatAddress(wallet.wallet);
  };

  const walletDisplay = getWalletDisplay();

  return (
    <span className="tw-text-sm sm:tw-text-base tw-text-iron-100 tw-font-medium">
      {walletDisplay}
    </span>
  );
}
