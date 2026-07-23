"use client";

import { useContext, useState } from "react";
import CommonInput from "@/components/utils/input/CommonInput";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type { ApiProfileProxyAction } from "@/generated/models/ApiProfileProxyAction";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import { commonApiPut } from "@/services/api/common-api";
import { getToastErrorDetails } from "@/helpers/toast.helpers";

import Button from "@/components/utils/button/Button";
import type { ApiUpdateProxyActionRequest } from "@/generated/models/ApiUpdateProxyActionRequest";

export default function ProfileProxyCreditEdit({
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
  const [creditAmount, setCreditAmount] = useState<number>(
    profileProxyAction.credit_amount ?? 0
  );

  const isChangedAndValid =
    profileProxyAction.credit_amount !== creditAmount && creditAmount > 0;

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
        message: "Action credit updated.",
        type: "success",
      });
      setViewMode();
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't update the action credit.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
    },
    onSettled: () => {
      setSubmitting(false);
    },
  });

  const onSubmit = async () => {
    setSubmitting(true);
    const { success } = await requestAuth();
    if (!success) {
      setSubmitting(false);
      return;
    }
    await profileProxyActionCreditMutation.mutateAsync({
      credit_amount: creditAmount,
    });
  };

  return (
    <div className="tw-h-full tw-rounded-lg tw-bg-iron-900 tw-py-3 tw-ring-1 tw-ring-inset tw-ring-iron-600 xl:tw-h-14">
      <div className="tw-h-full tw-items-center tw-gap-x-3 tw-px-3 lg:tw-flex">
        <div className="tw-flex tw-w-full tw-flex-col tw-justify-between tw-gap-x-3 sm:tw-flex-row sm:tw-items-center">
          <div className="tw-w-full sm:tw-w-40">
            <CommonInput
              value={creditAmount.toString()}
              inputType="number"
              onChange={(newV) => setCreditAmount(parseInt(newV ?? "0"))}
              placeholder="Credit Amount"
              theme="light"
              size="sm"
            />
          </div>
          <div className="tw-mt-4 tw-flex tw-items-center tw-justify-end tw-gap-x-3 sm:tw-mt-0 sm:tw-justify-start">
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
              disabled={submitting || !isChangedAndValid}
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
