"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useIpfsService } from "@/components/ipfs/IPFSContext";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserSettingsImgSelectFile from "@/components/user/settings/UserSettingsImgSelectFile";
import type { NFTLite } from "@/components/user/settings/UserSettingsImgSelectMeme";
import UserSettingsImgSelectMeme from "@/components/user/settings/UserSettingsImgSelectMeme";
import ActionButton from "@/components/utils/button/ActionButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
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
import { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useKeyPressEvent } from "react-use";
export default function UserPageHeaderEditPfp({
  profile,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

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

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1100] tw-cursor-default">
      <button
        type="button"
        aria-label="Close edit profile picture modal"
        className="tw-absolute tw-inset-0 tw-cursor-pointer tw-border-none tw-bg-black/70 tw-p-0 tw-backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="tw-relative tw-flex tw-min-h-full tw-w-full tw-items-center tw-justify-center tw-overflow-y-auto tw-p-2 lg:tw-p-4">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label="Edit profile picture"
          className="tw-w-full tw-transform tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/95 tw-p-5 tw-text-left tw-shadow-2xl tw-shadow-black/40 tw-backdrop-blur-xl tw-transition-all tw-duration-300 sm:tw-w-full sm:tw-max-w-3xl sm:tw-p-6 md:tw-max-w-2xl lg:tw-p-8"
        >
          <form onSubmit={onSubmit}>
            <UserSettingsImgSelectMeme
              memes={memes ?? []}
              onMeme={setSelectedMemeAndRemoveFile}
            />

            <div className="tw-my-5 tw-flex tw-w-full tw-items-center tw-gap-3">
              <span className="tw-h-px tw-flex-1 tw-bg-white/5" />
              <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-iron-600">
                or
              </span>
              <span className="tw-h-px tw-flex-1 tw-bg-white/5" />
            </div>

            <UserSettingsImgSelectFile
              imageToShow={imageToShow}
              setFile={setFileAndRemoveMeme}
            />
            {error && (
              <p className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-error/20 tw-bg-error/10 tw-px-3 tw-py-2 tw-text-sm tw-text-error">
                {error}
              </p>
            )}
            <div className="tw-pt-5">
              <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row-reverse sm:tw-justify-start">
                <ActionButton
                  type="submit"
                  loading={saving}
                  disabled={!file && !selectedMeme}
                  className="tw-min-h-11 tw-w-full sm:tw-w-auto"
                >
                  Save PFP
                </ActionButton>
                <SecondaryButton
                  disabled={saving}
                  onClicked={onClose}
                  className="tw-min-h-11 tw-w-full sm:tw-w-auto"
                >
                  Cancel
                </SecondaryButton>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
