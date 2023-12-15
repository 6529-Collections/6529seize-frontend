import { IProfileAndConsolidations } from "../../../../../../entities/IProfile";
import {
  STATEMENT_GROUP,
  STATEMENT_TYPE,
} from "../../../../../../helpers/Types";
import UserPageIdentityAddStatementsSocialMediaPostsHeader from "./UserPageIdentityAddStatementsSocialMediaPostsHeader";
import UserPageIdentityAddStatementsForm from "../../utils/UserPageIdentityAddStatementsForm";

export default function UserPageIdentityAddStatementsSocialMediaPosts({
  profile,
  onClose,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly onClose: () => void;
}) {
  return (
    <>
      <UserPageIdentityAddStatementsSocialMediaPostsHeader onClose={onClose} />
      <UserPageIdentityAddStatementsForm
        profile={profile}
        activeType={STATEMENT_TYPE.LINK}
        group={STATEMENT_GROUP.SOCIAL_MEDIA_VERIFICATION_POST}
        onClose={onClose}
      />
    </>
  );
}
