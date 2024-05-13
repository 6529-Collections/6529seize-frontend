import { useContext, useState } from "react";
import CommonInput from "../../../../../../utils/input/CommonInput";
import { ProfileProxy } from "../../../../../../../generated/models/ProfileProxy";
import { ProfileProxyAction } from "../../../../../../../generated/models/ProfileProxyAction";
import { AuthContext } from "../../../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../../../react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import { commonApiPut } from "../../../../../../../services/api/common-api";
import { UpdateActionRequest } from "../../../../../../../generated/models/UpdateActionRequest";

export default function ProfileProxyCreditEdit({
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
  const [creditAmount, setCreditAmount] = useState<number>(
    profileProxyAction.credit_amount ?? 0
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
    <div className="tw-h-full xl:tw-h-14 tw-rounded-lg tw-bg-iron-900">
      <div className="tw-h-full lg:tw-flex tw-items-center tw-justify-center tw-px-3 tw-gap-x-3">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <div className="tw-w-40">
            <CommonInput
              value={creditAmount.toString()}
              inputType="number"
              onChange={(newV) => setCreditAmount(parseInt(newV ?? "0"))}
              placeholder="Credit Amount"
              theme="light"
            />
          </div>
          <button
            onClick={onSubmit}
            type="button"
            className="tw-flex tw-items-center tw-justify-center tw-relative tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            Update
          </button>
        </div>
        <button
          onClick={setViewMode}
          type="button"
          aria-label="Cancel"
          title="Cancel"
          className="tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-900 tw-border-0 tw-text-iron-300 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
        >
          <svg
            className="tw-h-5 tw-w-5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
