import UserPageIdentityAddStatementsTypeButton from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsTypeButton";
import {
  NFT_ACCOUNTS_STATEMENT_TYPES,
  type NFT_ACCOUNTS_STATEMENT_TYPE,
} from "@/helpers/Types";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function UserPageIdentityAddStatementsNFTAccountItems({
  activeType,
  setType,
}: {
  readonly activeType: NFT_ACCOUNTS_STATEMENT_TYPE;
  readonly setType: (type: NFT_ACCOUNTS_STATEMENT_TYPE) => void;
}) {
  const locale = useBrowserLocale();

  return (
    <div>
      <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
        {t(locale, "user.profile.identity.statements.selectPlatform")}
      </p>
      <div className="tw-grid tw-grid-cols-2 tw-gap-2">
        {NFT_ACCOUNTS_STATEMENT_TYPES.map((type) => (
          <UserPageIdentityAddStatementsTypeButton
            key={type}
            statementType={type}
            isActive={activeType === type}
            onClick={() => setType(type)}
          />
        ))}
      </div>
    </div>
  );
}
