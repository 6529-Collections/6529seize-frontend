"use client";

import { useContext, useState } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type { ApiProfileProxyAction } from "@/generated/models/ApiProfileProxyAction";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import type { AcceptActionRequest } from "@/generated/models/AcceptActionRequest";
import { AcceptActionRequestActionEnum } from "@/generated/models/AcceptActionRequest";
import { commonApiPost } from "@/services/api/common-api";
import Button from "@/components/utils/button/Button";
import {
  haveSeenProfileProxyActionAcceptanceModal,
  setSeenProfileProxyActionAcceptanceModal,
} from "@/helpers/profile-proxy.helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import HeaderProxyNewModal from "@/components/header/proxy/HeaderProxyNewModal";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";

export default function ProxyActionAcceptanceButton({
  action,
  profile,
  profileProxy,
}: {
  readonly action: ApiProfileProxyAction;
  readonly profile: ApiIdentity;
  readonly profileProxy: ApiProfileProxy;
}) {
  const { setToast, connectedProfile, requestAuth } = useContext(AuthContext);
  const { onProfileProxyModify } = useContext(ReactQueryWrapperContext);
  const getPossibleActions = (): AcceptActionRequestActionEnum[] => {
    if (!connectedProfile?.id) {
      return [];
    }

    if (connectedProfile.id !== profile.id) {
      return [];
    }

    if (connectedProfile.id === profileProxy.created_by.id) {
      if (action.revoked_at) {
        return [AcceptActionRequestActionEnum.Restore];
      }
      return [AcceptActionRequestActionEnum.Revoke];
    }

    if (connectedProfile.id === profileProxy.granted_to.id) {
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
    if (setAsDontShowAgain && connectedProfile?.id) {
      setSeenProfileProxyActionAcceptanceModal({
        profileId: connectedProfile.id,
      });
    }
  };

  const onSuccessFullProxyAcceptance = () => {
    if (!connectedProfile?.id) {
      return;
    }
    const haveSeenModal = haveSeenProfileProxyActionAcceptanceModal({
      profileId: connectedProfile.id,
    });
    if (haveSeenModal) {
      return;
    }
    setShowAcceptanceModal(true);
  };

  const profileProxyAcceptanceMutation = useMutation({
    mutationFn: async (body: AcceptActionRequest) => {
      return await commonApiPost<AcceptActionRequest, ApiProfileProxyAction>({
        endpoint: `proxies/${profileProxy.id}/actions/${action.id}/acceptance`,
        body,
      });
    },
    onSuccess: (_, variables) => {
      onProfileProxyModify({
        profileProxyId: profileProxy.id,
      });
      setToast({
        message: "Action status updated.",
        type: "success",
      });
      if (variables.action === AcceptActionRequestActionEnum.Accept) {
        onSuccessFullProxyAcceptance();
      }
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't update this action.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
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
        <div className="tw-grid tw-grid-cols-2 tw-gap-x-2 tw-gap-y-2 md:tw-grid-cols-1 lg:tw-grid-cols-2">
          <div className="tw-col-span-1">
            {possibleActions.includes(AcceptActionRequestActionEnum.Accept) && (
              <Button
                variant="success"
                size="sm"
                onClick={() => onSubmit(AcceptActionRequestActionEnum.Accept)}
                loading={submitting}
              >
                Accept
              </Button>
            )}
          </div>
          <div className="tw-col-span-1">
            {possibleActions.includes(AcceptActionRequestActionEnum.Reject) && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onSubmit(AcceptActionRequestActionEnum.Reject)}
                loading={submitting}
              >
                Reject
              </Button>
            )}
            {possibleActions.includes(AcceptActionRequestActionEnum.Revoke) && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onSubmit(AcceptActionRequestActionEnum.Revoke)}
                loading={submitting}
              >
                Revoke
              </Button>
            )}
            {possibleActions.includes(
              AcceptActionRequestActionEnum.Restore
            ) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSubmit(AcceptActionRequestActionEnum.Restore)}
                loading={submitting}
              >
                Restore
              </Button>
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
