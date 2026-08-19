import UserPageIdentityAddStatementsPlatformPicker from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsPlatformPicker";
import {
  CONTACT_STATEMENT_TYPES,
  type CONTACT_STATEMENT_TYPE,
} from "@/helpers/Types";

export default function UserPageIdentityAddStatementsContactItems({
  activeType,
  setContactType,
}: {
  readonly activeType: CONTACT_STATEMENT_TYPE;
  readonly setContactType: (type: CONTACT_STATEMENT_TYPE) => void;
}) {
  return (
    <UserPageIdentityAddStatementsPlatformPicker
      statementTypes={CONTACT_STATEMENT_TYPES}
      activeType={activeType}
      rowCount={1}
      onSelect={setContactType}
    />
  );
}
