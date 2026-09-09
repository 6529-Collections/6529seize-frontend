"use client";

import { AuthContext } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserSettingsClassification from "@/components/user/settings/UserSettingsClassification";
import Button from "@/components/utils/button/Button";
import type { ApiCreateOrUpdateProfileRequest } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useContext, useState } from "react";
import { getUserProfileHeaderMessage } from "../../user-page-header.messages";
export default function UserPageHeaderEditClassification({
  profile,
  embedded = false,
  isOpen = true,
  onAfterLeave,
  onBack,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly embedded?: boolean;
  readonly isOpen?: boolean;
  readonly onAfterLeave?: (() => void) | undefined;
  readonly onBack?: (() => void) | undefined;
  readonly onClose: () => void;
}) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const { onProfileEdit } = useContext(ReactQueryWrapperContext);

  const [classification, setClassification] =
    useState<ApiProfileClassification>(
      profile.classification ?? ApiProfileClassification.Pseudonym
    );

  const haveChanges = classification !== profile.classification;

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
    if (!profile.handle) {
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

  const form = (
    <form
      onSubmit={onSubmit}
      className="tw-flex tw-flex-col tw-gap-y-5 tw-px-4 sm:tw-px-6"
    >
      <UserSettingsClassification
        selected={classification}
        onSelect={setClassification}
        inlineOptions
      />

      <div className="tw-flex tw-flex-col tw-gap-2 md:tw-flex-row-reverse md:tw-justify-start">
        <Button
          type="submit"
          variant="action"
          size="lg"
          loading={mutating}
          disabled={!haveChanges}
          fullWidth
          className="md:tw-w-auto"
        >
          Save
        </Button>
        <Button
          variant="secondary"
          size="lg"
          disabled={mutating}
          onClick={onClose}
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
      title={getUserProfileHeaderMessage(
        "user.profileHeader.edit.classification"
      )}
      isOpen={isOpen}
      onClose={onClose}
      onBack={onBack}
      onAfterLeave={onAfterLeave}
      tabletModal
      showHeaderCloseButton
      showHeaderDivider
      maxWidthClass="md:tw-max-w-xl"
    >
      {form}
    </MobileWrapperDialog>
  );
}
