import { ApiWaveScope } from "../../../../../generated/models/ApiWaveScope";
import WaveGroupTitle from "./WaveGroupTitle";
import WaveGroupEditButtons from "./edit/WaveGroupEditButtons";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../auth/Auth";
import { ApiWave } from "../../../../../generated/models/ApiWave";
import { canEditWave } from "../../../../../helpers/waves/waves.helpers";
import WaveGroupScope from "./WaveGroupScope";

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
  const getShowEdit = () =>
    canEditWave({ connectedProfile, activeProfileProxy, wave });

  const canEditGroup = () => getShowEdit() && !scope.group?.is_direct_message;
  const [showEdit, setShowEdit] = useState(canEditGroup());
  useEffect(() => setShowEdit(canEditGroup()), [connectedProfile, wave]);

  return (
    <div className="tw-group tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
      <WaveGroupTitle type={type} />
      <div className="tw-inline-flex tw-w-full tw-justify-between">
        <div className="tw-inline-flex tw-items-center tw-gap-x-2">
          {scope.group ? (
            <WaveGroupScope group={scope.group} />
          ) : (
            <span className="tw-font-medium tw-text-iron-200 tw-text-md">
              Anyone
            </span>
          )}
          {(!scope.group || isEligible) && (
            <div>
              <svg
                className="tw-size-4 tw-text-success"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22 11.0857V12.0057C21.9988 14.1621 21.3005 16.2604 20.0093 17.9875C18.7182 19.7147 16.9033 20.9782 14.8354 21.5896C12.7674 22.201 10.5573 22.1276 8.53447 21.3803C6.51168 20.633 4.78465 19.2518 3.61096 17.4428C2.43727 15.6338 1.87979 13.4938 2.02168 11.342C2.16356 9.19029 2.99721 7.14205 4.39828 5.5028C5.79935 3.86354 7.69279 2.72111 9.79619 2.24587C11.8996 1.77063 14.1003 1.98806 16.07 2.86572M22 4L12 14.01L9 11.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
        {showEdit && (
          <WaveGroupEditButtons
            wave={wave}
            type={type}
            haveGroup={!!scope.group}
          />
        )}
      </div>
    </div>
  );
}
