"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserSettingsUsername from "@/components/user/settings/UserSettingsUsername";
import ActionButton from "@/components/utils/button/ActionButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import type { ApiCreateOrUpdateProfileRequest } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const haveChanges = userName !== (profile.handle ?? "");

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
        params?.["user"]?.toString() ?? "",
        updatedProfile.handle!?.toLowerCase()
      );
      await router.replace(newPath);
      onProfileEdit({ profile: updatedProfile, previousProfile: profile });
      onClose();
    },
    onError: (error: unknown) => {
      setToast({
        type: "error",
        title: "Couldn't update this profile.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
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
        message: "Log in to save settings.",
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

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1100] tw-cursor-default">
      <button
        type="button"
        aria-label="Close edit username modal"
        className="tw-absolute tw-inset-0 tw-cursor-pointer tw-border-none tw-bg-gray-600 tw-bg-opacity-50 tw-p-0"
        onClick={onClose}
      />
      <div className="tw-relative tw-flex tw-min-h-full tw-w-full tw-items-center tw-justify-center tw-overflow-y-auto tw-p-2 lg:tw-p-4">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label="Edit username"
          className="tw-w-full tw-rounded-xl tw-bg-iron-950 tw-p-6 tw-text-left tw-shadow-xl sm:tw-max-w-xl lg:tw-p-8"
        >
          <form onSubmit={onSubmit} className="tw-flex tw-flex-col tw-gap-y-5">
            <UserSettingsUsername
              userName={userName}
              originalUsername={profile.handle ?? ""}
              setUserName={setUserName}
              setIsAvailable={setAvailable}
              setIsLoading={setCheckingUsername}
            />

            <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row-reverse sm:tw-justify-start">
              <ActionButton
                type="submit"
                loading={mutating}
                disabled={!haveChanges || !available || checkingUsername}
                className="tw-min-h-11 tw-w-full sm:tw-w-auto"
              >
                Save
              </ActionButton>
              <SecondaryButton
                disabled={mutating}
                onClicked={onClose}
                className="tw-min-h-11 tw-w-full sm:tw-w-auto"
              >
                Cancel
              </SecondaryButton>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
