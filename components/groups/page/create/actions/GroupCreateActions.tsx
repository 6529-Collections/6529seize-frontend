"use client";

import { useContext } from "react";
import { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { AuthContext } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import GroupCreateTest from "./GroupCreateTest";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import {
  SubmitArgs,
  useGroupMutations,
} from "@/hooks/groups/useGroupMutations";

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
        message: "Group created.",
        type: "success",
      });
      onCompleted();
      return;
    }

    if (result.reason === "auth") {
      return;
    }

    setToast({
      message: result.error,
      type: "error",
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
            }  tw-bg-gradient-to-b tw-p-[1px] tw-flex tw-rounded-lg`}>
            <button
              onClick={onSave}
              disabled={isActionsDisabled}
              type="button"
              className={`${
                isActionsDisabled
                  ? "tw-opacity-50 tw-text-iron-300"
                  : "tw-text-white hover:tw-bg-primary-600 hover:tw-border-primary-600"
              } tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out`}>
              <div className="tw-flex tw-items-center tw-justify-center tw-gap-x-2">
                {isSubmitting && <CircleLoader />}
                <span>Create</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
