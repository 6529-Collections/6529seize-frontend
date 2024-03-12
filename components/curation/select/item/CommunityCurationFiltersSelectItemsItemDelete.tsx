import { useMutation } from "@tanstack/react-query";
import { useContext, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import { commonApiPost } from "../../../../services/api/common-api";
import { CurationFilterResponse } from "../../../../helpers/filters/Filters.types";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveCurationFilterId,
  setActiveCurationFilterId,
} from "../../../../store/curationFilterSlice";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";

export default function CommunityCurationFiltersSelectItemsItemDelete({
  filterId,
}: {
  readonly filterId: string;
}) {
  const { requestAuth, setToast } = useContext(AuthContext);
  const { onCurationFilterRemoved } = useContext(ReactQueryWrapperContext);
  const activeCurationFilterId = useSelector(selectActiveCurationFilterId);
  const dispatch = useDispatch();
  const [mutating, setMutating] = useState<boolean>(false);
  const makeFilterNotVisibleMutation = useMutation({
    mutationFn: async (param: { id: string; body: { visible: false } }) =>
      await commonApiPost<{ visible: false }, CurationFilterResponse>({
        endpoint: `community-members-curation/${param.id}/visible`,
        body: param.body,
      }),
    onSuccess: () => {
      setToast({
        message: "Curation filter deleted.",
        type: "warning",
      });
      onCurationFilterRemoved({ filterId });
      if (activeCurationFilterId === filterId) {
        dispatch(setActiveCurationFilterId(null));
      }
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

  const onDelete = async () => {
    if (mutating) {
      return;
    }
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }
    await makeFilterNotVisibleMutation.mutateAsync({
      id: filterId,
      body: { visible: false },
    });
  };
  return (
    <button className="tw-text-xs tw-bg-blue-500" onClick={onDelete}>
      Delete
    </button>
  );
}
