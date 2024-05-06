import { CreateDropScreenType } from "../utils/CreateDropWrapper";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import DropPfp from "../utils/DropPfp";
import CreateDropContent, {
  CreateDropContentHandles,
} from "../utils/CreateDropContent";
import { EditorState } from "lexical";
import {
  CreateDropConfig,
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../../entities/IDrop";
import PrimaryButton, {
  PrimaryButtonSize,
} from "../../../utils/buttons/PrimaryButton";
import CreateDropSelectedFileIcon from "../utils/file/CreateDropSelectedFileIcon";
import { CreateDropType, CreateDropViewType } from "../CreateDrop";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import CreateDropSelectedFilePreview from "../utils/file/CreateDropSelectedFilePreview";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import CreateDropStormView from "../utils/storm/CreateDropStormView";

export interface CreateDropCompactHandles {
  clearEditorState: () => void;
}

const CreateDropCompact = forwardRef<
  CreateDropCompactHandles,
  {
    readonly profile: IProfileAndConsolidations;
    readonly screenType: CreateDropScreenType;
    readonly editorState: EditorState | null;
    readonly title: string | null;
    readonly file: File | null;
    readonly metadata: DropMetadata[];
    readonly canSubmit: boolean;
    readonly canAddPart: boolean;
    readonly loading: boolean;
    readonly type: CreateDropType;
    readonly drop: CreateDropConfig | null;
    readonly onViewChange: (newV: CreateDropViewType) => void;
    readonly onMetadataRemove: (key: string) => void;
    readonly onEditorState: (editorState: EditorState | null) => void;
    readonly onMentionedUser: (
      newUser: Omit<MentionedUser, "current_handle">
    ) => void;
    readonly onReferencedNft: (newNft: ReferencedNft) => void;
    readonly onFileChange: (file: File | null) => void;
    readonly onDrop: () => void;
    readonly onDropPart: () => void;
  }
>(
  (
    {
      profile,
      editorState,
      screenType,
      file,
      title,
      metadata,
      canSubmit,
      canAddPart,
      loading,
      type,
      drop,
      onViewChange,
      onMetadataRemove,
      onEditorState,
      onMentionedUser,
      onReferencedNft,
      onFileChange,
      onDrop,
      onDropPart,
    },
    ref
  ) => {
    const getWrapperClasses = () => {
      switch (type) {
        case CreateDropType.DROP:
          return "tw-p-4 sm:tw-p-5 tw-border tw-border-iron-700 tw-border-solid tw-rounded-xl";
        case CreateDropType.QUOTE:
          return "";
        default:
          assertUnreachable(type);
          return "";
      }
    };

    const getSubmitText = () => {
      switch (type) {
        case CreateDropType.DROP:
          return "Drop";
        case CreateDropType.QUOTE:
          return "Quote";
        default:
          assertUnreachable(type);
          return "";
      }
    };

    const editorRef = useRef<CreateDropContentHandles | null>(null);
    const clearEditorState = () => editorRef.current?.clearEditorState();
    useImperativeHandle(ref, () => ({
      clearEditorState,
    }));

    return (
      <div className={`${getWrapperClasses()}  tw-bg-iron-900 `}>
        {!!drop?.parts.length && <CreateDropStormView drop={drop} />}
        <div className="tw-inline-flex tw-w-full tw-items-start tw-gap-x-2 sm:tw-gap-x-3">
          <div className="tw-hidden sm:tw-block">
            <DropPfp pfpUrl={profile.profile?.pfp_url} />
          </div>
          <div className="tw-w-full tw-flex tw-gap-x-2 sm:tw-gap-x-3">
            <div className="tw-w-full">
              <CreateDropContent
                ref={editorRef}
                viewType={CreateDropViewType.COMPACT}
                editorState={editorState}
                type={type}
                drop={drop}
                onEditorState={onEditorState}
                onMentionedUser={onMentionedUser}
                onReferencedNft={onReferencedNft}
                onViewClick={() => onViewChange(CreateDropViewType.FULL)}
                onFileChange={onFileChange}
              />
            </div>
           {/*  <button
              type="button"
              title="add storm"
              aria-label="Add storm"
              className="tw-self-end tw-flex tw-items-center tw-justify-center tw-bg-iron-800 tw-border tw-border-iron-700 tw-border-solid tw-rounded-lg tw-p-2"
              onClick={onDropPart}
              disabled={!canAddPart}
            >
              <svg
                enable-background="new 0 0 57.691 55.692"
                className="tw-h-5 tw-w-5 tw-text-iron-300"
                viewBox="0 0 57.691 55.692"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="currentColor"
                  d="m28.846 32.184c-16.176 0-28.846-7.069-28.846-16.093 0-9.023 12.67-16.091 28.846-16.091s28.846 7.068 28.846 16.091c-.001 9.024-12.671 16.093-28.846 16.093zm0-28.492c-13.635 0-25.154 5.678-25.154 12.399 0 6.722 11.52 12.4 25.154 12.4s25.154-5.678 25.154-12.4c0-6.721-11.52-12.399-25.154-12.399z"
                ></path>
                <path
                  fill="currentColor"
                  d="m6.964 26.289c-.849 0-1.613-.59-1.802-1.453-.125-.575-.188-1.161-.188-1.741 0-7.551 10.485-13.466 23.872-13.466 9.411 0 17.942 3.058 21.733 7.79.638.795.51 1.958-.286 2.595-.796.638-1.957.51-2.595-.286-3.07-3.832-10.646-6.406-18.853-6.406-12.071 0-20.181 5.054-20.181 9.774 0 .321.034.633.104.954.217.997-.414 1.98-1.41 2.197-.131.027-.263.042-.394.042z"
                ></path>
                <path
                  fill="currentColor"
                  d="m11.744 28.962c-.372 0-.748-.112-1.074-.346-.828-.595-1.019-1.748-.424-2.576 2.952-4.114 10.253-6.772 18.6-6.772 5.032 0 9.814.977 13.468 2.75.918.445 1.301 1.549.855 2.467s-1.554 1.299-2.467.854c-3.161-1.534-7.372-2.379-11.856-2.379-6.975 0-13.389 2.151-15.6 5.232-.36.502-.927.77-1.502.77z"
                ></path>
                <path
                  fill="currentColor"
                  d="m28.846 41.065c-9.177 0-16.969-3.086-19.391-7.679-.476-.902-.13-2.018.771-2.494s2.018-.129 2.494.772c1.459 2.767 7.606 5.708 16.125 5.708s14.666-2.941 16.125-5.708c.475-.901 1.589-1.249 2.494-.772.901.477 1.247 1.592.771 2.494-2.421 4.593-10.213 7.679-19.389 7.679z"
                ></path>
                <path
                  fill="currentColor"
                  d="m28.846 49.266c-6.179 0-11.683-2.031-13.696-5.055-.565-.848-.336-1.994.513-2.56.849-.564 1.995-.337 2.56.513 1.101 1.652 5.198 3.409 10.624 3.409s9.523-1.757 10.624-3.409c.564-.848 1.711-1.077 2.56-.513.849.565 1.078 1.712.513 2.56-2.016 3.023-7.52 5.055-13.698 5.055z"
                ></path>
                <path
                  fill="currentColor"
                  d="m28.846 55.692c-7.899 0-12.239-8.456-16.834-17.407-2.733-5.327-5.561-10.835-9.32-15.296-.656-.779-.558-1.944.223-2.601.778-.658 1.944-.559 2.602.222 4.029 4.781 7.085 10.736 9.781 15.99 4.24 8.263 7.903 15.4 13.548 15.4.943 0 1.823-.184 2.69-.563.932-.41 2.022.016 2.431.951.408.935-.018 2.023-.952 2.432-1.325.578-2.727.872-4.169.872z"
                ></path>
              </svg>
            </button> */}
            <div>
              <PrimaryButton
                onClick={onDrop}
                disabled={!canSubmit}
                loading={loading}
                size={
                  screenType === CreateDropScreenType.MOBILE
                    ? PrimaryButtonSize.SMALL
                    : PrimaryButtonSize.MEDIUM
                }
              >
                {getSubmitText()}
              </PrimaryButton>
            </div>
          </div>
        </div>

        {file && (
          <div className="tw-mt-3 sm:tw-ml-[3.25rem]">
            <div className="tw-w-full">
              <div className="tw-px-4 tw-py-2 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-900 tw-rounded-lg tw-flex tw-items-center tw-gap-x-1 tw-justify-between">
                <div className="tw-flex tw-items-center tw-gap-x-3 tw-truncate">
                  <CreateDropSelectedFileIcon file={file} />
                  <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50 tw-truncate">
                    {file.name}
                  </p>
                </div>
                <button
                  onClick={() => onFileChange(null)}
                  type="button"
                  className="-tw-mb-0.5 tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-0 tw-rounded-full hover:tw-bg-iron-800"
                >
                  <svg
                    className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-red"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 6L6 18M6 6L18 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <CreateDropSelectedFilePreview file={file} />
            </div>
          </div>
        )}
      </div>
    );
  }
);

CreateDropCompact.displayName = "CreateDropCompact";
export default CreateDropCompact;
