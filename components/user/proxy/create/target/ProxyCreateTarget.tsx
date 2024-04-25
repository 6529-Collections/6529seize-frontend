import ProxyCreateTargetSearch from "./ProxyCreateTargetSearch";
import { CommunityMemberMinimal } from "../../../../../entities/IProfile";
import CommonChangeAnimation from "../../../../utils/animation/CommonChangeAnimation";

export default function ProxyCreateTarget({
  selectedTarget,
  setSelectedTarget,
}: {
  readonly selectedTarget: CommunityMemberMinimal | null;
  readonly setSelectedTarget: (target: CommunityMemberMinimal | null) => void;
}) {
  return (
    <div>
      <CommonChangeAnimation>
        {!selectedTarget ? (
          <div className="tw-mt-5">
            <ProxyCreateTargetSearch
              selectedTarget={selectedTarget}
              onTargetSelect={setSelectedTarget}
            />
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
