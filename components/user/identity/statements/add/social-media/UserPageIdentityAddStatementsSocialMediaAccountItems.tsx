import {
  SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPE,
  SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES,
} from "../../../../../../helpers/Types";
import UserPageIdentityAddStatementsTypeButton from "../../utils/UserPageIdentityAddStatementsTypeButton";

export default function UserPageIdentityAddStatementsSocialMediaAccountItems({
  activeType,
  setSocialType,
}: {
  readonly activeType: SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPE;
  readonly setSocialType: (type: SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPE) => void;
}) {
  const firstRow = SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES.slice(
    0,
    +(SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES.length / 2).toFixed(0)
  );

  const secondRow = SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES.slice(
    +(SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES.length / 2).toFixed(0)
  );
  return (
    <div className="tw-mt-8">
      <span className="tw-isolate tw-inline-flex tw-rounded-md tw-shadow-sm tw-w-full">
        {firstRow.map((type, i) => (
          <UserPageIdentityAddStatementsTypeButton
            key={type}
            statementType={type}
            isActive={activeType === type}
            isFirst={i === 0}
            isLast={i === firstRow.length - 1}
            onClick={() => setSocialType(type)}
          />
        ))}
      </span>
      <span className="tw-mt-3 md:tw-mt-2 tw-isolate tw-inline-flex tw-rounded-md tw-shadow-sm tw-w-full">
        {secondRow.map((type, i) => (
          <UserPageIdentityAddStatementsTypeButton
            key={type}
            statementType={type}
            isActive={activeType === type}
            isFirst={i === 0}
            isLast={i === secondRow.length - 1}
            onClick={() => setSocialType(type)}
          />
        ))}
      </span>
    </div>
  );
}
