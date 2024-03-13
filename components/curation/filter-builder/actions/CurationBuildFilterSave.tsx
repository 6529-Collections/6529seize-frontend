import { useContext, useState } from "react";
import {
  CurationFilterRequest,
  CurationFilterResponse,
  GeneralFilter,
} from "../../../../helpers/filters/Filters.types";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../services/api/common-api";
import { AuthContext } from "../../../auth/Auth";

export default function CurationBuildFilterSave({
  originalFilter,
  filters,
  name,
  onSaved,
}: {
  readonly originalFilter: CurationFilterResponse | null;
  readonly filters: GeneralFilter;
  readonly name: string;
  readonly onSaved: (response: CurationFilterResponse) => void;
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
        CurationFilterResponse
      >({
        endpoint: `community-members-curation/${param.id}/visible`,
        body: param.body,
      }),
    onSuccess: (response) => {
      setToast({
        message: "Curation filter created.",
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
    mutationFn: async (body: CurationFilterRequest) =>
      await commonApiPost<CurationFilterRequest, CurationFilterResponse>({
        endpoint: `community-members-curation`,
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
      criteria: filters,
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

  return <button type="button" onClick={onSave} className="tw-flex tw-items-center tw-justify-center tw-relative tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-bg-primary-500 tw-border-primary-500 hover:tw-bg-primary-600 hover:tw-border-primary-600">Save</button>;
}
