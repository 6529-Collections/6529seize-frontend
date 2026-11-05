"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useIpfsService } from "@/components/ipfs/IPFSContext";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { NFTLite } from "@/components/user/settings/UserSettingsImgSelectMeme";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";
import type {
  ApiCreateOrUpdateProfileCicStatement,
  ApiCreateOrUpdateProfileRequest,
  CicStatement,
} from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  getBannerColorValue,
  getBannerImageUrl,
} from "@/helpers/profile-banner.helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
  commonApiPostForm,
} from "@/services/api/common-api";
import { usePathname, useRouter } from "next/navigation";
import { useContext, useRef, useState } from "react";
import { getUserProfileHeaderMessage as message } from "./user-page-header.messages";

export interface ProfileEditorProps {
  readonly profile: ApiIdentity;
  readonly statement: CicStatement | null;
  readonly defaultBanner1: string;
  readonly defaultBanner2: string;
}

interface ProfileDraft {
  name: string;
  classification: ApiIdentity["classification"];
  about: string;
  coverMode: "gradient" | "image";
  color1: string;
  color2: string;
  coverFile: File | null;
  pictureFile: File | null;
  meme: NFTLite | null;
}

function initialDraft({
  profile,
  statement,
  defaultBanner1,
  defaultBanner2,
}: ProfileEditorProps): ProfileDraft {
  return {
    name: profile.handle ?? "",
    classification: profile.classification,
    about: statement?.statement_value ?? "",
    coverMode: getBannerImageUrl(profile.banner1) ? "image" : "gradient",
    color1: getBannerColorValue(profile.banner1) ?? defaultBanner1,
    color2: getBannerColorValue(profile.banner2) ?? defaultBanner2,
    coverFile: null,
    pictureFile: null,
    meme: null,
  };
}

async function prepareProfileUpdate(
  draft: ProfileDraft,
  profile: ApiIdentity,
  coverChanged: boolean,
  ipfs: ReturnType<typeof useIpfsService>
): Promise<ApiCreateOrUpdateProfileRequest> {
  if (draft.name.toLowerCase() !== profile.handle?.toLowerCase()) {
    const availability = await commonApiFetch<{
      available: boolean;
      message: string;
    }>({ endpoint: `profiles/${encodeURIComponent(draft.name)}/availability` });
    if (!availability.available)
      throw new Error(
        availability.message ||
          message("user.profileHeader.edit.nameUnavailable")
      );
  }
  const savedCover = getBannerImageUrl(profile.banner1);
  if (draft.coverMode === "image" && !draft.coverFile && !savedCover) {
    throw new Error(message("user.profileHeader.edit.bannerImageRequired"));
  }
  const body: ApiCreateOrUpdateProfileRequest = {
    handle: draft.name,
    classification: draft.classification,
    pfp_url: profile.pfp ?? undefined,
    banner_1: profile.banner1 ?? undefined,
    banner_2: profile.banner2 ?? undefined,
  };
  if (coverChanged && draft.coverMode === "gradient") {
    body.banner_1 = draft.color1;
    body.banner_2 = draft.color2;
  } else if (coverChanged) {
    body.banner_1 = draft.coverFile
      ? (await multiPartUpload({ file: draft.coverFile, path: "drop" })).url
      : (savedCover ?? undefined);
    body.banner_2 = undefined;
  }
  if (draft.pictureFile)
    body.pfp_url = `ipfs://${await ipfs.addFile(draft.pictureFile)}`;
  return body;
}

class AboutSaveError extends Error {}

async function saveAbout(
  target: string,
  value: string,
  statement: CicStatement | null
): Promise<CicStatement | null> {
  try {
    if (!value.trim() && statement) {
      await commonApiDelete({
        endpoint: `profiles/${target}/cic/statements/${statement.id}`,
      });
      return null;
    }
    return await commonApiPost<
      ApiCreateOrUpdateProfileCicStatement,
      CicStatement
    >({
      endpoint: `profiles/${target}/cic/statements`,
      body: {
        statement_group: STATEMENT_GROUP.GENERAL,
        statement_type: STATEMENT_TYPE.BIO,
        statement_comment: null,
        statement_value: value,
      },
    });
  } catch (cause) {
    throw new AboutSaveError(
      getToastErrorDetails(cause) ??
        message("user.profileHeader.aboutEdit.errors.saveFailed")
    );
  }
}

async function savePictureMeme(target: string, meme: NFTLite): Promise<string> {
  const body = new FormData();
  body.append("meme", meme.id.toString());
  const result = await commonApiPostForm<{ pfp_url: string }>({
    endpoint: `profiles/${target}/pfp`,
    body,
  });
  return result.pfp_url;
}

