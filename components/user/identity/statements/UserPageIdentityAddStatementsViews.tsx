import { useState } from "react";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import UserPageIdentityAddStatementsSelect from "./UserPageIdentityAddStatementsSelect";
import UserPageIdentityAddStatementsContact from "./contact/UserPageIdentityAddStatementsContact";
import UserPageIdentityAddStatementsSocialMediaAccount from "./social-media/UserPageIdentityAddStatementsSocialMediaAccount";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";

export enum STATEMENT_ADD_VIEW {
  SELECT = "SELECT",
  SOCIAL_MEDIA_ACCOUNT = "SOCIAL_MEDIA_ACCOUNT",
  CONTACT = "CONTACT",
}

export default function UserPageIdentityAddStatementsViews({
  profile,
  onClose,
}: {
  profile: IProfileAndConsolidations;
  onClose: () => void;
}) {
  const [activeView, setActiveView] = useState<STATEMENT_ADD_VIEW>(
    STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT
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
    default:
      assertUnreachable(activeView);
  }
}
