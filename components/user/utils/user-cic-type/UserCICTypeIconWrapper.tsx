import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import Tippy from "@tippyjs/react";
import UserCICTypeIconTooltip from "./tooltip/UserCICTypeIconTooltip";
import UserCICTypeIcon from "./UserCICTypeIcon";

export default function UserCICTypeIconWrapper({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  return (
    <Tippy
      placement={"auto"}
      interactive={true}
      content={<UserCICTypeIconTooltip profile={profile} />}
    >
      <div>
        <UserCICTypeIcon cic={profile.cic.cic_rating} />
      </div>
    </Tippy>
  );
}