export function useProfileEditor(props: ProfileEditorProps) {
  const { requestAuth, setToast } = useContext(AuthContext);
  const { onProfileEdit, onProfileStatementAdd, onProfileStatementRemove } =
    useContext(ReactQueryWrapperContext);
  const ipfs = useIpfsService();
  const router = useRouter();
  const pathname = usePathname();
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [savedProfile, setSavedProfile] = useState(props.profile);
  const [savedStatement, setSavedStatement] = useState(props.statement);
  const [draft, setDraft] = useState(() => initialDraft(props));
  const [error, setError] = useState<string | null>(null);
  const [aboutError, setAboutError] = useState<string | null>(null);
  const updateDraft = (patch: Partial<ProfileDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));
  const savedCover = getBannerImageUrl(savedProfile.banner1);
  const coverChanged =
    draft.coverMode === "image"
      ? Boolean(draft.coverFile) || !savedCover
      : Boolean(savedCover) ||
        draft.color1 !==
          (getBannerColorValue(savedProfile.banner1) ?? props.defaultBanner1) ||
        draft.color2 !==
          (getBannerColorValue(savedProfile.banner2) ?? props.defaultBanner2);
  const profileChanged =
    draft.name !== savedProfile.handle ||
    draft.classification !== savedProfile.classification ||
    coverChanged ||
    Boolean(draft.pictureFile);
  const aboutChanged =
    draft.about !== (savedStatement?.statement_value ?? "") &&
    Boolean(savedStatement ?? draft.about.trim());
  const dirty = profileChanged || aboutChanged || Boolean(draft.meme);

  const target = encodeURIComponent(
    [savedProfile.primary_wallet, savedProfile.query, savedProfile.handle].find(
      (value) => value?.trim()
    ) ?? ""
  );

  const navigateAfterRename = (updated: ApiIdentity) => {
    if (
      updated.handle &&
      updated.handle.toLowerCase() !== props.profile.handle?.toLowerCase()
    ) {
      const parts = pathname.split("/");
      parts[1] = encodeURIComponent(updated.handle.toLowerCase());
      router.replace(`${parts.join("/")}${globalThis.location.search}`, {
        scroll: false,
      });
    }
  };

  const save = async (): Promise<boolean> => {
    if (savingRef.current || !dirty || !draft.name.trim()) return false;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    setAboutError(null);
    let savedAny = false;
    try {
      const { success } = await requestAuth();
      if (!success) throw new Error(message("user.profileHeader.edit.signIn"));
      const body = await prepareProfileUpdate(
        draft,
        savedProfile,
        coverChanged,
        ipfs
      );
      // Each endpoint saves separately. Keep confirmed results as the retry
      // baseline, while retaining every draft field that has not been saved.
      if (aboutChanged) {
        const updatedStatement = await saveAbout(
          target,
          draft.about,
          savedStatement
        );
        setSavedStatement(updatedStatement);
        if (updatedStatement) onProfileStatementAdd({ profile: savedProfile });
        else {
          updateDraft({ about: "" });
          onProfileStatementRemove({ profile: savedProfile });
        }
        savedAny = true;
      }
      let currentProfile = savedProfile;
      if (draft.meme) {
        body.pfp_url = await savePictureMeme(target, draft.meme);
        currentProfile = { ...savedProfile, pfp: body.pfp_url };
        setSavedProfile(currentProfile);
        updateDraft({ meme: null });
        onProfileEdit({
          profile: currentProfile,
          previousProfile: savedProfile,
        });
        savedAny = true;
      }
      if (profileChanged) {
        const updated = await commonApiPost<
          ApiCreateOrUpdateProfileRequest,
          ApiIdentity
        >({ endpoint: "profiles", body });
        setSavedProfile(updated);
        updateDraft({ coverFile: null, pictureFile: null });
        onProfileEdit({ profile: updated, previousProfile: currentProfile });
        navigateAfterRename(updated);
      }
      setToast({
        message: message("user.profileHeader.edit.success"),
        type: "success",
      });
      return true;
    } catch (cause) {
      const details =
        getToastErrorDetails(cause) ??
        message("user.profileHeader.edit.saveFailed");
      if (cause instanceof AboutSaveError) setAboutError(details);
      else
        setError(
          savedAny
            ? `${message("user.profileHeader.edit.partialSave")} ${details}`
            : details
        );
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  return {
    ...draft,
    updateDraft,
    savedProfile,
    savedCover,
    dirty,
    saving,
    error,
    aboutError,
    setAboutError,
    save,
  };
}
