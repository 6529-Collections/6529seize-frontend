import { useContext, useState } from "react";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import { ProfileProxy } from "../../../../../generated/models/ProfileProxy";
import { ProfileProxyAction } from "../../../../../generated/models/ProfileProxyAction";
import { AuthContext } from "../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import {
  AcceptActionRequest,
  AcceptActionRequestActionEnum,
} from "../../../../../generated/models/AcceptActionRequest";
import { commonApiPost } from "../../../../../services/api/common-api";
import CircleLoader from "../../../../distribution-plan-tool/common/CircleLoader";
import {
  haveSeenProfileProxyActionAcceptanceModal,
  setSeenProfileProxyActionAcceptanceModal,
} from "../../../../../helpers/profile-proxy.helpers";
import HeaderProxyNewModal from "../../../../header/proxy/HeaderProxyNewModal";
import CommonAnimationWrapper from "../../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../../utils/animation/CommonAnimationOpacity";

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
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);

  const onAcceptanceModalClose = (setAsDontShowAgain: boolean) => {
    setShowAcceptanceModal(false);
    if (setAsDontShowAgain && connectedProfile?.profile?.external_id) {
      setSeenProfileProxyActionAcceptanceModal({
        profileId: connectedProfile.profile.external_id,
      });
    }
  };

  const onSuccessFullProxyAcceptance = () => {
    if (!connectedProfile?.profile?.external_id) {
      return;
    }
    const haveSeenModal = haveSeenProfileProxyActionAcceptanceModal({
      profileId: connectedProfile.profile.external_id,
    });
    if (haveSeenModal) {
      return;
    }
    setShowAcceptanceModal(true);
  };

  const profileProxyAcceptanceMutation = useMutation({
    mutationFn: async (body: AcceptActionRequest) => {
      return await commonApiPost<AcceptActionRequest, ProfileProxyAction>({
        endpoint: `proxies/${profileProxy.id}/actions/${action.id}/acceptance`,
        body,
      });
    },
    onSuccess: (_, variables) => {
      onProfileProxyModify({
        profileProxyId: profileProxy.id,
        grantedToHandle: profileProxy.granted_to.handle,
        createdByHandle: profileProxy.created_by.handle,
      });
      setToast({
        message: "Action status changed",
        type: "success",
      });
      if (variables.action === AcceptActionRequestActionEnum.Accept) {
        onSuccessFullProxyAcceptance();
      }
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
    <>
      <div className="tw-flex md:tw-justify-end">
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-y-2 tw-gap-x-2">
          <div className="tw-col-span-1">
            {possibleActions.includes(AcceptActionRequestActionEnum.Accept) && (
              <button
                onClick={() => onSubmit(AcceptActionRequestActionEnum.Accept)}
                disabled={submitting}
                type="button"
                className="tw-text-green tw-bg-transparent tw-px-3 tw-py-2 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 hover:tw-border-iron-800 tw-rounded-lg hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
              >
                {submitting ? <CircleLoader /> : "Accept"}
              </button>
            )}
          </div>
          <div className="tw-col-span-1">
            {possibleActions.includes(AcceptActionRequestActionEnum.Reject) && (
              <button
                onClick={() => onSubmit(AcceptActionRequestActionEnum.Reject)}
                type="button"
                disabled={submitting}
                className="tw-text-red tw-bg-transparent tw-px-3 tw-py-2 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 hover:tw-border-iron-800 tw-rounded-lg hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
              >
                {submitting ? <CircleLoader /> : "Reject"}
              </button>
            )}
            {possibleActions.includes(AcceptActionRequestActionEnum.Revoke) && (
              <button
                onClick={() => onSubmit(AcceptActionRequestActionEnum.Revoke)}
                disabled={submitting}
                type="button"
                className="tw-text-red tw-bg-transparent tw-px-3 tw-py-2 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 hover:tw-border-iron-800 tw-rounded-lg hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
              >
                {submitting ? <CircleLoader /> : "Revoke"}
              </button>
            )}
            {possibleActions.includes(
              AcceptActionRequestActionEnum.Restore
            ) && (
              <button
                onClick={() => onSubmit(AcceptActionRequestActionEnum.Restore)}
                disabled={submitting}
                type="button"
                className="tw-text-iron-300 tw-bg-transparent tw-px-3 tw-py-2 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 hover:tw-border-iron-800 tw-rounded-lg hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
              >
                {submitting ? <CircleLoader /> : "Restore"}
              </button>
            )}
          </div>
        </div>
      </div>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {showAcceptanceModal && !!connectedProfile && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <HeaderProxyNewModal
              onClose={onAcceptanceModalClose}
              connectedProfile={connectedProfile}
              proxyGrantor={profileProxy.created_by}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </>
  );
}
