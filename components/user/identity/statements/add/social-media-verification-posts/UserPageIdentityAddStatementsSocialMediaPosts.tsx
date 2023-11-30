import { useState } from "react";
import { IProfileAndConsolidations } from "../../../../../../entities/IProfile";
import {
  SOCIAL_MEDIA_VERIFICATION_POSTS_STATEMENT_TYPE,
  STATEMENT_GROUP,
  STATEMENT_TYPE,
} from "../../../../../../helpers/Types";
import UserPageIdentityAddStatementsSocialMediaPostsHeader from "./UserPageIdentityAddStatementsSocialMediaPostsHeader";
import UserPageIdentityAddStatementsForm from "../../utils/UserPageIdentityAddStatementsForm";

export default function UserPageIdentityAddStatementsSocialMediaPosts({
  profile,
  onClose,
}: {
  profile: IProfileAndConsolidations;
  onClose: () => void;
}) {
  const [postType, setPostType] =
    useState<SOCIAL_MEDIA_VERIFICATION_POSTS_STATEMENT_TYPE>(
      STATEMENT_TYPE.LINK
    );

  const group = STATEMENT_GROUP.SOCIAL_MEDIA_VERIFICATION_POST;
  return (
    <>
      <UserPageIdentityAddStatementsSocialMediaPostsHeader onClose={onClose} />
      <UserPageIdentityAddStatementsForm
        profile={profile}
        activeType={postType}
        group={group}
        onClose={onClose}
      />
    </>
  );
}
