import UserPageIdentityAddStatementsPlatformPicker from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsPlatformPicker";
import {
  SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES,
  type SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPE,
} from "@/helpers/Types";

export default function UserPageIdentityAddStatementsSocialMediaAccountItems({
  activeType,
  setSocialType,
}: {
  readonly activeType: SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPE;
  readonly setSocialType: (type: SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPE) => void;
}) {
  return (
    <UserPageIdentityAddStatementsPlatformPicker
      statementTypes={SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES}
      activeType={activeType}
      rowCount={2}
      onSelect={setSocialType}
    />
  );
}
