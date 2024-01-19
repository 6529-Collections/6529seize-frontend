import { Transaction } from "../../../../../../entities/ITransaction";
import CommonTimeAgo from "../../../../../utils/CommonTimeAgo";
import UserPageStatsActivityWalletTableRow from "./row/UserPageStatsActivityWalletTableRow";

export default function UserPageStatsActivityWalletTable({
  transactions,
}: {
  readonly transactions: Transaction[];
}) {
  return (
    <div className="tw-mt-2 tw-pb-2 tw-inline-block tw-min-w-full tw-align-middle">
      <table className="tw-min-w-full">
        <tbody className="tw-divide-y tw-divide-iron-800 tw-divide-solid tw-divide-x-0">
          {transactions.map((transaction) => (
            <UserPageStatsActivityWalletTableRow
              key={`${transaction.from_address}-${transaction.to_address}-${transaction.transaction}-${transaction.token_id}`}
              transaction={transaction}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
