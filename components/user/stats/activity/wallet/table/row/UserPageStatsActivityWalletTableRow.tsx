import { Transaction } from "../../../../../../../entities/ITransaction";
import CommonTimeAgo from "../../../../../../utils/CommonTimeAgo";
import UserPageStatsActivityWalletTableRowIcon from "./UserPageStatsActivityWalletTableRowIcon";

export default function UserPageStatsActivityWalletTableRow({
  transaction,
}: {
  readonly transaction: Transaction;
}) {
  return (
    <tr className="tw-flex tw-items-center tw-justify-between">
      <td className="tw-py-2.5">
        <UserPageStatsActivityWalletTableRowIcon />
      </td>
      <td className="tw-py-2.5 tw-pl-3 tw-text-right">
        <CommonTimeAgo
          timestamp={new Date(transaction.transaction_date).getTime()}
        />
      </td>
    </tr>
  );
}
