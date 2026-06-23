import type { NFTLite } from "@/components/user/settings/UserSettingsImgSelectMeme";
import type { NextGenCollection } from "@/entities/INextgen";
import type { Transaction } from "@/entities/ITransaction";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { getWalletActivityMessage } from "../wallet-activity.messages";
import UserPageStatsActivityWalletTableRow from "./row/UserPageStatsActivityWalletTableRow";

export default function UserPageStatsActivityWalletTable({
  transactions,
  profile,
  memes,
  memeLab,
  nextgenCollections,
  locale = DEFAULT_LOCALE,
}: {
  readonly transactions: Transaction[];
  readonly profile: ApiIdentity;
  readonly memes: NFTLite[];
  readonly memeLab: NFTLite[];
  readonly nextgenCollections: NextGenCollection[];
  readonly locale?: SupportedLocale | undefined;
}) {
  return (
    <div className="tw-mt-4 tw-inline-block tw-min-w-full tw-px-4 tw-pb-2 tw-align-middle sm:tw-px-6">
      <table className="tw-min-w-full">
        <caption className="tw-sr-only">
          {getWalletActivityMessage(
            "user.collected.stats.walletActivity.tableCaption",
            undefined,
            locale
          )}
        </caption>
        <tbody className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800">
          {transactions.map((transaction) => (
            <UserPageStatsActivityWalletTableRow
              key={`${transaction.from_address}-${transaction.to_address}-${transaction.transaction}-${transaction.token_id}`}
              transaction={transaction}
              profile={profile}
              memes={memes}
              memeLab={memeLab}
              nextgenCollections={nextgenCollections}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
