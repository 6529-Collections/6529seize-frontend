import { useEffect, useState } from "react";
import { ProxyMode } from "../UserPageProxy";
import ProxyCreateSubmit from "./ProxyCreateSubmit";
import ProxyCreateTarget from "./target/ProxyCreateTarget";
import { CommunityMemberMinimal } from "../../../../entities/IProfile";
import CommonChangeAnimation from "../../../utils/animation/CommonChangeAnimation";

export default function ProxyCreate({
  onModeChange,
}: {
  readonly onModeChange: (mode: ProxyMode) => void;
}) {
  const [selectedTarget, setSelectedTarget] =
    useState<CommunityMemberMinimal | null>(null);

  return (
    <div>
      <ProxyCreateTarget
        selectedTarget={selectedTarget}
        setSelectedTarget={setSelectedTarget}
      />
      <div className="tw-mt-6 tw-flex tw-items-center tw-gap-x-3">
        <button
          onClick={() => onModeChange(ProxyMode.LIST)}
          type="button"
          className="tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg hover:tw-bg-iron-800 hover:tw-border-iron-700 tw-transition tw-duration-300 tw-ease-out"
        >
          Cancel
        </button>
        <CommonChangeAnimation>
          {!!selectedTarget?.profile_id && (
            <ProxyCreateSubmit targetId={selectedTarget.profile_id} />
          )}
        </CommonChangeAnimation>
      </div>
    </div>
  );
}
