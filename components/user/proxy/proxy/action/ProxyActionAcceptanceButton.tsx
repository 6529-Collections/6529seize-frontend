import { useContext, useState } from "react";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import { ProfileProxy } from "../../../../../generated/models/ProfileProxy";
import { ProfileProxyAction } from "../../../../../generated/models/ProfileProxyAction";
import { AuthContext } from "../../../../auth/Auth";
import { Time } from "../../../../../helpers/time";
import { ReactQueryWrapperContext } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import {
  AcceptActionRequest,
  AcceptActionRequestActionEnum,
} from "../../../../../generated/models/AcceptActionRequest";
import { commonApiPost } from "../../../../../services/api/common-api";

const ACTION_LABEL: Record<AcceptActionRequestActionEnum, string> = {
  [AcceptActionRequestActionEnum.Accept]: "Accept",
  [AcceptActionRequestActionEnum.Reject]: "Reject",
  [AcceptActionRequestActionEnum.Revoke]: "Revoke",
  [AcceptActionRequestActionEnum.Restore]: "Restore",
};

const ACTION_CLASSES: Record<AcceptActionRequestActionEnum, string> = {
  [AcceptActionRequestActionEnum.Accept]: "tw-text-green",
  [AcceptActionRequestActionEnum.Reject]: "tw-text-red",
  [AcceptActionRequestActionEnum.Revoke]: "tw-text-red",
  [AcceptActionRequestActionEnum.Restore]: "tw-text-green",
};

export default function ProxyActionAcceptanceButton({
  action,
  profile,
  profileProxy,
}: {
  readonly action: ProfileProxyAction;
  readonly profile: IProfileAndConsolidations;
  readonly profileProxy: ProfileProxy;
}) {
  const { setToast, connectedProfile, requestAuth } = useContext(AuthContext);
  const { onProfileProxyModify } = useContext(ReactQueryWrapperContext);
  const getPossibleActions = (): AcceptActionRequestActionEnum[] => {
    if (!connectedProfile?.profile?.external_id) {
      return [];
    }

    if (connectedProfile.profile.external_id !== profile.profile?.external_id) {
      return [];
    }

    if (action.end_time && action.end_time < Time.currentMillis()) {
      return [];
    }
    if (connectedProfile.profile.external_id === profileProxy.created_by.id) {
      if (action.revoked_at) {
        return [AcceptActionRequestActionEnum.Restore];
      }
      return [AcceptActionRequestActionEnum.Revoke];
    }

    if (connectedProfile.profile.external_id === profileProxy.granted_to.id) {
      if (!action.accepted_at && !action.rejected_at) {
        return [
          AcceptActionRequestActionEnum.Accept,
          AcceptActionRequestActionEnum.Reject,
        ];
      } else if (action.accepted_at) {
        return [AcceptActionRequestActionEnum.Reject];
      } else if (action.rejected_at) {
        return [AcceptActionRequestActionEnum.Accept];
      }
    }
    return [];
  };

  const possibleActions = getPossibleActions();

  const [submitting, setSubmitting] = useState(false);
  const profileProxyAcceptanceMutation = useMutation({
    mutationFn: async (body: AcceptActionRequest) => {
      return await commonApiPost<AcceptActionRequest, ProfileProxyAction>({
        endpoint: `proxies/${profileProxy.id}/actions/${action.id}/acceptance`,
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
        message: "Action status changed",
        type: "success",
      });
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

  const onSubmit = async (actionType: AcceptActionRequestActionEnum) => {
    setSubmitting(true);
    const { success } = await requestAuth();
    if (!success) {
      setSubmitting(false);
      return;
    }
    await profileProxyAcceptanceMutation.mutateAsync({ action: actionType });
  };

  return (
    <div className="tw-flex tw-justify-end">
      {possibleActions.map((action) => (
        <button
          key={action}
          onClick={() => onSubmit(action)}
          type="button"
          className={`${ACTION_CLASSES[action]} tw-bg-transparent tw-px-3 tw-py-2 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 hover:tw-border-iron-800 tw-rounded-lg hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out`}
        >
          {ACTION_LABEL[action]}
        </button>
      ))}
    </div>
  );
}
