"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useIpfsService } from "@/components/ipfs/IPFSContext";
import {
    QueryKey,
    ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserSettingsImgSelectFile from "@/components/user/settings/UserSettingsImgSelectFile";
import UserSettingsImgSelectMeme, {
    MemeLite,
} from "@/components/user/settings/UserSettingsImgSelectMeme";
import UserSettingsSave from "@/components/user/settings/UserSettingsSave";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import { ApiCreateOrUpdateProfileRequest } from "@/entities/IProfile";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import {
    commonApiFetch,
    commonApiPost,
    commonApiPostForm,
} from "@/services/api/common-api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useContext, useEffect, useRef, useState } from "react";
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
        data: MemeLite[];
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

  const [selectedMeme, setSelectedMeme] = useState<MemeLite | null>(null);
  const [file, setFile] = useState<File | null>();
  const [error, setError] = useState<string | null>(null);

  const setSelectedMemeAndRemoveFile = (meme: MemeLite) => {
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
        message: "Profile updated",
        type: "success",
      });
      onClose();
    },
    onError: (error: unknown) => {
      setToast({
        message: error as string,
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
        message: "You must be logged in to save settings",
        type: "error",
      });
      return;
    }

    if (!file && !selectedMeme) {
      setError(null);
      setToast({
        message: "You must select an image",
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
    <div className="tw-relative tw-z-50">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-text-center sm:tw-items-center tw-p-2 lg:tw-p-0">
          <div
            ref={modalRef}
            className={`sm:tw-max-w-3xl md:tw-max-w-2xl tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6 lg:tw-p-8`}>
            <form onSubmit={onSubmit}>
              <UserSettingsImgSelectMeme
                memes={memes ?? []}
                onMeme={setSelectedMemeAndRemoveFile}
              />

              <div className="tw-inline-flex tw-items-center tw-my-2 tw-justify-center tw-w-full">
                <hr className="tw-w-full tw-h-px tw-border tw-bg-iron-800" />
                <span className="tw-absolute tw-px-3 tw-font-semibold tw-text-sm tw-uppercase tw-text-iron-300">
                  or
                </span>
              </div>

              <UserSettingsImgSelectFile
                imageToShow={imageToShow}
                setFile={setFileAndRemoveMeme}
              />
              {error && (
                <p className="tw-mt-3 tw-text-sm tw-text-red">{error}</p>
              )}
              <div className="tw-pt-6">
                <div className="sm:tw-flex sm:tw-flex-row-reverse tw-gap-x-3">
                  <UserSettingsSave
                    loading={saving}
                    disabled={!file && !selectedMeme}
                    title="Save PFP"
                  />
                  <SecondaryButton
                    disabled={saving}
                    onClicked={onClose}
                    className="tw-w-full sm:tw-w-auto tw-mt-3 sm:tw-mt-0">
                    Cancel
                  </SecondaryButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
