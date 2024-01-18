import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import UserPageIdentityAddStatementsSelect from "./UserPageIdentityAddStatementsSelect";
import UserPageIdentityAddStatementsContact from "./contact/UserPageIdentityAddStatementsContact";
import UserPageIdentityAddStatementsSocialMediaAccount from "./social-media/UserPageIdentityAddStatementsSocialMediaAccount";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import UserPageIdentityAddStatementsSocialMediaPosts from "./social-media-verification-posts/UserPageIdentityAddStatementsSocialMediaPosts";
import { STATEMENT_ADD_VIEW } from "./UserPageIdentityAddStatements";
import UserPageIdentityAddStatementsNFTAccounts from "./nft-accounts/UserPageIdentityAddStatementsNFTAccounts";

export default function UserPageIdentityAddStatementsViews({
  profile,
  activeView,
  setActiveView,
  onClose,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly activeView: STATEMENT_ADD_VIEW;
  readonly setActiveView: (view: STATEMENT_ADD_VIEW) => void;
  readonly onClose: () => void;
}) {
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
    case STATEMENT_ADD_VIEW.NFT_ACCOUNT:
      return (
        <UserPageIdentityAddStatementsNFTAccounts
          onClose={onClose}
          profile={profile}
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
