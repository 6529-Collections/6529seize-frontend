import { useState } from "react";
import { ProxyMode } from "../UserPageProxy";
import CommonProfileSearch from "../../../utils/input/profile-search/CommonProfileSearch";
import { CommunityMemberMinimal } from "../../../../entities/IProfile";

export default function ProxyCreate({
  onModeChange,
}: {
  readonly onModeChange: (mode: ProxyMode) => void;
}) {
  const [targetProfile, setTargetProfile] =
    useState<CommunityMemberMinimal | null>(null);
  return (
    <div>
      <button onClick={() => onModeChange(ProxyMode.LIST)}>CANCEL</button>
      <CommonProfileSearch
        value={targetProfile?.handle ?? null}
        placeholder="User"
        onProfileSelect={setTargetProfile}
      />
    </div>
  );
}
