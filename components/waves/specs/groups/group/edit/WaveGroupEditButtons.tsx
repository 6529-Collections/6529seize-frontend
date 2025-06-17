"use client";

import { useContext, useState } from "react";
import { ApiWave } from "../../../../../../generated/models/ApiWave";
import { WaveGroupType } from "../WaveGroup";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../../services/api/common-api";
import { ReactQueryWrapperContext } from "../../../../../react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "../../../../../auth/Auth";
import WaveGroupEditButton from "./WaveGroupEditButton";
import WaveGroupRemoveButton from "./WaveGroupRemoveButton";
import { ApiUpdateWaveRequest } from "../../../../../../generated/models/ApiUpdateWaveRequest";
import CircleLoader from "../../../../../distribution-plan-tool/common/CircleLoader";

export default function WaveGroupEditButtons({
  haveGroup,
  wave,
  type,
}: {
  readonly haveGroup: boolean;
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
}) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const [mutating, setMutating] = useState(false);

  const editWaveMutation = useMutation({
    mutationFn: async (body: ApiUpdateWaveRequest) =>
      await commonApiPost<ApiUpdateWaveRequest, ApiWave>({
        endpoint: `waves/${wave.id}`,
        body,
      }),
    onSuccess: () => {
      onWaveCreated();
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onEdit = async (body: ApiUpdateWaveRequest) => {
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setToast({
        type: "error",
        message: "Failed to authenticate",
      });
      setMutating(false);
      return;
    }
    await editWaveMutation.mutateAsync(body);
  };

  if (mutating) {
    return <CircleLoader />;
  }

  return (
    <div className="tw-flex tw-items-center tw-space-x-4">
      <WaveGroupEditButton wave={wave} type={type} onEdit={onEdit} />
      {haveGroup && type !== WaveGroupType.ADMIN && (
        <WaveGroupRemoveButton wave={wave} type={type} onEdit={onEdit} />
      )}
    </div>
  );
}
