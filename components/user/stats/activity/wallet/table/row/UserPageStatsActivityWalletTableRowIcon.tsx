import { assertUnreachable } from "../../../../../../../helpers/AllowlistToolHelpers";
import { TransactionType } from "./UserPageStatsActivityWalletTableRow";

export default function UserPageStatsActivityWalletTableRowIcon({
  type,
}: {
  readonly type: TransactionType;
}) {
  switch (type) {
    case TransactionType.AIRDROP:
      return <div>{type}</div>;
    case TransactionType.MINT:
      return <div>{type}</div>;
    case TransactionType.SALE:
      return <div>{type}</div>;
    case TransactionType.PURCHASE:
      return <div>{type}</div>;
    case TransactionType.TRANSFER_IN:
      return <div>{type}</div>;
    case TransactionType.TRANSFER_OUT:
      return <div>{type}</div>;
    case TransactionType.BURN:
      return <div>{type}</div>;
    default:
      assertUnreachable(type);
      return null;
  }
}
