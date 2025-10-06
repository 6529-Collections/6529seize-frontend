"use client";

import { ApiWaveScope } from "@/generated/models/ApiWaveScope";
import WaveGroupTitle from "./WaveGroupTitle";
import WaveGroupEditButtons from "./edit/WaveGroupEditButtons";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { ApiWave } from "@/generated/models/ApiWave";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import WaveGroupScope from "./WaveGroupScope";
import useIsMobileDevice from "@/hooks/isMobileDevice";

export enum WaveGroupType {
  VIEW = "VIEW",
  DROP = "DROP",
  VOTE = "VOTE",
  CHAT = "CHAT",
  ADMIN = "ADMIN",
}

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
  const isMobile = useIsMobileDevice();
  const getShowEdit = () =>
    canEditWave({ connectedProfile, activeProfileProxy, wave });

  const canEditGroup = () => getShowEdit() && !scope.group?.is_direct_message;
  const [showEdit, setShowEdit] = useState(canEditGroup());
  useEffect(() => setShowEdit(canEditGroup()), [connectedProfile, wave]);

  return (
    <div className="tw-relative tw-group tw-text-sm tw-flex tw-items-center tw-justify-between tw-w-full tw-h-6">
      <div className="tw-flex tw-gap-x-4">
        <WaveGroupTitle type={type} />
        {showEdit && (
          <div
            className={
              isMobile ? "" : "tw-hidden desktop-hover:group-hover:tw-block"
            }>
            <WaveGroupEditButtons
              wave={wave}
              type={type}
              haveGroup={!!scope.group}
            />
          </div>
        )}
      </div>
      <div className="tw-flex tw-items-center tw-gap-x-2">
        {scope.group ? (
          <WaveGroupScope group={scope.group} />
        ) : (
          <span className="tw-font-medium tw-text-iron-200 tw-text-sm">
            Anyone
          </span>
        )}
      </div>
    </div>
  );
}
