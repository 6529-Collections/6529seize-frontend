import { useContext, useState } from "react";
import {
  ApiCreateOrUpdateProfileRequest,
  IProfileAndConsolidations,
  IProfileConsolidation,
} from "../../../../../entities/IProfile";
import { AuthContext } from "../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../services/api/common-api";
import CircleLoader from "../../../../distribution-plan-tool/common/CircleLoader";

export default function UserPageIdentityStatementsConsolidatedAddressesItemPrimary({
  isPrimary,
  canEdit,
  address,
  profile,
}: {
  readonly isPrimary: boolean;
  readonly address: IProfileConsolidation;
  readonly canEdit: boolean;
  readonly profile: IProfileAndConsolidations;
}) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const { onProfileEdit } = useContext(ReactQueryWrapperContext);

  const [mutating, setMutating] = useState<boolean>(false);

  const updateUser = useMutation({
    mutationFn: async (body: ApiCreateOrUpdateProfileRequest) => {
      setMutating(true);
      return await commonApiPost<
        ApiCreateOrUpdateProfileRequest,
        IProfileAndConsolidations
      >({
        endpoint: `profiles`,
        body,
      });
    },
    onSuccess: (updatedProfile) => {
      setToast({
        message: "Profile updated.",
        type: "success",
      });
      onProfileEdit({ profile: updatedProfile, previousProfile: null });
    },
    onError: (error: unknown) => {
      setToast({
        message: error as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onSave = async () => {
    if (!profile.profile?.primary_wallet || !profile.profile?.classification) {
      return;
    }

    const { success } = await requestAuth();
    if (!success) {
      setToast({
        message: "You must be logged in to save settings",
        type: "error",
      });
      return;
    }

    const body: ApiCreateOrUpdateProfileRequest = {
      handle: profile.profile?.handle,
      primary_wallet: address.wallet.address.toLowerCase(),
      classification: profile.profile?.classification,
      banner_1: profile.profile?.banner_1,
      banner_2: profile.profile?.banner_2,
    };

    await updateUser.mutateAsync(body);
  };

  if (isPrimary) {
    return (
      <span className="tw-ml-1 tw-text-xs tw-font-bold tw-text-neutral-500">
        Primary
      </span>
    );
  }

  if (canEdit) {
    return (
      <button
        disabled={mutating}
        onClick={onSave}
        className="tw-bg-transparent tw-border-none tw-ml-1 tw-text-xs tw-font-bold tw-text-neutral-500 hover:tw-text-primary-500"
      >
        {mutating ? <CircleLoader /> : "Make Primary"}
      </button>
    );
  }

  return null;
}
