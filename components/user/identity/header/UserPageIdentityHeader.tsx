import { useState } from "react";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import UserPageIdentityRateButton from "../../rate/UserPageIdentityRateButton";

export default function UserPageIdentityHeader({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  const [targetHandle, setTargetHandle] = useState<string | null>(
    profile.profile?.handle ?? null
  );
  return (
    <div>
      {targetHandle && (
        <UserPageIdentityRateButton targetHandle={targetHandle} />
      )}
    </div>
  );
}
