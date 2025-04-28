import { useContext, useEffect, useRef, useState } from "react";
import { ApiCreateOrUpdateProfileRequest } from "../../../../entities/IProfile";
import { useClickAway, useKeyPressEvent } from "react-use";
import { AuthContext } from "../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import UserSettingsBackground from "../../settings/UserSettingsBackground";
import UserSettingsSave from "../../settings/UserSettingsSave";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../services/api/common-api";
import { ApiIdentity } from "../../../../generated/models/ApiIdentity";
export default function UserPageHeaderEditBanner({
  profile,
  defaultBanner1,
  defaultBanner2,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly defaultBanner1: string;
  readonly defaultBanner2: string;
  readonly onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const { setToast, requestAuth } = useContext(AuthContext);
  const { onProfileEdit } = useContext(ReactQueryWrapperContext);
  const [bgColor1, setBgColor1] = useState<string>(
    profile?.banner1 ?? defaultBanner1
  );
  const [bgColor2, setBgColor2] = useState<string>(
    profile?.banner2 ?? defaultBanner2
  );

  const [mutating, setMutating] = useState<boolean>(false);

  const [haveChanges, setHaveChanges] = useState<boolean>(false);

  useEffect(() => {
    setHaveChanges(
      bgColor1 !== profile?.banner1 || bgColor2 !== profile?.banner2
    );
  }, [profile, bgColor1, bgColor2]);

  const updateUser = useMutation({
    mutationFn: async (body: ApiCreateOrUpdateProfileRequest) => {
      setMutating(true);
      return await commonApiPost<ApiCreateOrUpdateProfileRequest, ApiIdentity>({
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
    if (!profile.handle) {
      return;
    }

    e.preventDefault();
    if (!profile.primary_wallet || !profile.classification) {
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
      handle: profile.handle,
      classification: profile.classification,
      banner_1: bgColor1,
      banner_2: bgColor2,
    };

    if (profile.pfp) {
      body.pfp_url = profile.pfp;
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
            className={`sm:tw-max-w-3xl md:tw-max-w-2xl tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6 lg:tw-p-8`}
          >
            <form
              onSubmit={onSubmit}
              className="tw-flex tw-flex-col tw-gap-y-6"
            >
              <UserSettingsBackground
                bgColor1={bgColor1}
                bgColor2={bgColor2}
                setBgColor1={setBgColor1}
                setBgColor2={setBgColor2}
              />

              <UserSettingsSave loading={mutating} disabled={!haveChanges} />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
