import { useContext, useState } from "react";
import { CreateGroup } from "../../../../generated/models/CreateGroup";
import { AuthContext } from "../../../auth/Auth";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../services/api/common-api";
import { GroupFull } from "../../../../generated/models/GroupFull";
import CircleLoader from "../../../distribution-plan-tool/common/CircleLoader";

export default function GroupCreateActions({
  groupConfig,
}: {
  readonly groupConfig: CreateGroup;
}) {
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);

  const [mutating, setMutating] = useState<boolean>(false);

  const makeFilterVisibleMutation = useMutation({
    mutationFn: async (param: {
      id: string;
      body: { visible: true; old_version_id: string | null };
    }) =>
      await commonApiPost<
        { visible: true; old_version_id: string | null },
        GroupFull
      >({
        endpoint: `groups/${param.id}/visible`,
        body: param.body,
      }),
    onSuccess: (response) => {
      setToast({
        message: "Group created.",
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
      setMutating(false);
    },
  });

  const createNewFilterMutation = useMutation({
    mutationFn: async (body: CreateGroup) =>
      await commonApiPost<CreateGroup, GroupFull>({
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
          old_version_id: null,
        },
      });
    }
  };

  return (
    <div className="tw-px-8 tw-pt-6 tw-mt-6 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-700">
      <div className="tw-flex tw-items-center tw-gap-x-3 tw-justify-end">
        {/* COMPONENDIKS - SECONDARYBUTTON */}
        <button
          type="button"
          className="tw-inline-flex tw-items-center tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg tw-bg-iron-800 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
        >
          Cancel
        </button>
        {/* COMPONENDIKS - PRIMARYBUTTON */}
        <button
          onClick={onSave}
          type="button"
          className="tw-inline-flex tw-items-center tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          {mutating ? <CircleLoader /> : "Create"}
        </button>
      </div>
    </div>
  );
}