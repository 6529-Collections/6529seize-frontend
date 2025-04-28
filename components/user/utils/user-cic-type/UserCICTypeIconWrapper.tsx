import { ApiIdentity } from "../../../../generated/models/ApiIdentity";
import Tippy from "@tippyjs/react";
import UserCICTypeIconTooltip from "./tooltip/UserCICTypeIconTooltip";
import UserCICTypeIcon from "./UserCICTypeIcon";

export default function UserCICTypeIconWrapper({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  return (
    <Tippy
      placement={"auto"}
      interactive={true}
      content={<UserCICTypeIconTooltip profile={profile} />}
    >
      <div>
        <UserCICTypeIcon cic={profile.cic} />
      </div>
    </Tippy>
  );
}
