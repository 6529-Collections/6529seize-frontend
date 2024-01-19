import { IProfileAndConsolidations } from "../../../../../../entities/IProfile";
import { Transaction } from "../../../../../../entities/ITransaction";
import { MemeLite } from "../../../../settings/UserSettingsImgSelectMeme";
import UserPageStatsActivityWalletTableRow from "./row/UserPageStatsActivityWalletTableRow";

export default function UserPageStatsActivityWalletTable({
  transactions,
  profile,
  memes,
}: {
  readonly transactions: Transaction[];
  readonly profile: IProfileAndConsolidations;
  readonly memes: MemeLite[];
}) {
  return (
    <div className="tw-mt-2 tw-pb-2 tw-inline-block tw-min-w-full tw-align-middle">
      <table className="tw-min-w-full">
        <tbody className="tw-divide-y tw-divide-iron-800 tw-divide-solid tw-divide-x-0">
          {transactions.map((transaction) => (
            <UserPageStatsActivityWalletTableRow
              key={`${transaction.from_address}-${transaction.to_address}-${transaction.transaction}-${transaction.token_id}`}
              transaction={transaction}
              profile={profile}
              memes={memes}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
