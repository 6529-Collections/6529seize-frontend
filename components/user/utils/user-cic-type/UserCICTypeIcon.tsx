import { useEffect, useState } from "react";
import { CICType } from "../../../../entities/IProfile";
import { cicToType } from "../../../../helpers/Helpers";
import UserCICAccurateIcon from "./UserCICAccurateIcon";
import UserCICUnknownIcon from "./UserCICUnknownIcon";
import UserCICInaccurateIcon from "./UserCICInaccurateIcon";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import UserCICProbablyAccurateIcon from "./UserCICProbablyAccurateIcon";
import UserCICHighlyAccurateIcon from "./UserCICHighlyAccurateIcon";

export default function UserCICTypeIcon({ cic }: { cic: number }) {
  const [cicType, setCicType] = useState<CICType>(cicToType(cic));
  useEffect(() => {
    setCicType(cicToType(cic));
  }, [cic]);

  switch (cicType) {
    case CICType.INACCURATE:
      return <UserCICInaccurateIcon />;
    case CICType.UNKNOWN:
      return <UserCICUnknownIcon />;
    case CICType.PROBABLY_ACCURATE:
      return <UserCICProbablyAccurateIcon />;
    case CICType.ACCURATE:
      return <UserCICAccurateIcon />;
    case CICType.HIGHLY_ACCURATE:
      return <UserCICHighlyAccurateIcon />;
    default:
      assertUnreachable(cicType);
      return <UserCICUnknownIcon />;
  }
}
