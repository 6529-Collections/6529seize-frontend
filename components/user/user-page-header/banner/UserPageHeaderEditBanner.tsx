"use client";

import { AuthContext } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserSettingsBackground from "@/components/user/settings/UserSettingsBackground";
import UserSettingsBannerImageInput from "@/components/user/settings/UserSettingsBannerImageInput";
import UserSettingsSave from "@/components/user/settings/UserSettingsSave";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import Button from "@/components/utils/button/Button";
import type { ApiCreateOrUpdateProfileRequest } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import {
  getBannerColorValue,
  getBannerImageUrl,
} from "@/helpers/profile-banner.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useContext, useEffect, useRef, useState } from "react";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";

type BannerEditMode = "gradient" | "image";
const bannerTabs: CommonSelectItem<BannerEditMode>[] = [
  { key: "gradient", label: "Gradient", value: "gradient" },
  { key: "image", label: "Image", value: "image" },
];

export default function UserPageHeaderEditBanner({
  profile,
  defaultBanner1,
  defaultBanner2,
  embedded = false,
  isOpen = true,
  onAfterLeave,
  onBack,
  onBusyChange,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly defaultBanner1: string;
  readonly defaultBanner2: string;
  readonly embedded?: boolean;
  readonly isOpen?: boolean;
  readonly onAfterLeave?: (() => void) | undefined;
  readonly onBack?: (() => void) | undefined;
  readonly onBusyChange?: ((isBusy: boolean) => void) | undefined;
  readonly onClose: () => void;
}) {
  const isSavingRef = useRef(false);

  const handleClose = () => {
    if (!isSavingRef.current) {
      onClose();
    }
  };

  const { setToast, requestAuth } = useContext(AuthContext);
  const { onProfileEdit } = useContext(ReactQueryWrapperContext);

  const initialBannerImageUrl = getBannerImageUrl(profile.banner1);
  const initialBanner1Color =
    getBannerColorValue(profile.banner1) ?? defaultBanner1;
  const initialBanner2Color =
    getBannerColorValue(profile.banner2) ?? defaultBanner2;

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
  const [isSaving, setIsSaving] = useState(false);

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
    },
    onError: (error: unknown) => {
      setToast({
        type: "error",
        title: "Couldn't update this profile.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
    },
  });

  const setSavingState = (nextIsSaving: boolean) => {
    isSavingRef.current = nextIsSaving;
    setIsSaving(nextIsSaving);
    onBusyChange?.(nextIsSaving);
  };

  const uploadBannerImage = async (): Promise<string | null> => {
    if (!bannerFile) {
      return initialBannerImageUrl;
    }
    try {
      const uploaded = await multiPartUpload({
        file: bannerFile,
        path: "drop",
      });
      return uploaded.url;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to upload banner image";
      setToast({ message, type: "error" });
      return null;
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile.handle || !haveChanges) {
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

    if (editMode === "image" && !bannerFile && !initialBannerImageUrl) {
      setToast({
        message: getUserProfileHeaderMessage(
          "user.profileHeader.edit.bannerImageRequired"
        ),
        type: "error",
      });
      return;
    }

    setSavingState(true);
    try {
      let banner1Value = bgColor1;
      let banner2Value: string | undefined = bgColor2;

      if (editMode === "image") {
        banner2Value = undefined;
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
    } finally {
      setSavingState(false);
    }
    onClose();
  };

  const form = (
    <form
      onSubmit={onSubmit}
      className="tw-flex tw-flex-col tw-gap-y-5 tw-px-4 sm:tw-px-6"
    >
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

      <div className="tw-gap-x-3 md:tw-flex md:tw-flex-row-reverse">
        <UserSettingsSave
          loading={isSaving}
          disabled={!haveChanges}
          responsiveWidthClassName="md:tw-w-auto"
        />
        <Button
          variant="secondary"
          size="lg"
          disabled={isSaving}
          onClick={handleClose}
          fullWidth
          className="tw-hidden md:tw-inline-flex md:tw-w-auto"
        >
          Cancel
        </Button>
      </div>
    </form>
  );

  if (embedded) {
    return form;
  }

  return (
    <MobileWrapperDialog
      title={getUserProfileHeaderMessage("user.profileHeader.edit.banner")}
      isOpen={isOpen}
      onClose={handleClose}
      onBack={onBack}
      onAfterLeave={onAfterLeave}
      tabletModal
      showHeaderCloseButton
      showHeaderDivider
      showScrollbar
      maxWidthClass="md:tw-max-w-2xl"
      headerActions={
        <p className="tw-m-0 tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-400">
          {getUserProfileHeaderMessage(
            "user.profileHeader.edit.bannerDescription"
          )}
        </p>
      }
      dismissible={!isSaving}
    >
      {form}
    </MobileWrapperDialog>
  );
}
