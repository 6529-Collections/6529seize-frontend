"use client";

import { useState } from "react";
import { ApiIdentity } from "../../../../../../generated/models/ApiIdentity";
import UserPageIdentityAddStatementsNFTAccountHeader from "./UserPageIdentityAddStatementsNFTAccountHeader";
import {
  NFT_ACCOUNTS_STATEMENT_TYPE,
  STATEMENT_GROUP,
  STATEMENT_TYPE,
} from "../../../../../../helpers/Types";
import UserPageIdentityAddStatementsForm from "../../utils/UserPageIdentityAddStatementsForm";
import UserPageIdentityAddStatementsNFTAccountItems from "./UserPageIdentityAddStatementsNFTAccountItems";

export default function UserPageIdentityAddStatementsNFTAccounts({
  onClose,
  profile,
}: {
  readonly onClose: () => void;
  readonly profile: ApiIdentity;
}) {
  const [nftAccountType, setNFTAccountType] =
    useState<NFT_ACCOUNTS_STATEMENT_TYPE>(STATEMENT_TYPE.SUPER_RARE);

  const group = STATEMENT_GROUP.NFT_ACCOUNTS;

  return (
    <>
      <UserPageIdentityAddStatementsNFTAccountHeader onClose={onClose} />
      <UserPageIdentityAddStatementsNFTAccountItems
        activeType={nftAccountType}
        setType={setNFTAccountType}
      />
      <UserPageIdentityAddStatementsForm
        activeType={nftAccountType}
        group={group}
        profile={profile}
        onClose={onClose}
      />
    </>
  );
}
