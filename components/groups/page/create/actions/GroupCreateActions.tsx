"use client";

import { useContext } from "react";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { AuthContext } from "@/components/auth/Auth";
import GroupCreateTest from "./GroupCreateTest";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
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
    <div className="tw-sticky tw-bottom-0 tw-z-20 tw-mt-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-900 tw-bg-black/90 tw-py-3 tw-shadow-[0_-16px_30px_rgba(0,0,0,0.28)] tw-backdrop-blur-xl [.capacitor-native_&]:tw-bottom-20 [.capacitor-native_&]:tw-mb-[max(5px,env(safe-area-inset-bottom,0px))]">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
        <GroupCreateTest
          groupConfig={groupConfig}
          disabled={isActionsDisabled}
        />
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <Button
            onClick={onCompleted}
            disabled={isSubmitting}
            variant="secondary"
            size="md"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={isActionsDisabled}
            loading={isSubmitting}
            variant="action"
            size="md"
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
