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

  if (!possibleActions.length) {
    return <></>;
  }

  return (
    <div>
      {possibleActions.map((possibleAction) => (
        <button key={possibleAction} onClick={() => onSubmit(possibleAction)}>
          {possibleAction}
        </button>
      ))}
    </div>
  );
}
