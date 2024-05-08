import { useContext, useState } from "react";
import { ProfileProxy } from "../../../../../../../generated/models/ProfileProxy";
import { ProfileProxyAction } from "../../../../../../../generated/models/ProfileProxyAction";
import CommonTimeSelect from "../../../../../../utils/time/CommonTimeSelect";
import { AuthContext } from "../../../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../../../react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import {
  commonApiPost,
  commonApiPut,
} from "../../../../../../../services/api/common-api";
import { UpdateActionRequest } from "../../../../../../../generated/models/UpdateActionRequest";

export default function ProfileProxyEndTimeEdit({
  profileProxy,
  profileProxyAction,
  setViewMode,
}: {
  readonly profileProxy: ProfileProxy;
  readonly profileProxyAction: ProfileProxyAction;
  readonly setViewMode: () => void;
}) {
  const { requestAuth, setToast } = useContext(AuthContext);
  const { onProfileProxyModify } = useContext(ReactQueryWrapperContext);
  const [endTime, setEndTime] = useState<number | null>(
    profileProxyAction.end_time
  );
  const [submitting, setSubmitting] = useState(false);
  const profileProxyActionCreditMutation = useMutation({
    mutationFn: async (body: UpdateActionRequest) => {
      console.log(body);
      return await commonApiPut<UpdateActionRequest, ProfileProxyAction>({
        endpoint: `proxies/${profileProxy.id}/actions/${profileProxyAction.id}`,
        body,
      });
    },
    onSuccess: () => {
      onProfileProxyModify({
        profileProxyId: profileProxy.id,
        grantedToHandle: profileProxy.granted_to.handle,
        createdByHandle: profileProxy.created_by.handle,
      });
      setToast({
        message: "Action credit updated successfully!",
        type: "success",
      });
      setViewMode();
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setSubmitting(false);
    },
  });

  const onSubmit = async () => {
    if (!endTime) {
      return;
    }
    setSubmitting(true);
    const { success } = await requestAuth();
    if (!success) {
      setSubmitting(false);
      return;
    }

    await profileProxyActionCreditMutation.mutateAsync({
      end_time: endTime,
    });
  };
  return (
    <div>
      <button onClick={setViewMode}>Cancel</button>
      <CommonTimeSelect
        currentTime={profileProxyAction.end_time}
        onMillis={setEndTime}
      />
      <button onClick={onSubmit}>Update</button>
    </div>
  );
}
