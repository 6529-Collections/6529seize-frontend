import { MemeLite } from "@/components/user/settings/UserSettingsImgSelectMeme";
import { NextGenCollection } from "@/entities/INextgen";
import { Transaction } from "@/entities/ITransaction";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageStatsActivityWalletTableRow from "./row/UserPageStatsActivityWalletTableRow";

export default function UserPageStatsActivityWalletTable({
  transactions,
  profile,
  memes,
  nextgenCollections,
}: {
  readonly transactions: Transaction[];
  readonly profile: ApiIdentity;
  readonly memes: MemeLite[];
  readonly nextgenCollections: NextGenCollection[];
}) {
  return (
    <div className="tw-px-4 sm:tw-px-6 tw-mt-4 tw-pb-2 tw-inline-block tw-min-w-full tw-align-middle">
      <table className="tw-min-w-full">
        <tbody className="tw-divide-y tw-divide-iron-800 tw-divide-solid tw-divide-x-0">
          {transactions.map((transaction) => (
            <UserPageStatsActivityWalletTableRow
              key={`${transaction.from_address}-${transaction.to_address}-${transaction.transaction}-${transaction.token_id}`}
              transaction={transaction}
              profile={profile}
              memes={memes}
              nextgenCollections={nextgenCollections}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
