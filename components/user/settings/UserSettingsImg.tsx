import { FormEvent, useContext, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import {
  commonApiFetch,
  commonApiPostForm,
} from "../../../services/api/common-api";
import UserSettingsImgSelectMeme from "./UserSettingsImgSelectMeme";
import { AuthContext } from "../../auth/Auth";
import UserSettingsImgSelectFile from "./UserSettingsImgSelectFile";
import UserSettingsSave from "./UserSettingsSave";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";

export interface MemeLite {
  animation: any;
  contract: string;
  icon: string | null;
  id: 1;
  image: string | null;
  name: string | null;
  scaled: string | null;
  thumbnail: string | null;
}

export default function UserSettingsImg({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const { onProfileEdit } = useContext(ReactQueryWrapperContext);
  const [memes, setMemes] = useState<MemeLite[]>([]);

  useEffect(() => {
    const getMemes = async () => {
      const memesResponse = await commonApiFetch<{
        count: number;
        data: MemeLite[];
        next: string | null;
        page: number;
      }>({
        endpoint: "memes_lite",
      });
      setMemes(memesResponse.data);
    };
    getMemes();
  }, []);

  const [imageToShow, setImageToShow] = useState<string | null>(
    profile.profile?.pfp_url ?? null
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

  const onSave = async () => {
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
    setSaving(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append("pfp", file);
      }
      if (selectedMeme) {
        formData.append("meme", selectedMeme.id.toString());
      }
      await commonApiPostForm<{ pfp_url: string }>({
        endpoint: `profiles/${profile.profile?.handle}/pfp`,
        body: formData,
      });
      onProfileEdit({ profile, previousProfile: null });
      setFile(null);
      setSelectedMeme(null);
      setToast({
        message: "Profile updated",
        type: "success",
      });
    } catch (e: any) {
      setToast({
        message: e?.message ?? "Something went wrong",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <div className="tw-bg-iron-900 tw-border tw-border-solid tw-border-iron-800 tw-p-4 sm:tw-p-6 lg:tw-p-8 tw-rounded-lg">
      <form onSubmit={onSubmit}>
        <UserSettingsImgSelectMeme
          memes={memes}
          onMeme={setSelectedMemeAndRemoveFile}
        />

        <div className="tw-inline-flex tw-items-center tw-my-2 tw-justify-center tw-w-full">
          <hr className="tw-w-full tw-h-px tw-border tw-bg-iron-700" />
          <span className="tw-absolute tw-px-3 tw-font-medium tw-text-sm tw-uppercase tw-text-iron-50">
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
  );
}
