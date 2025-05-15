import { CICType } from "../../../../entities/IProfile";
import { cicToType } from "../../../../helpers/Helpers";
import UserCICAccurateIcon from "./icons/UserCICAccurateIcon";
import UserCICUnknownIcon from "./icons/UserCICUnknownIcon";
import UserCICInaccurateIcon from "./icons/UserCICInaccurateIcon";
import UserCICProbablyAccurateIcon from "./icons/UserCICProbablyAccurateIcon";
import UserCICHighlyAccurateIcon from "./icons/UserCICHighlyAccurateIcon";

import type { JSX } from "react";

export default function UserCICTypeIcon({ cic }: { readonly cic: number }) {
  const COMPONENTS: Record<CICType, JSX.Element> = {
    [CICType.INACCURATE]: <UserCICInaccurateIcon />,
    [CICType.UNKNOWN]: <UserCICUnknownIcon />,
    [CICType.PROBABLY_ACCURATE]: <UserCICProbablyAccurateIcon />,
    [CICType.ACCURATE]: <UserCICAccurateIcon />,
    [CICType.HIGHLY_ACCURATE]: <UserCICHighlyAccurateIcon />,
  };

  return <div>{COMPONENTS[cicToType(cic)]}</div>;
}
