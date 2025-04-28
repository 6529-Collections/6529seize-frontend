import { useState } from "react";
import UserPageIdentityAddStatementsContactItems from "./UserPageIdentityAddStatementsContactItems";
import UserPageIdentityAddStatementsContactHeader from "./UserPageIdentityAddStatementsContactHeader";
import {
  CONTACT_STATEMENT_TYPE,
  STATEMENT_GROUP,
  STATEMENT_TYPE,
} from "../../../../../../helpers/Types";
import UserPageIdentityAddStatementsForm from "../../utils/UserPageIdentityAddStatementsForm";
import { ApiIdentity } from "../../../../../../generated/models/ApiIdentity";

export default function UserPageIdentityAddStatementsContact({
  profile,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly onClose: () => void;
}) {
  const [contactType, setContactType] = useState<CONTACT_STATEMENT_TYPE>(
    STATEMENT_TYPE.DISCORD
  );

  const group = STATEMENT_GROUP.CONTACT;

  return (
    <>
      <UserPageIdentityAddStatementsContactHeader onClose={onClose} />
      <UserPageIdentityAddStatementsContactItems
        activeType={contactType}
        setContactType={setContactType}
      />
      <UserPageIdentityAddStatementsForm
        profile={profile}
        activeType={contactType}
        group={group}
        onClose={onClose}
      />
    </>
  );
}
