"use client";

import { useContext, useState } from "react";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type { ApiProfileProxyAction } from "@/generated/models/ApiProfileProxyAction";
import CommonTimeSelect from "@/components/utils/time/CommonTimeSelect";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import { commonApiPut } from "@/services/api/common-api";

import ProxyCreateActionConfigEndTimeSwitch from "@/components/user/proxy/proxy/create-action/config/ProxyCreateActionConfigEndTimeSwitch";
import { Time } from "@/helpers/time";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { ApiUpdateProxyActionRequest } from "@/generated/models/ApiUpdateProxyActionRequest";

export default function ProfileProxyEndTimeEdit({
  profileProxy,
  profileProxyAction,
  setViewMode,
}: {
  readonly profileProxy: ApiProfileProxy;
  readonly profileProxyAction: ApiProfileProxyAction;
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

  const isChangedAndValid =
    profileProxyAction.end_time !== (isEndTimeDisabled ? null : endTime) &&
    (isEndTimeDisabled ||
      (endTime !== null && endTime >= Time.currentMillis()));

  const [submitting, setSubmitting] = useState(false);
  const profileProxyActionCreditMutation = useMutation({
    mutationFn: async (body: ApiUpdateProxyActionRequest) => {
      return await commonApiPut<
        ApiUpdateProxyActionRequest,
        ApiProfileProxyAction
      >({
        endpoint: `proxies/${profileProxy.id}/actions/${profileProxyAction.id}`,
        body,
      });
    },
    onSuccess: () => {
      onProfileProxyModify({
        profileProxyId: profileProxy.id
      });
      setToast({
        message: "Action end time updated successfully!",
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
    if (!endTime && !isEndTimeDisabled) {
      return;
    }
    setSubmitting(true);
    const { success } = await requestAuth();
    if (!success) {
      setSubmitting(false);
      return;
    }

    await profileProxyActionCreditMutation.mutateAsync({
      end_time: isEndTimeDisabled ? null : endTime,
    });
  };

  return (
    <div>
      <div className="tw-h-full tw-py-3 xl:tw-h-14 tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-600">
        <div className="tw-px-3 tw-w-full tw-h-full tw-flex tw-flex-col sm:tw-flex-row md:tw-items-center sm:tw-justify-between tw-gap-x-3">
          <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-y-3 tw-gap-x-4 tw-w-full tw-h-full tw-items-center">
            <div className="tw-mb-3 tw-w-full md:tw-w-auto">
              <ProxyCreateActionConfigEndTimeSwitch
                isActive={isEndTimeDisabled}
                setIsActive={setIsEndTimeDisabled}
              />
            </div>
            {!isEndTimeDisabled && (
              <CommonTimeSelect
                currentTime={profileProxyAction.end_time}
                onMillis={setEndTime}
                disabled={isEndTimeDisabled}
                inline={true}
                size="sm"
              />
            )}
          </div>
          <div className="tw-mt-5 sm:tw-mt-8 md:tw-mt-0 tw-flex tw-items-center tw-justify-end md:tw-justify-start tw-gap-x-3">
            <button
              onClick={setViewMode}
              type="button"
              disabled={submitting}
              className="tw-w-full sm:tw-w-auto tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 hover:tw-bg-iron-700 tw-border tw-border-solid tw-border-iron-700 tw-text-iron-300 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out">
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={!isChangedAndValid || submitting}
              type="button"
              className={`${isChangedAndValid
                ? "hover:tw-bg-primary-600 hover:tw-border-primary-600"
                : "tw-opacity-50"
                } tw-w-full tw-flex tw-items-center tw-justify-center tw-relative tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out`}>
              <div className="tw-flex tw-items-center tw-space-x-2">
                {submitting && <CircleLoader size={CircleLoaderSize.SMALL} />}
                <span>Update</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
