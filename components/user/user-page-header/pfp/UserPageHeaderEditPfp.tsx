import { FormEvent, useContext, useEffect, useRef, useState } from "react";
import {
  ApiCreateOrUpdateProfileRequest,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import { useClickAway, useKeyPressEvent } from "react-use";
import UserSettingsImgSelectMeme, {
  MemeLite,
} from "../../settings/UserSettingsImgSelectMeme";
import UserSettingsImgSelectFile from "../../settings/UserSettingsImgSelectFile";
import UserSettingsSave from "../../settings/UserSettingsSave";
import { AuthContext } from "../../../auth/Auth";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../../../react-query-wrapper/ReactQueryWrapper";
import {
  commonApiFetch,
  commonApiPost,
  commonApiPostForm,
} from "../../../../services/api/common-api";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";
import { useIpfsService } from "../../../ipfs/IPFSContext";

export default function UserPageHeaderEditPfp({
  profile,
  onClose,
}: {
  readonly profile: IProfileAndConsolidations;
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
    profile.profile?.pfp_url
      ? getScaledImageUri(profile.profile.pfp_url, ImageScale.W_200_H_200)
      : null
  );

  const [selectedMeme, setSelectedMeme] = useState<MemeLite | null>(null);
  const [file, setFile] = useState<File | null>();

  const setSelectedMemeAndRemoveFile = (meme: MemeLite) => {
    setSelectedMeme(meme);
    setFile(null);
  };

  const setFileAndRemoveMeme = (file: File) => {
    setFile(file);
    setSelectedMeme(null);
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
      if (pfp) {
        if (!profile.profile?.classification) {
          return;
        }
        const cid = await ipfsService.addFile(pfp as File);
        const ipfs = `ipfs://${cid}`;
        const ipfsBody: ApiCreateOrUpdateProfileRequest = {
          handle: profile.profile?.handle,
          classification: profile.profile?.classification,
          pfp_url: ipfs,
        };
        if (profile.profile?.banner_1) {
          ipfsBody.banner_1 = profile.profile?.banner_1;
        }
        if (profile.profile?.banner_2) {
          ipfsBody.banner_2 = profile.profile?.banner_2;
        }
        const response = await commonApiPost<
          ApiCreateOrUpdateProfileRequest,
          IProfileAndConsolidations
        >({
          endpoint: `profiles`,
          body: ipfsBody,
        });
        return response.profile?.pfp_url;
      } else {
        const response = await commonApiPostForm<{ pfp_url: string }>({
          endpoint: `profiles/${profile.input_identity}/pfp`,
          body: body,
        });
        return response.pfp_url;
      }
    },
    onSuccess: (pfp_url) => {
      onProfileEdit({
        profile: {
          ...profile,
          profile: profile.profile ? { ...profile.profile, pfp_url } : null,
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
      setToast({
        message: "You must select an image",
        type: "error",
      });
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
    <div className="tw-relative tw-z-10">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
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
              <div className="tw-pt-6">
                <UserSettingsSave
                  loading={saving}
                  disabled={!file && !selectedMeme}
                  title="Save PFP"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
