import { useContext, useEffect, useRef, useState } from "react";
import {
  ApiCreateOrUpdateProfileRequest,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import { useClickAway, useKeyPressEvent } from "react-use";
import { AuthContext } from "../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import UserSettingsUsername from "../../settings/UserSettingsUsername";
import UserSettingsSave from "../../settings/UserSettingsSave";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../services/api/common-api";
import { useRouter } from "next/router";

export default function UserPageHeaderEditName({
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
  const router = useRouter();

  const [userName, setUserName] = useState<string>(
    profile.profile?.handle ?? ""
  );

  const [haveChanges, setHaveChanges] = useState<boolean>(false);

  useEffect(() => {
    setHaveChanges(userName !== profile.profile?.handle);
  }, [userName]);

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
    onSuccess: async (updatedProfile) => {
      setToast({
        message: "Profile updated.",
        type: "success",
      });
      const newPath = router.pathname.replace(
        "[user]",
        updatedProfile.profile?.handle!?.toLowerCase()
      );
      await router.replace(newPath);
      onProfileEdit({ profile: updatedProfile, previousProfile: profile });
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
      handle: userName,
      classification: profile.profile?.classification,
      pfp_url: profile.profile?.pfp_url,
    };

    if (profile.profile?.banner_1) {
      body.banner_1 = profile.profile?.banner_1;
    }

    if (profile.profile?.banner_2) {
      body.banner_2 = profile.profile?.banner_2;
    }

    if (profile.profile?.pfp_url) {
      body.pfp_url = profile.profile?.pfp_url;
    }

    await updateUser.mutateAsync(body);
  };

  const [available, setAvailable] = useState<boolean>(false);
  const [checkingUsername, setCheckingUsername] = useState<boolean>(false);

  return (
    <div className="tw-relative tw-z-10">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-text-center sm:tw-items-center tw-p-2 lg:tw-p-0">
          <div
            ref={modalRef}
            className={`tw-max-w-full md:tw-max-w-xl tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6 lg:tw-p-8`}>
            <form onSubmit={onSubmit} className="tw-flex tw-flex-col">
              <UserSettingsUsername
                userName={userName}
                originalUsername={profile.profile?.handle ?? ""}
                setUserName={setUserName}
                setIsAvailable={setAvailable}
                setIsLoading={setCheckingUsername}
              />

              <UserSettingsSave
                loading={mutating}
                disabled={!haveChanges || !available || checkingUsername}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
