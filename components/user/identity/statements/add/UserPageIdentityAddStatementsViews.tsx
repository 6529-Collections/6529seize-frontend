import { useState } from "react";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import UserPageIdentityAddStatementsSelect from "./UserPageIdentityAddStatementsSelect";
import UserPageIdentityAddStatementsContact from "./contact/UserPageIdentityAddStatementsContact";
import UserPageIdentityAddStatementsSocialMediaAccount from "./social-media/UserPageIdentityAddStatementsSocialMediaAccount";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import UserPageIdentityAddStatementsSocialMediaPosts from "./social-media-verification-posts/UserPageIdentityAddStatementsSocialMediaPosts";

export enum STATEMENT_ADD_VIEW {
  SELECT = "SELECT",
  CONTACT = "CONTACT",
  SOCIAL_MEDIA_ACCOUNT = "SOCIAL_MEDIA_ACCOUNT",
  SOCIAL_MEDIA_VERIFICATION_POST = "SOCIAL_MEDIA_VERIFICATION_POST",
}

export default function UserPageIdentityAddStatementsViews({
  profile,
  onClose,
}: {
  profile: IProfileAndConsolidations;
  onClose: () => void;
}) {
  const [activeView, setActiveView] = useState<STATEMENT_ADD_VIEW>(
    STATEMENT_ADD_VIEW.SELECT
  );

  switch (activeView) {
    case STATEMENT_ADD_VIEW.SELECT:
      return (
        <UserPageIdentityAddStatementsSelect
          onClose={onClose}
          onViewChange={setActiveView}
        />
      );
    case STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT:
      return (
        <UserPageIdentityAddStatementsSocialMediaAccount
          profile={profile}
          onClose={onClose}
        />
      );
    case STATEMENT_ADD_VIEW.CONTACT:
      return (
        <UserPageIdentityAddStatementsContact
          profile={profile}
          onClose={onClose}
        />
      );
    case STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST:
      return (
        <UserPageIdentityAddStatementsSocialMediaPosts
          profile={profile}
          onClose={onClose}
        />
      );
    default:
      assertUnreachable(activeView);
  }
}
