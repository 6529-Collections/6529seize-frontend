import { IProfileAndConsolidations } from "../../../../../../../entities/IProfile";
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
  readonly profile: IProfileAndConsolidations;
}) {
  const wallet =
    type === TransactionType.BURN
      ? {
          wallet: {
            ens: null,
            address: transaction.from_address.toLowerCase(),
          },
        }
      : profile.consolidation.wallets.find((w) => {
          switch (type) {
            case TransactionType.AIRDROP:
            case TransactionType.MINT:
            case TransactionType.PURCHASE:
            case TransactionType.TRANSFER_IN:
              return (
                w.wallet.address.toLowerCase() ===
                transaction.to_address.toLowerCase()
              );
            case TransactionType.SALE:
            case TransactionType.TRANSFER_OUT:
              return (
                w.wallet.address.toLowerCase() ===
                transaction.from_address.toLowerCase()
              );
            default:
              assertUnreachable(type);
              return false;
          }
        });

  const walletDisplay = !wallet
    ? "unknown"
    : wallet.wallet.ens ?? formatAddress(wallet.wallet.address);

  return (
    <div className="tw-text-sm tw-text-iron-100 tw-font-medium">
      {walletDisplay}
    </div>
  );
}
