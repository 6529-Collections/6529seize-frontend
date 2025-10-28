"use client";

import type { ApiWaveScope } from "@/generated/models/ApiWaveScope";
import WaveGroupTitle from "./WaveGroupTitle";
import WaveGroupEditButtons from "./edit/WaveGroupEditButtons";
import { useContext } from "react";
import { AuthContext } from "@/components/auth/Auth";
import type { ApiWave } from "@/generated/models/ApiWave";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import WaveGroupScope from "./WaveGroupScope";
import { WaveGroupType } from "./WaveGroup.types";

export default function WaveGroup({
  scope,
  type,
  isEligible,
  wave,
}: {
  readonly scope: ApiWaveScope;
  readonly type: WaveGroupType;
  readonly isEligible: boolean;
  readonly wave: ApiWave;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const showEdit =
    canEditWave({ connectedProfile, activeProfileProxy, wave }) &&
    !scope.group?.is_direct_message;

  return (
    <div className="tw-relative tw-group tw-text-sm tw-flex tw-items-center tw-justify-between tw-w-full tw-h-6">
      <div className="tw-flex tw-gap-x-4">
        <WaveGroupTitle type={type} />
      </div>
      <div className="tw-flex tw-items-center tw-gap-x-2">
        {scope.group ? (
          <WaveGroupScope group={scope.group} />
        ) : (
          <span className="tw-font-medium tw-text-iron-200 tw-text-sm">
            Anyone
          </span>
        )}
        {showEdit && (
          <div className="tw-ml-1">
            <WaveGroupEditButtons
              wave={wave}
              type={type}
              haveGroup={!!scope.group}
            />
          </div>
        )}
      </div>
    </div>
  );
}
