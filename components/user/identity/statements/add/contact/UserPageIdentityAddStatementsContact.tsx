"use client";

import { useState } from "react";
import UserPageIdentityAddStatementsContactItems from "./UserPageIdentityAddStatementsContactItems";
import UserPageIdentityAddStatementsContactHeader from "./UserPageIdentityAddStatementsContactHeader";
import type {
  CONTACT_STATEMENT_TYPE} from "@/helpers/Types";
import {
  STATEMENT_GROUP,
  STATEMENT_TYPE,
} from "@/helpers/Types";
import UserPageIdentityAddStatementsForm from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsForm";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

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
