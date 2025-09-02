"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserSettingsClassification from "@/components/user/settings/UserSettingsClassification";
import UserSettingsSave from "@/components/user/settings/UserSettingsSave";
import { ApiCreateOrUpdateProfileRequest } from "@/entities/IProfile";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useContext, useEffect, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
export default function UserPageHeaderEditClassification({
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

  const [classification, setClassification] =
    useState<ApiProfileClassification>(
      profile.classification ?? ApiProfileClassification.Pseudonym
    );

  const [haveChanges, setHaveChanges] = useState<boolean>(false);

  useEffect(() => {
    setHaveChanges(classification !== profile.classification);
  }, [classification]);

  const [mutating, setMutating] = useState<boolean>(false);

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
    e.preventDefault();
    if (!profile.handle) {
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
      classification,
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
