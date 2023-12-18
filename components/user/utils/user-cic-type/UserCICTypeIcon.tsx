import { useEffect, useState } from "react";
import {
  CICType,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import { cicToType } from "../../../../helpers/Helpers";
import UserCICAccurateIcon from "./icons/UserCICAccurateIcon";
import UserCICUnknownIcon from "./icons/UserCICUnknownIcon";
import UserCICInaccurateIcon from "./icons/UserCICInaccurateIcon";
import UserCICProbablyAccurateIcon from "./icons/UserCICProbablyAccurateIcon";
import UserCICHighlyAccurateIcon from "./icons/UserCICHighlyAccurateIcon";
import Tippy from "@tippyjs/react";
import UserCICTypeIconTooltip from "./tooltip/UserCICTypeIconTooltip";

export default function UserCICTypeIcon({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const [cicType, setCicType] = useState<CICType>(
    cicToType(profile.cic.cic_rating)
  );
  useEffect(() => {
    setCicType(cicToType(profile.cic.cic_rating));
  }, [profile]);

  const COMPONENTS: Record<CICType, JSX.Element> = {
    [CICType.INACCURATE]: <UserCICInaccurateIcon />,
    [CICType.UNKNOWN]: <UserCICUnknownIcon />,
    [CICType.PROBABLY_ACCURATE]: <UserCICProbablyAccurateIcon />,
    [CICType.ACCURATE]: <UserCICAccurateIcon />,
    [CICType.HIGHLY_ACCURATE]: <UserCICHighlyAccurateIcon />,
  };

  return (
    <Tippy
      placement={"auto"}
      interactive={true}
      content={<UserCICTypeIconTooltip profile={profile} />}
    >
      <div>{COMPONENTS[cicType]}</div>
    </Tippy>
  );
}
