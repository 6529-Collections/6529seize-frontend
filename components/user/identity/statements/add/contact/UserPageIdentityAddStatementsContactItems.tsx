import {
  CONTACT_STATEMENT_TYPE,
  CONTACT_STATEMENT_TYPES,
} from "../../../../../../helpers/Types";
import UserPageIdentityAddStatementsTypeButton from "../../utils/UserPageIdentityAddStatementsTypeButton";

export default function UserPageIdentityAddStatementsContactItems({
  activeType,
  setContactType,
}: {
  readonly activeType: CONTACT_STATEMENT_TYPE;
  readonly setContactType: (type: CONTACT_STATEMENT_TYPE) => void;
}) {
  return (
    <div className="tw-mt-8">
      <span className="tw-isolate tw-inline-flex tw-rounded-md tw-shadow-sm tw-w-full">
        {CONTACT_STATEMENT_TYPES.map((type, i) => (
          <UserPageIdentityAddStatementsTypeButton
            key={type}
            statementType={type}
            isActive={activeType === type}
            isFirst={i === 0}
            isLast={i === CONTACT_STATEMENT_TYPES.length - 1}
            onClick={() => setContactType(type)}
          />
        ))}
      </span>
    </div>
  );
}
