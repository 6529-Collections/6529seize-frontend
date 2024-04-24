import { useState } from "react";
import ProxyCreateTargetSearch from "./ProxyCreateTargetSearch";
import ProxyCreateTargetSelectType from "./ProxyCreateTargetSelectType";
import { ProxyTargetType } from "../../../../../../entities/IProxy";
import { CommunityMemberMinimal } from "../../../../../../entities/IProfile";
import CommonChangeAnimation from "../../../../../utils/animation/CommonChangeAnimation";

export default function ProxyCreateTarget() {
  const [selectedTargetType, setSelectedTargetType] = useState(
    ProxyTargetType.PROFILE
  );
  const [selectedTarget, setSelectedTarget] =
    useState<CommunityMemberMinimal | null>(null);

  const onTargetTypeChange = (targetType: ProxyTargetType) => {
    setSelectedTargetType(targetType);
    setSelectedTarget(null);
  };
  return (
    <div>
      <ProxyCreateTargetSelectType
        selectedTargetType={selectedTargetType}
        setSelectedTargetType={onTargetTypeChange}
      />
      <CommonChangeAnimation>
        {!selectedTarget ? (
          <div className="tw-mt-5">
            <ProxyCreateTargetSearch onTargetSelect={setSelectedTarget} />
          </div>
        ) : (
          <div className="tw-inline-flex tw-space-x-4">
            <div>{selectedTarget.handle}</div>
            <button onClick={() => setSelectedTarget(null)}>X</button>
          </div>
        )}
      </CommonChangeAnimation>
    </div>
  );
}
