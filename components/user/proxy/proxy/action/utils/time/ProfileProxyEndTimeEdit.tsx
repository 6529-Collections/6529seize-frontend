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
      <div className="tw-absolute tw-z-[1] tw-top-0 tw-inset-x-0 tw-bg-iron-950 tw-bg-opacity-50 tw-backdrop-filter tw-backdrop-blur tw-h-14 tw-rounded-lg">
        <div className="tw-h-full tw-flex tw-items-center tw-justify-end tw-ml-auto tw-px-2 tw-gap-x-2">
          <CommonTimeSelect
            currentTime={profileProxyAction.end_time}
            onMillis={setEndTime}
          />
          <button
            onClick={setViewMode}
            type="button"
            className="tw-flex tw-items-center tw-justify-center tw-relative tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            type="button"
            className="tw-flex tw-items-center tw-justify-center tw-relative tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
