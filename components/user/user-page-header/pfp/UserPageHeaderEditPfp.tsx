"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useIpfsService } from "@/components/ipfs/IPFSContext";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserSettingsImgSelectFile from "@/components/user/settings/UserSettingsImgSelectFile";
import type { NFTLite } from "@/components/user/settings/UserSettingsImgSelectMeme";
import UserSettingsImgSelectMeme from "@/components/user/settings/UserSettingsImgSelectMeme";
import Button from "@/components/utils/button/Button";
import type { ApiCreateOrUpdateProfileRequest } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import {
  commonApiFetch,
  commonApiPost,
  commonApiPostForm,
} from "@/services/api/common-api";
import { getUploadErrorMessage } from "@/services/api/upload-error";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { useContext, useEffect, useState } from "react";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";
export default function UserPageHeaderEditPfp({
  profile,
  isOpen = true,
  onAfterLeave,
  onBack,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly isOpen?: boolean;
  readonly onAfterLeave?: (() => void) | undefined;
  readonly onBack?: (() => void) | undefined;
  readonly onClose: () => void;
}) {
  const ipfsService = useIpfsService();

  const { setToast, requestAuth } = useContext(AuthContext);
  const { onProfileEdit } = useContext(ReactQueryWrapperContext);

  const { data: memes } = useQuery({
    queryKey: [QueryKey.MEMES_LITE],
    queryFn: async () => {
      const memesResponse = await commonApiFetch<{
        count: number;
        data: NFTLite[];
        next: string | null;
        page: number;
      }>({
        endpoint: "memes_lite",
      });
      return memesResponse.data;
    },
  });

  const [imageToShow, setImageToShow] = useState<string | null>(
    profile.pfp ? getScaledImageUri(profile.pfp, ImageScale.W_200_H_200) : null
  );

  const [selectedMeme, setSelectedMeme] = useState<NFTLite | null>(null);
  const [file, setFile] = useState<File | null>();
  const [error, setError] = useState<string | null>(null);

  const setSelectedMemeAndRemoveFile = (meme: NFTLite) => {
    setSelectedMeme(meme);
    setFile(null);
    setError(null);
  };

  const setFileAndRemoveMeme = (file: File) => {
    setFile(file);
    setSelectedMeme(null);
    setError(null);
  };

  useEffect(() => {
    if (file) {
      setImageToShow(URL.createObjectURL(file));
    } else if (selectedMeme) {
      setImageToShow(selectedMeme.scaled ?? selectedMeme.image);
    }
  }, [file, selectedMeme]);

  const [saving, setSaving] = useState<boolean>(false);

  const updatePfp = useMutation({
    mutationFn: async (body: FormData) => {
      setSaving(true);
      const pfp = body.get("pfp");
      if (!profile.handle) {
        throw new Error("Profile handle is required");
      }
      if (pfp) {
        if (!profile.classification) {
          return;
        }
        const cid = await ipfsService.addFile(pfp as File);
        const ipfs = `ipfs://${cid}`;
        const ipfsBody: ApiCreateOrUpdateProfileRequest = {
          handle: profile.handle,
          classification: profile.classification,
          pfp_url: ipfs,
        };
        if (profile?.banner1) {
          ipfsBody.banner_1 = profile?.banner1;
        }
        if (profile?.banner2) {
          ipfsBody.banner_2 = profile?.banner2;
        }
        const response = await commonApiPost<
          ApiCreateOrUpdateProfileRequest,
          ApiIdentity
        >({
          endpoint: `profiles`,
          body: ipfsBody,
        });
        return response?.pfp;
      } else {
        const response = await commonApiPostForm<{ pfp_url: string }>({
          endpoint: `profiles/${profile.query}/pfp`,
          body: body,
        });
        return response.pfp_url;
      }
    },
    onSuccess: (pfp_url) => {
      onProfileEdit({
        profile: {
          ...profile,
          pfp: pfp_url ?? null,
        },
        previousProfile: null,
      });
      setFile(null);
      setSelectedMeme(null);
      setToast({
        message: "Profile updated.",
        type: "success",
      });
      onClose();
    },
    onError: (error: unknown) => {
      setToast({
        message: getUploadErrorMessage(error),
        type: "error",
      });
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { success } = await requestAuth();
    if (!success) {
      setToast({
        message: "Log in to save settings.",
        type: "error",
      });
      return;
    }

    if (!file && !selectedMeme) {
      setError(null);
      setToast({
        message: "Select an image.",
        type: "error",
      });
      return;
    }

    if (file && file.size > 2097152) {
      setError("File size must be less than 2MB");
      return;
    }

    const formData = new FormData();
    if (file) {
      formData.append("pfp", file);
    }
    if (selectedMeme) {
      formData.append("meme", selectedMeme.id.toString());
    }
    await updatePfp.mutateAsync(formData);
  };

  return (
    <MobileWrapperDialog
      title={getUserProfileHeaderMessage("user.profileHeader.edit.pfp")}
      isOpen={isOpen}
      onClose={onClose}
      onBack={onBack}
      onAfterLeave={onAfterLeave}
      tabletModal
      showHeaderCloseButton
      showScrollbar
      maxWidthClass="md:tw-max-w-2xl"
      headerClassName="-tw-mt-2 tw-pb-4 md:tw-mt-0"
    >
      <form onSubmit={onSubmit} className="tw-px-4 sm:tw-px-6">
        <UserSettingsImgSelectMeme
          memes={memes ?? []}
          onMeme={setSelectedMemeAndRemoveFile}
        />

        <div className="tw-my-5 tw-flex tw-w-full tw-items-center tw-gap-3">
          <span className="tw-h-px tw-flex-1 tw-bg-white/5" />
          <span className="tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-[0.16em] tw-text-iron-600">
            or
          </span>
          <span className="tw-h-px tw-flex-1 tw-bg-white/5" />
        </div>

        <UserSettingsImgSelectFile
          imageToShow={imageToShow}
          setFile={setFileAndRemoveMeme}
        />
        {error && (
          <p
            role="alert"
            className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-error/20 tw-bg-error/10 tw-px-3 tw-py-2 tw-text-sm tw-text-error"
          >
            {error}
          </p>
        )}
        <div className="tw-flex tw-flex-col tw-gap-2 tw-pt-5 md:tw-flex-row-reverse md:tw-justify-start">
          <Button
            type="submit"
            variant="action"
            size="lg"
            loading={saving}
            disabled={!file && !selectedMeme}
            fullWidth
            className="md:tw-w-auto"
          >
            Save PFP
          </Button>
          <Button
            variant="secondary"
            size="lg"
            disabled={saving}
            onClick={onClose}
            fullWidth
            className="tw-hidden md:tw-inline-flex md:tw-w-auto"
          >
            Cancel
          </Button>
        </div>
      </form>
    </MobileWrapperDialog>
  );
}
