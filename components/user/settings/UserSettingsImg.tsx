import { FormEvent, useContext, useEffect, useRef, useState } from "react";
import { IProfile } from "../../../entities/IProfile";
import {
  commonApiFetch,
  commonApiPostForm,
} from "../../../services/api/common-api";
import UserSettingsImgSelectMeme from "./UserSettingsImgSelectMeme";
import { AuthContext } from "../../auth/Auth";
import UserSettingsImgSelectFile from "./UserSettingsImgSelectFile";
import UserSettingsSave from "./UserSettingsSave";
import { useRouter } from "next/router";

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

export default function UserSettingsImg({ profile }: { profile: IProfile }) {
  const router = useRouter();
  const { setToast, requestAuth } = useContext(AuthContext);
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
    profile.pfp_url ?? null
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
      router.push("/404");
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
        endpoint: `profiles/${profile.handle}/pfp`,
        body: formData,
      });
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
    <form onSubmit={onSubmit} className="tw-pt-6">
      <UserSettingsImgSelectMeme
        memes={memes}
        onMeme={setSelectedMemeAndRemoveFile}
      />

      <div className="tw-inline-flex tw-items-center tw-my-2 tw-justify-center tw-w-full">
        <hr className="tw-w-full tw-h-px tw-border tw-bg-neutral-600" />
        <span className="tw-absolute tw-px-3 tw-font-medium tw-text-sm tw-uppercase tw-text-white">
          or
        </span>
      </div>

      <UserSettingsImgSelectFile
        imageToShow={imageToShow}
        setFile={setFileAndRemoveMeme}
      />
      <UserSettingsSave loading={saving} />
    </form>
  );
}
