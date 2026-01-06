import type {
  NFT_ACCOUNTS_STATEMENT_TYPE} from "@/helpers/Types";
import {
  NFT_ACCOUNTS_STATEMENT_TYPES,
} from "@/helpers/Types";
import UserPageIdentityAddStatementsTypeButton from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsTypeButton";

export default function UserPageIdentityAddStatementsNFTAccountItems({
  activeType,
  setType,
}: {
  readonly activeType: NFT_ACCOUNTS_STATEMENT_TYPE;
  readonly setType: (type: NFT_ACCOUNTS_STATEMENT_TYPE) => void;
}) {
  const firstRow = NFT_ACCOUNTS_STATEMENT_TYPES.slice(
    0,
    +(NFT_ACCOUNTS_STATEMENT_TYPES.length / 2).toFixed(0)
  );

  const secondRow = NFT_ACCOUNTS_STATEMENT_TYPES.slice(
    +(NFT_ACCOUNTS_STATEMENT_TYPES.length / 2).toFixed(0)
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
            onClick={() => setType(type)}
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
            onClick={() => setType(type)}
          />
        ))}
      </span>
    </div>
  );
}
