"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserSettingsBackground from "@/components/user/settings/UserSettingsBackground";
import UserSettingsBannerImageInput from "@/components/user/settings/UserSettingsBannerImageInput";
import UserSettingsClassification from "@/components/user/settings/UserSettingsClassification";
import UserSettingsImgSelectFile from "@/components/user/settings/UserSettingsImgSelectFile";
import UserSettingsImgSelectMeme, {
  type NFTLite,
} from "@/components/user/settings/UserSettingsImgSelectMeme";
import UserSettingsUsername from "@/components/user/settings/UserSettingsUsername";
import Button from "@/components/utils/button/Button";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import { getAnimatedImagePreviewUri } from "@/helpers/gif-preview.helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import UserPageHeaderAboutEditError from "./about/UserPageHeaderAboutEditError";
import { AboutEditError } from "./about/about-statement-errors";
import UserPageHeaderAboutInput from "./about/UserPageHeaderAboutInput";
import type { useProfileEditor } from "./useProfileEditor";
import { getUserProfileHeaderMessage as message } from "./user-page-header.messages";

export default function UserPageHeaderProfileEditor({
  editor,
  onCancel,
  onSaved,
}: {
  readonly editor: ReturnType<typeof useProfileEditor>;
  readonly onCancel: () => void;
  readonly onSaved: () => void;
}) {
  const [nameAvailable, setNameAvailable] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [showMemes, setShowMemes] = useState(false);
  const aboutInputId = useId();
  const errorRef = useRef<HTMLDivElement>(null);
  const coverObjectUrl = useObjectUrl(editor.coverFile);
  const pictureObjectUrl = useObjectUrl(editor.pictureFile);
  const savedPicture = editor.savedProfile.pfp
    ? getScaledImageUri(editor.savedProfile.pfp, ImageScale.W_200_H_200)
    : null;
  const picturePreview =
    pictureObjectUrl ??
    editor.meme?.scaled ??
    editor.meme?.image ??
    savedPicture;
  const coverPreview =
    coverObjectUrl ??
    (editor.savedCover
      ? getAnimatedImagePreviewUri(editor.savedCover, ImageScale.AUTOx800)
      : null);
  const nameChanged =
    editor.name.toLowerCase() !== editor.savedProfile.handle?.toLowerCase();
  const {
    data: memes,
    isPending: loadingMemes,
    isError: memesError,
    refetch: retryMemes,
  } = useQuery({
    queryKey: [QueryKey.MEMES_LITE],
    queryFn: async () =>
      (await commonApiFetch<{ data: NFTLite[] }>({ endpoint: "memes_lite" }))
        .data,
    enabled: showMemes,
  });

  useEffect(() => {
    if (editor.error || editor.aboutError) errorRef.current?.focus();
  }, [editor.error, editor.aboutError]);

  return (
    <form
      className="tw-flex tw-flex-col"
      onSubmit={async (event) => {
        event.preventDefault();
        if (await editor.save()) onSaved();
      }}
      aria-busy={editor.saving}
    >
      <fieldset
        disabled={editor.saving}
        className="tw-m-0 tw-min-w-0 tw-space-y-5 tw-border-0 tw-px-4 tw-pb-5 tw-pt-4 sm:tw-px-6"
      >
        <section
          aria-labelledby="profile-editor-cover"
          className="tw-space-y-3"
        >
          <h3
            id="profile-editor-cover"
            className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200"
          >
            {message("user.profileHeader.edit.banner")}
          </h3>
          <CommonTabs<"gradient" | "image">
            items={[
              {
                key: "gradient",
                label: message("user.profileHeader.edit.gradient"),
                value: "gradient",
              },
              {
                key: "image",
                label: message("user.profileHeader.edit.image"),
                value: "image",
              },
            ]}
            activeItem={editor.coverMode}
            setSelected={(value) => editor.updateDraft({ coverMode: value })}
            filterLabel={message("user.profileHeader.edit.banner")}
            fill={false}
          />
          {editor.coverMode === "gradient" ? (
            <UserSettingsBackground
              compact
              bgColor1={editor.color1}
              bgColor2={editor.color2}
              setBgColor1={(value) => editor.updateDraft({ color1: value })}
              setBgColor2={(value) => editor.updateDraft({ color2: value })}
            />
          ) : (
            <UserSettingsBannerImageInput
              compact
              imageToShow={coverPreview}
              setFile={(value) => editor.updateDraft({ coverFile: value })}
            />
          )}
        </section>
        <section
          aria-labelledby="profile-editor-picture"
          className="tw-space-y-3"
        >
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-2">
            <h3
              id="profile-editor-picture"
              className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200"
            >
              {message("user.profileHeader.edit.pfp")}
            </h3>
            <Button
              variant="ghost"
              size="lg"
              className="!tw-px-2"
              onClick={() => setShowMemes(!showMemes)}
              aria-expanded={showMemes}
              aria-controls="profile-editor-memes"
            >
              {message("user.profileHeader.edit.chooseMeme")}
            </Button>
          </div>
          {showMemes && (
            <div id="profile-editor-memes">
              {loadingMemes && (
                <p role="status" className="tw-text-sm tw-text-iron-400">
                  {message("user.profileHeader.edit.loadingMemes")}
                </p>
              )}
              {memesError && (
                <p role="alert" className="tw-text-sm tw-text-error">
                  {message("user.profileHeader.edit.memesError")}{" "}
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => void retryMemes()}
                  >
                    {message("user.profileHeader.edit.retry")}
                  </Button>
                </p>
              )}
              {memes && (
                <UserSettingsImgSelectMeme
                  memes={memes}
                  onMeme={(meme) =>
                    editor.updateDraft({ meme, pictureFile: null })
                  }
                />
              )}
            </div>
          )}
          <UserSettingsImgSelectFile
            compact
            imageToShow={picturePreview}
            setFile={(pictureFile) =>
              editor.updateDraft({ pictureFile, meme: null })
            }
          />
        </section>
        <UserSettingsUsername
          label={message("user.profileHeader.edit.name")}
          userName={editor.name}
          originalUsername={editor.savedProfile.handle ?? ""}
          setUserName={(value) => editor.updateDraft({ name: value })}
          setIsAvailable={setNameAvailable}
          setIsLoading={setCheckingName}
        />
        <UserSettingsClassification
          selected={editor.classification}
          onSelect={(value) => editor.updateDraft({ classification: value })}
          inlineOptions
        />
        <div className="tw-space-y-2">
          <label
            htmlFor={aboutInputId}
            className="tw-block tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-200"
          >
            {message("user.profileHeader.aboutEdit.textareaLabel")}
          </label>
          <UserPageHeaderAboutInput
            id={aboutInputId}
            value={editor.about}
            onChange={(value) => {
              editor.updateDraft({ about: value });
              editor.setAboutError(null);
            }}
            errorMsg={editor.aboutError?.message ?? null}
            errorType={editor.aboutError?.type ?? AboutEditError.UNKNOWN}
          />
        </div>
      </fieldset>
      {(editor.error !== null || editor.aboutError !== null) && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="tw-px-4 focus:tw-outline-none sm:tw-px-6"
        >
          {editor.aboutError ? (
            <UserPageHeaderAboutEditError
              id={`${aboutInputId}-profile-about-error`}
              msg={editor.aboutError.message}
              errorType={editor.aboutError.type}
              closeError={() => editor.setAboutError(null)}
            />
          ) : (
            <p className="tw-rounded-lg tw-bg-error/10 tw-p-3 tw-text-sm tw-text-error">
              {editor.error}
            </p>
          )}
        </div>
      )}
      <div className="tw-sticky tw-bottom-0 tw-z-10 tw-flex tw-justify-end tw-gap-3 tw-bg-iron-950 tw-px-4 tw-py-4 sm:tw-px-6">
        <Button
          variant="secondary"
          size="lg"
          className="!tw-border-0"
          disabled={editor.saving}
          onClick={onCancel}
        >
          {message("user.profileHeader.aboutEdit.cancel")}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="tw-min-w-24 !tw-border-0"
          loading={editor.saving}
          disabled={
            !editor.dirty ||
            !editor.name.trim() ||
            checkingName ||
            (nameChanged && !nameAvailable)
          }
        >
          {message("user.profileHeader.aboutEdit.save")}
        </Button>
      </div>
    </form>
  );
}
