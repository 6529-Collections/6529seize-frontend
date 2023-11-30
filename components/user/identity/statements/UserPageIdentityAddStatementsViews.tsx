import { useState } from "react";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import UserPageIdentityAddStatementsSelect from "./UserPageIdentityAddStatementsSelect";
import UserPageIdentityAddStatementsContact from "./contact/UserPageIdentityAddStatementsContact";
import UserPageIdentityAddStatementsSocialMediaAccount from "./social-media/UserPageIdentityAddStatementsSocialMediaAccount";

export enum STATEMENT_ADD_VIEW {
  SELECT = "SELECT",
  SOCIAL_MEDIA_ACCOUNT = "SOCIAL_MEDIA_ACCOUNT",
  CONTACT = "CONTACT",
}

export default function UserPageIdentityAddStatementsViews({
  onClose,
}: {
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
        <UserPageIdentityAddStatementsSocialMediaAccount onClose={onClose} />
      );
    case STATEMENT_ADD_VIEW.CONTACT:
      return <UserPageIdentityAddStatementsContact onClose={onClose} />;
    default:
      assertUnreachable(activeView);
  }
}
