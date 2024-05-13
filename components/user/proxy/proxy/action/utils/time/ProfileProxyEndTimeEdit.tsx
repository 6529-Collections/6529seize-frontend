import { useContext, useState } from "react";
import { ProfileProxy } from "../../../../../../../generated/models/ProfileProxy";
import { ProfileProxyAction } from "../../../../../../../generated/models/ProfileProxyAction";
import CommonTimeSelect from "../../../../../../utils/time/CommonTimeSelect";
import { AuthContext } from "../../../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../../../react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import { commonApiPut } from "../../../../../../../services/api/common-api";
import { UpdateActionRequest } from "../../../../../../../generated/models/UpdateActionRequest";
import ProxyCreateActionConfigEndTimeSwitch from "../../../create-action/config/ProxyCreateActionConfigEndTimeSwitch";

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
  const [isEndTimeDisabled, setIsEndTimeDisabled] = useState<boolean>(
    !profileProxyAction.end_time
  );
  const [endTime, setEndTime] = useState<number | null>(
    profileProxyAction.end_time
  );
  const [submitting, setSubmitting] = useState(false);
  const profileProxyActionCreditMutation = useMutation({
    mutationFn: async (body: UpdateActionRequest) => {
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
      <div className="tw-h-full tw-py-3 xl:tw-h-14 tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-600">
        <div className="tw-px-3 tw-w-full tw-h-full tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center lg:tw-justify-center tw-gap-x-3">
          <div className="tw-mb-3">
            <ProxyCreateActionConfigEndTimeSwitch
              isActive={isEndTimeDisabled}
              setIsActive={setIsEndTimeDisabled}
            />
          </div>
          <CommonTimeSelect
            currentTime={profileProxyAction.end_time}
            onMillis={setEndTime}
            disabled={isEndTimeDisabled}
            inline={true}
          />
          <div className="tw-mt-5 sm:tw-mt-0 tw-flex tw-items-center tw-justify-end md:tw-justify-start tw-gap-x-3">
            <button
              onClick={setViewMode}
              type="button"
              aria-label="Cancel"
              title="Cancel"
              className="tw-w-full sm:tw-w-auto tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 hover:tw-bg-iron-700 tw-border tw-border-solid tw-border-iron-700 tw-text-iron-300 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              type="button"
              className="tw-w-full sm:tw-w-auto tw-flex tw-items-center tw-justify-center tw-relative tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
