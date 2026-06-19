"use client";

import { useContext } from "react";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { AuthContext } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import GroupCreateTest from "./GroupCreateTest";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import type { SubmitArgs } from "@/hooks/groups/useGroupMutations";
import { useGroupMutations } from "@/hooks/groups/useGroupMutations";

export default function GroupCreateActions({
  originalGroup,
  groupConfig,
  onCompleted,
}: {
  readonly originalGroup: ApiGroupFull | null;
  readonly groupConfig: ApiCreateGroup;
  readonly onCompleted: () => void;
}) {
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { onGroupCreate } = useContext(ReactQueryWrapperContext);
  const { validate, submit, isSubmitting } = useGroupMutations({
    requestAuth,
    onGroupCreate,
  });

  const validation = validate(groupConfig);
  const isActionsDisabled = !validation.valid || isSubmitting;
  const isEditMode = !!originalGroup;
  const submitLabel = isEditMode ? "Save" : "Create";
  const successMessage = isEditMode ? "Group saved." : "Group created.";

  const onSave = async (): Promise<void> => {
    if (isSubmitting) {
      return;
    }
    const submitArgs: SubmitArgs = {
      payload: groupConfig,
      previousGroup: originalGroup,
      currentHandle: connectedProfile?.handle ?? null,
    };
    const result = await submit(submitArgs);
    if (result.ok) {
      setToast({
        message: successMessage,
        type: "success",
      });
      onCompleted();
      return;
    }

    if (result.reason === "auth") {
      return;
    }

    setToast({
      type: "error",
      title: originalGroup
        ? "Couldn't save this group."
        : "Couldn't create this group.",
      description: "Please check the group setup and try again.",
      details: result.error,
    });
  };

  return (
    <div className="tw-mt-6">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
        <GroupCreateTest
          groupConfig={groupConfig}
          disabled={isActionsDisabled}
        />
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <SecondaryButton onClicked={() => onCompleted()}>
            Cancel
          </SecondaryButton>
          <div
            className={`${
              isActionsDisabled ? "" : "tw-from-primary-400 tw-to-primary-500"
            } tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-p-[1px]`}
          >
            <button
              onClick={onSave}
              disabled={isActionsDisabled}
              type="button"
              className={`${
                isActionsDisabled
                  ? "tw-text-iron-300 tw-opacity-50"
                  : "tw-text-white hover:tw-border-primary-600 hover:tw-bg-primary-600"
              } tw-flex tw-items-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-shadow-sm tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600`}
            >
              <div className="tw-flex tw-items-center tw-justify-center tw-gap-x-2">
                {isSubmitting && <CircleLoader />}
                <span>{submitLabel}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
