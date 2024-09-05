import { useContext, useState } from "react";
import { Wave } from "../../../../../../../generated/models/Wave";
import { WaveGroupType } from "../WaveGroup";
import { useMutation } from "@tanstack/react-query";
import { CreateNewWave } from "../../../../../../../generated/models/CreateNewWave";
import { commonApiPost } from "../../../../../../../services/api/common-api";
import { ReactQueryWrapperContext } from "../../../../../../react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "../../../../../../auth/Auth";
import WaveGroupEditButton from "./WaveGroupEditButton";
import WaveGroupRemoveButton from "./WaveGroupRemoveButton";

export default function WaveGroupEditButtons({
  haveGroup,
  wave,
  type,
}: {
  readonly haveGroup: boolean;
  readonly wave: Wave;
  readonly type: WaveGroupType;
}) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const [mutating, setMutating] = useState(false);

  const editWaveMutation = useMutation({
    mutationFn: async (body: CreateNewWave) =>
      await commonApiPost<CreateNewWave, Wave>({
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

  const onEdit = async (body: CreateNewWave) => {
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

  return (
    <div className="tw-inline-flex tw-space-x-3">
      {!haveGroup && type !== WaveGroupType.ADMIN && (
        <WaveGroupRemoveButton wave={wave} type={type} onEdit={onEdit} />
      )}
      <WaveGroupEditButton wave={wave} type={type} onEdit={onEdit} />
    </div>
  );
}
