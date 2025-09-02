"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserSettingsSave from "@/components/user/settings/UserSettingsSave";
import UserSettingsUsername from "@/components/user/settings/UserSettingsUsername";
import { ApiCreateOrUpdateProfileRequest } from "@/entities/IProfile";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
export default function UserPageHeaderEditName({
  profile,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const { setToast, requestAuth } = useContext(AuthContext);
  const { onProfileEdit } = useContext(ReactQueryWrapperContext);
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const params = useParams();

  const [userName, setUserName] = useState<string>(profile.handle ?? "");

  const [haveChanges, setHaveChanges] = useState<boolean>(false);

  useEffect(() => {
    setHaveChanges(userName !== profile.handle);
  }, [userName]);

  const [mutating, setMutating] = useState<boolean>(false);

  const updateUser = useMutation({
    mutationFn: async (body: ApiCreateOrUpdateProfileRequest) => {
      setMutating(true);
      return await commonApiPost<ApiCreateOrUpdateProfileRequest, ApiIdentity>({
        endpoint: `profiles`,
        body,
      });
    },
    onSuccess: async (updatedProfile) => {
      setToast({
        message: "Profile updated.",
        type: "success",
      });
      const newPath = pathname.replace(
        params?.user?.toString() ?? "",
        updatedProfile.handle!?.toLowerCase()
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
      handle: userName,
      classification: profile.classification,
      pfp_url: profile.pfp ?? undefined,
    };

    if (profile.banner1) {
      body.banner_1 = profile.banner1;
    }

    if (profile.banner2) {
      body.banner_2 = profile.banner2;
    }

    if (profile.pfp) {
      body.pfp_url = profile.pfp;
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
                originalUsername={profile.handle ?? ""}
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
