import { useContext, useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../services/api/common-api";
import { AuthContext } from "../../../auth/Auth";
import CircleLoader from "../../../distribution-plan-tool/common/CircleLoader";
import { GroupFull } from "../../../../generated/models/GroupFull";
import { CreateGroup } from "../../../../generated/models/CreateGroup";
import { GroupDescription } from "../../../../generated/models/GroupDescription";
import { CreateGroupDescription } from "../../../../generated/models/CreateGroupDescription";

export default function GroupBuildSave({
  originalFilter,
  groupDescription,
  name,
  disabled,
  onSaved,
}: {
  readonly originalFilter: GroupFull | null;
  readonly groupDescription: CreateGroupDescription;
  readonly name: string;
  readonly disabled: boolean;
  readonly onSaved: (response: GroupFull) => void;
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
      onSaved(response);
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
    const response = await createNewFilterMutation.mutateAsync({
      name,
      group: groupDescription,
    });
    if (response) {
      await makeFilterVisibleMutation.mutateAsync({
        id: response.id,
        body: {
          visible: true,
          old_version_id:
            originalFilter &&
            originalFilter.created_by?.handle.toLowerCase() ===
              connectedProfile?.profile?.handle.toLowerCase()
              ? originalFilter.id
              : null,
        },
      });
    }
  };

  return (
    <button
      type="button"
      onClick={onSave}
      disabled={disabled}
      className={`${
        disabled
          ? "tw-opacity-50"
          : "hover:tw-bg-primary-600 hover:tw-border-primary-600"
      } tw-flex tw-w-[4rem] tw-items-center tw-justify-center tw-relative tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-bg-primary-500 tw-border-primary-500 `}
    >
      {mutating ? <CircleLoader /> : "Save"}
    </button>
  );
}
