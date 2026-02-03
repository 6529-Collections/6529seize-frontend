"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserSettingsBackground from "@/components/user/settings/UserSettingsBackground";
import UserSettingsBannerImageInput from "@/components/user/settings/UserSettingsBannerImageInput";
import UserSettingsSave from "@/components/user/settings/UserSettingsSave";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import type { ApiCreateOrUpdateProfileRequest } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import {
  getBannerColorValue,
  getBannerImageUrl,
} from "@/helpers/profile-banner.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useKeyPressEvent } from "react-use";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";

type BannerEditMode = "gradient" | "image";
const bannerTabs: CommonSelectItem<BannerEditMode>[] = [
  { key: "gradient", label: "Gradient", value: "gradient" },
  { key: "image", label: "Image", value: "image" },
];

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

  const initialBannerImageUrl = getBannerImageUrl(profile?.banner1);
  const initialBanner1Color =
    getBannerColorValue(profile?.banner1) ?? defaultBanner1;
  const initialBanner2Color =
    getBannerColorValue(profile?.banner2) ?? defaultBanner2;

  const [editMode, setEditMode] = useState<BannerEditMode>(
    initialBannerImageUrl ? "image" : "gradient"
  );
  const [bgColor1, setBgColor1] = useState<string>(initialBanner1Color);
  const [bgColor2, setBgColor2] = useState<string>(initialBanner2Color);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(
    initialBannerImageUrl
      ? getScaledImageUri(initialBannerImageUrl, ImageScale.AUTOx800)
      : null
  );

  useEffect(() => {
    if (bannerFile) {
      const objectUrl = URL.createObjectURL(bannerFile);
      setBannerPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    setBannerPreviewUrl(
      initialBannerImageUrl
        ? getScaledImageUri(initialBannerImageUrl, ImageScale.AUTOx800)
        : null
    );
    return undefined;
  }, [bannerFile, initialBannerImageUrl]);

  const [isUploading, setIsUploading] = useState<boolean>(false);

  const profileHasImage = Boolean(initialBannerImageUrl);
  const hasGradientChanges =
    profileHasImage ||
    bgColor1 !== initialBanner1Color ||
    bgColor2 !== initialBanner2Color;
  const hasImageChanges = Boolean(bannerFile);
  const haveChanges =
    editMode === "gradient" ? hasGradientChanges : hasImageChanges;

  const updateUser = useMutation({
    mutationFn: async (body: ApiCreateOrUpdateProfileRequest) => {
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
  });

  const isSaving = isUploading || updateUser.isPending;

  const uploadBannerImage = async (): Promise<string | null> => {
    if (!bannerFile) {
      return initialBannerImageUrl;
    }
    try {
      setIsUploading(true);
      const uploaded = await multiPartUpload({
        file: bannerFile,
        path: "drop",
      });
      return uploaded.url;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload banner image";
      setToast({ message, type: "error" });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile.handle || !haveChanges) {
      return;
    }
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

    let banner1Value = bgColor1;
    let banner2Value: string | undefined = bgColor2;

    if (editMode === "image") {
      if (!bannerFile && !initialBannerImageUrl) {
        setToast({
          message: "Please select an image to use as your banner",
          type: "error",
        });
        return;
      }

      banner2Value = getBannerColorValue(profile.banner2) ?? undefined;
      const uploadedUrl = await uploadBannerImage();
      if (!uploadedUrl) {
        return;
      }
      banner1Value = uploadedUrl;
    }

    const body: ApiCreateOrUpdateProfileRequest = {
      handle: profile.handle,
      classification: profile.classification,
      banner_1: banner1Value,
      banner_2: banner2Value,
    };

    if (profile.pfp) {
      body.pfp_url = profile.pfp;
    }

    await updateUser.mutateAsync(body);
  };

  if (typeof document === "undefined") {
    return null;
  }

  const dialogTitleId = "user-page-header-edit-banner-title";

  return createPortal(
    <dialog
      open
      aria-modal="true"
      aria-labelledby={dialogTitleId}
      className="tailwind-scope tw-m-0 tw-h-[100dvh] tw-w-screen tw-cursor-default tw-border-0 tw-bg-transparent tw-p-0"
      style={{ inset: 0, position: "fixed", zIndex: 1100 }}
    >
      <button
        type="button"
        aria-label="Close edit banner modal"
        className="tw-absolute tw-inset-0 tw-cursor-pointer tw-border-none tw-bg-gray-600 tw-bg-opacity-50 tw-p-0 tw-backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="tw-relative tw-flex tw-min-h-full tw-w-full tw-items-center tw-justify-center tw-overflow-y-auto tw-p-2 lg:tw-p-4">
        <div
          ref={modalRef}
          className="tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-p-6 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-max-w-3xl md:tw-max-w-2xl lg:tw-p-8"
        >
          <h2 id={dialogTitleId} className="tw-sr-only">
            Edit Banner
          </h2>
          <form onSubmit={onSubmit} className="tw-flex tw-flex-col tw-gap-y-6">
            <div>
              <p className="tw-mb-1 tw-text-lg tw-font-semibold tw-text-iron-50 sm:tw-text-xl">
                Edit profile cover
              </p>
              <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                Choose a gradient or upload an image for your profile cover.
              </p>
            </div>

            <CommonTabs<BannerEditMode>
              items={bannerTabs}
              activeItem={editMode}
              setSelected={setEditMode}
              filterLabel="Banner editor mode"
              fill={false}
            />

            {editMode === "gradient" ? (
              <UserSettingsBackground
                bgColor1={bgColor1}
                bgColor2={bgColor2}
                setBgColor1={setBgColor1}
                setBgColor2={setBgColor2}
              />
            ) : (
              <UserSettingsBannerImageInput
                imageToShow={bannerPreviewUrl}
                setFile={setBannerFile}
              />
            )}

            <div className="tw-pt-6">
              <div className="tw-gap-x-3 sm:tw-flex sm:tw-flex-row-reverse">
                <UserSettingsSave loading={isSaving} disabled={!haveChanges} />
                <SecondaryButton
                  disabled={isSaving}
                  onClicked={onClose}
                  className="tw-mt-3 tw-w-full sm:tw-mt-0 sm:tw-w-auto"
                >
                  Cancel
                </SecondaryButton>
              </div>
            </div>
          </form>
        </div>
      </div>
    </dialog>,
    document.body
  );
}
