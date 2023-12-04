import { useEffect, useState } from "react";
import {
  CICType,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import { cicToType } from "../../../../helpers/Helpers";
import UserCICAccurateIcon from "./UserCICAccurateIcon";
import UserCICUnknownIcon from "./UserCICUnknownIcon";
import UserCICInaccurateIcon from "./UserCICInaccurateIcon";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import UserCICProbablyAccurateIcon from "./UserCICProbablyAccurateIcon";
import UserCICHighlyAccurateIcon from "./UserCICHighlyAccurateIcon";

export default function UserCICTypeIcon({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  const [cicType, setCicType] = useState<CICType>(
    cicToType(profile.cic.cic_rating)
  );
  useEffect(() => {
    setCicType(cicToType(profile.cic.cic_rating));
  }, [profile]);

  switch (cicType) {
    case CICType.INACCURATE:
      return <UserCICInaccurateIcon profile={profile}/>;
    case CICType.UNKNOWN:
      return <UserCICUnknownIcon profile={profile} />;
    case CICType.PROBABLY_ACCURATE:
      return <UserCICProbablyAccurateIcon profile={profile} />;
    case CICType.ACCURATE:
      return <UserCICAccurateIcon profile={profile} />;
    case CICType.HIGHLY_ACCURATE:
      return <UserCICHighlyAccurateIcon profile={profile} />;
    default:
      assertUnreachable(cicType);
      return <UserCICUnknownIcon profile={profile} />;
  }
}
