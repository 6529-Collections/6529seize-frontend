import { useRouter } from "next/router";
import { ProfileActivityLogProxyCreated } from "../../../../entities/IProfile";
import CommonProfileLink from "../../../user/utils/CommonProfileLink";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";
import { UserPageTabType } from "../../../user/layout/UserPageTabs";

export default function ProfileActivityLogProxy({
  log,
}: {
  readonly log: ProfileActivityLogProxyCreated;
}) {
  const router = useRouter();
  const handleOrWallet = log.target_profile_handle ?? "";
  const isCurrentUser =
    (router.query.user as string)?.toLowerCase() ===
    handleOrWallet.toLowerCase();

  const tabTarget = UserPageTabType.PROXY;
  return (
    <>
      <ProfileActivityLogItemAction action="created proxy for" />
      <CommonProfileLink
        handleOrWallet={handleOrWallet}
        isCurrentUser={isCurrentUser}
        tabTarget={tabTarget}
      />
    </>
  );
}
