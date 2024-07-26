import { useState } from "react";
import UserPageIdentityAddStatementsSocialMediaAccountHeader from "./UserPageIdentityAddStatementsSocialMediaAccountHeader";
import {
  SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPE,
  STATEMENT_GROUP,
  STATEMENT_TYPE,
} from "../../../../../../helpers/Types";
import UserPageIdentityAddStatementsSocialMediaAccountItems from "./UserPageIdentityAddStatementsSocialMediaAccountItems";
import UserPageIdentityAddStatementsForm from "../../utils/UserPageIdentityAddStatementsForm";
import { IProfileAndConsolidations } from "../../../../../../entities/IProfile";

export default function UserPageIdentityAddStatementsSocialMediaAccount({
  onClose,
  profile,
}: {
  readonly onClose: () => void;
  readonly profile: IProfileAndConsolidations;
}) {
  const [socialMediaType, setSocialMediaType] =
    useState<SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPE>(STATEMENT_TYPE.X);

  const group = STATEMENT_GROUP.SOCIAL_MEDIA_ACCOUNT;

  return (
    <>
      <UserPageIdentityAddStatementsSocialMediaAccountHeader
        onClose={onClose}
      />

      <UserPageIdentityAddStatementsSocialMediaAccountItems
        activeType={socialMediaType}
        setSocialType={setSocialMediaType}
      />

      <UserPageIdentityAddStatementsForm
        activeType={socialMediaType}
        group={group}
        profile={profile}
        onClose={onClose}
      />
    </>
  );
}
