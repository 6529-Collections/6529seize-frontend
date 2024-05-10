import { useContext, useState } from "react";
import CommonInput from "../../../../../../utils/input/CommonInput";
import { ProfileProxy } from "../../../../../../../generated/models/ProfileProxy";
import { ProfileProxyAction } from "../../../../../../../generated/models/ProfileProxyAction";
import { AuthContext } from "../../../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../../../react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import {
  commonApiPost,
  commonApiPut,
} from "../../../../../../../services/api/common-api";
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
    <div className="tw-absolute tw-top-0 tw-inset-x-0 tw-bg-iron-950 tw-bg-opacity-90 tw-backdrop-blur-sm tw-h-full lg:tw-h-14 tw-rounded-lg">
      <div className="tw-max-w-xs tw-h-full lg:tw-flex tw-items-center tw-justify-center tw-mx-auto tw-gap-x-2">
        <CommonInput
          value={creditAmount.toString()}
          inputType="number"
          onChange={(newV) => setCreditAmount(parseInt(newV ?? "0"))}
          placeholder="Credit Amount"
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
  );
}
