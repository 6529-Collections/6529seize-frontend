"use client";

import { useContext, useState } from "react";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type { ApiProfileProxyAction } from "@/generated/models/ApiProfileProxyAction";
import CommonTimeSelect from "@/components/utils/time/CommonTimeSelect";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import { commonApiPut } from "@/services/api/common-api";
import { getToastErrorDetails } from "@/helpers/toast.helpers";

import ProxyCreateActionConfigEndTimeSwitch from "@/components/user/proxy/proxy/create-action/config/ProxyCreateActionConfigEndTimeSwitch";
import { Time } from "@/helpers/time";
import Button from "@/components/utils/button/Button";
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
        profileProxyId: profileProxy.id,
      });
      setToast({
        message: "Action end time updated.",
        type: "success",
      });
      setViewMode();
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't update the action end time.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
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
      <div className="tw-h-full tw-rounded-lg tw-bg-iron-900 tw-py-3 tw-ring-1 tw-ring-inset tw-ring-iron-600 xl:tw-h-14">
        <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-gap-x-3 tw-px-3 sm:tw-flex-row sm:tw-justify-between md:tw-items-center">
          <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-gap-x-4 tw-gap-y-3 md:tw-flex-row">
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
          <div className="tw-mt-5 tw-flex tw-items-center tw-justify-end tw-gap-x-3 sm:tw-mt-8 md:tw-mt-0 md:tw-justify-start">
            <Button
              variant="secondary"
              size="sm"
              onClick={setViewMode}
              disabled={submitting}
              fullWidth
              className="sm:tw-w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="action"
              size="sm"
              onClick={onSubmit}
              disabled={!isChangedAndValid || submitting}
              loading={submitting}
              fullWidth
              className="sm:tw-w-auto"
            >
              Update
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
