import { useContext, useEffect, useState } from "react";
import { ApiCreateGroup } from "../../../../../generated/models/ApiCreateGroup";
import { AuthContext } from "../../../../auth/Auth";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../services/api/common-api";
import { ApiGroupFull } from "../../../../../generated/models/ApiGroupFull";
import CircleLoader from "../../../../distribution-plan-tool/common/CircleLoader";
import GroupCreateTest from "./GroupCreateTest";
import { ReactQueryWrapperContext } from "../../../../react-query-wrapper/ReactQueryWrapper";
import SecondaryButton from "../../../../utils/button/SecondaryButton";

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

  const getIsActionsDisabled = () => {
    if (
      groupConfig.group.identity_addresses?.length &&
      groupConfig.group.identity_addresses.length > 10000
    ) {
      return true;
    }
    if (
      groupConfig.group.excluded_identity_addresses?.length &&
      groupConfig.group.excluded_identity_addresses.length > 1000
    ) {
      return true;
    }
    if (groupConfig.group.identity_addresses?.length) {
      return false;
    }
    if (
      groupConfig.group.level.min !== null ||
      groupConfig.group.level.max !== null
    ) {
      return false;
    }
    if (
      groupConfig.group.tdh.min !== null ||
      groupConfig.group.tdh.max !== null
    ) {
      return false;
    }
    if (
      groupConfig.group.rep.min !== null ||
      groupConfig.group.rep.max !== null
    ) {
      return false;
    }
    if (
      groupConfig.group.rep.user_identity !== null ||
      groupConfig.group.rep.category !== null
    ) {
      return false;
    }
    if (
      groupConfig.group.cic.min !== null ||
      groupConfig.group.cic.max !== null
    ) {
      return false;
    }
    if (groupConfig.group.cic.user_identity !== null) {
      return false;
    }
    if (groupConfig.group.owns_nfts.length) {
      return false;
    }

    return true;
  };

  const [isActionsDisabled, setIsActionsDisabled] = useState<boolean>(
    getIsActionsDisabled()
  );

  useEffect(() => setIsActionsDisabled(getIsActionsDisabled()), [groupConfig]);

  const [mutating, setMutating] = useState<boolean>(false);

  const makeFilterVisibleMutation = useMutation({
    mutationFn: async (param: {
      id: string;
      body: { visible: true; old_version_id: string | null };
    }) =>
      await commonApiPost<
        { visible: true; old_version_id: string | null },
        ApiGroupFull
      >({
        endpoint: `groups/${param.id}/visible`,
        body: param.body,
      }),
    onSuccess: (response) => {
      setToast({
        message: "Group created.",
        type: "success",
      });
      onGroupCreate();
      onCompleted();
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const createNewFilterMutation = useMutation({
    mutationFn: async (body: ApiCreateGroup) =>
      await commonApiPost<ApiCreateGroup, ApiGroupFull>({
        endpoint: `groups`,
        body,
      }),
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
      setMutating(false);
    },
  });

  const onSave = async (): Promise<void> => {
    if (mutating) {
      return;
    }
    if (!groupConfig.name.length) {
      setToast({
        message: "Please name your group",
        type: "error",
      });
      return;
    }
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }
    const response = await createNewFilterMutation.mutateAsync(groupConfig);
    if (response) {
      await makeFilterVisibleMutation.mutateAsync({
        id: response.id,
        body: {
          visible: true,
          old_version_id:
            originalGroup &&
            originalGroup.created_by?.handle?.toLowerCase() ===
              connectedProfile?.handle?.toLowerCase()
              ? originalGroup.id
              : null,
        },
      });
    }
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
            }  tw-bg-gradient-to-b tw-p-[1px] tw-flex tw-rounded-lg`}
          >
            <button
              onClick={onSave}
              disabled={isActionsDisabled}
              type="button"
              className={`${
                isActionsDisabled
                  ? "tw-opacity-50 tw-text-iron-300"
                  : "tw-text-white hover:tw-bg-primary-600 hover:tw-border-primary-600"
              } tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out`}
            >
              <div className="tw-flex tw-items-center tw-justify-center tw-gap-x-2">
                {mutating && <CircleLoader />}
                <span>Create</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
