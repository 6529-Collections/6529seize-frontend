import UserPageIdentityAddStatementsPlatformPicker from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsPlatformPicker";
import {
  NFT_ACCOUNTS_STATEMENT_TYPES,
  type NFT_ACCOUNTS_STATEMENT_TYPE,
} from "@/helpers/Types";

export default function UserPageIdentityAddStatementsNFTAccountItems({
  activeType,
  setType,
}: {
  readonly activeType: NFT_ACCOUNTS_STATEMENT_TYPE;
  readonly setType: (type: NFT_ACCOUNTS_STATEMENT_TYPE) => void;
}) {
  return (
    <UserPageIdentityAddStatementsPlatformPicker
      statementTypes={NFT_ACCOUNTS_STATEMENT_TYPES}
      activeType={activeType}
      rowCount={2}
      onSelect={setType}
    />
  );
}
