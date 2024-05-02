import { useContext, useEffect, useRef, useState } from "react";
import {
  ApiCreateOrUpdateProfileRequest,
  IProfileAndConsolidations,
  PROFILE_CLASSIFICATION,
} from "../../../../../entities/IProfile";
import { useClickAway, useKeyPressEvent } from "react-use";
import { AuthContext } from "../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../react-query-wrapper/ReactQueryWrapper";
import UserSettingsSave from "../../../settings/UserSettingsSave";
import UserSettingsClassification from "../../../settings/UserSettingsClassification";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../services/api/common-api";

export default function UserPageHeaderEditClassification({
  profile,
  onClose,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const { setToast, requestAuth } = useContext(AuthContext);
  const { onProfileEdit } = useContext(ReactQueryWrapperContext);

  const [classification, setClassification] = useState<PROFILE_CLASSIFICATION>(
    profile.profile?.classification ?? PROFILE_CLASSIFICATION.PSEUDONYM
  );

  const [haveChanges, setHaveChanges] = useState<boolean>(false);

  useEffect(() => {
    setHaveChanges(classification !== profile.profile?.classification);
  }, [classification]);

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
      onClose();
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

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile.profile) {
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
      handle: profile.profile.handle,
      classification,
    };

    if (profile.profile?.banner_1) {
      body.banner_1 = profile.profile.banner_1;
    }

    if (profile.profile?.banner_2) {
      body.banner_2 = profile.profile.banner_2;
    }

    await updateUser.mutateAsync(body);
  };

  return (
    <div className="tw-relative tw-z-10">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-text-center sm:tw-items-center tw-p-2 lg:tw-p-0">
          <div
            ref={modalRef}
            className={`tw-max-w-full md:tw-max-w-xl tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6 lg:tw-p-8`}>
            <form
              onSubmit={onSubmit}
              className="tw-flex tw-flex-col tw-gap-y-6">
              <UserSettingsClassification
                selected={classification}
                onSelect={setClassification}
              />

              <UserSettingsSave loading={mutating} disabled={!haveChanges} />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
