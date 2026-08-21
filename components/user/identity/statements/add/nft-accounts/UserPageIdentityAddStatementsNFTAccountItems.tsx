import UserPageIdentityAddStatementsPlatformPicker from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsPlatformPicker";
import {
  NFT_ACCOUNTS_STATEMENT_TYPES,
  STATEMENT_TYPE,
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
    <UserPageIdentityAddStatementsPlatformPicker
      statementTypes={NFT_ACCOUNTS_STATEMENT_TYPES}
      activeType={activeType}
      rowCount={2}
      labelOverrides={{
        [STATEMENT_TYPE.LINK]: t(
          locale,
          "user.profile.identity.statements.otherPlatform"
        ),
      }}
      onSelect={setType}
    />
  );
}
