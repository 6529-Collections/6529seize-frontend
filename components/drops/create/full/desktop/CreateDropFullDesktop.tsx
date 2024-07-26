import { EditorState } from "lexical";
import CreateDropContent, {
  CreateDropContentHandles,
} from "../../utils/CreateDropContent";
import DropPfp from "../../utils/DropPfp";
import {
  CreateDropConfig,
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../../../entities/IDrop";
import CreateDropFullDesktopMetadata from "./CreateDropFullDesktopMetadata";
import CreateDropDesktopFooter from "../../utils/CreateDropDesktopFooter";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { CreateDropType, CreateDropViewType } from "../../CreateDrop";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import CreateDropSelectedFileIcon from "../../utils/file/CreateDropSelectedFileIcon";
import CreateDropSelectedFilePreview from "../../utils/file/CreateDropSelectedFilePreview";
import { WaveParticipationRequirement } from "../../../../../generated/models/WaveParticipationRequirement";
import { WaveRequiredMetadata } from "../../../../../generated/models/WaveRequiredMetadata";
import { ProfileMinWithoutSubs } from "../../../../../helpers/ProfileTypes";

enum TITLE_STATE {
  BUTTON = "BUTTON",
  INPUT = "INPUT",
}

export interface CreateDropFullDesktopHandles {
  clearEditorState: () => void;
}

interface CreateDropFullDesktopProps {
  readonly profile: ProfileMinWithoutSubs;
  readonly title: string | null;
  readonly editorState: EditorState | null;
  readonly metadata: DropMetadata[];
  readonly file: File | null;
  readonly canSubmit: boolean;
  readonly canAddPart: boolean;
  readonly type: CreateDropType;
  readonly loading: boolean;
  readonly drop: CreateDropConfig | null;
  readonly showSubmit: boolean;
  readonly showDropError?: boolean;
  readonly missingMedia: WaveParticipationRequirement[];
  readonly missingMetadata: WaveRequiredMetadata[];
  readonly children: React.ReactNode;
  readonly onViewChange: (newV: CreateDropViewType) => void;
  readonly onMetadataEdit: (param: DropMetadata) => void;
  readonly onMetadataRemove: (data_key: string) => void;
  readonly onTitle: (newV: string | null) => void;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMentionedUser: (
    newUser: Omit<MentionedUser, "current_handle">
  ) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
  readonly onFileChange: (file: File | null) => void;
  readonly onDrop: () => void;
  readonly onDropPart: () => void;
}

const CreateDropFullDesktop = forwardRef<
  CreateDropFullDesktopHandles,
  CreateDropFullDesktopProps
>(
  (
    {
      profile,
      title,
      editorState,
      metadata,
      file,
      canSubmit,
      canAddPart,
      type,
      loading,
      drop,
      showSubmit,
      showDropError = false,
      missingMedia,
      missingMetadata,
      children,
      onViewChange,
      onMetadataEdit,
      onMetadataRemove,
      onTitle,
      onEditorState,
      onMentionedUser,
      onReferencedNft,
      onFileChange,
      onDrop,
      onDropPart,
    },
    ref
  ) => {
    const [titleState, setTitleState] = useState<TITLE_STATE>(
      title?.length ? TITLE_STATE.INPUT : TITLE_STATE.BUTTON
    );

    const getWrapperClasses = () => {
      switch (type) {
        case CreateDropType.DROP:
          return `${
            showDropError ? "tw-border-error " : "tw-border-iron-800"
          } tw-p-4 sm:tw-p-5 tw-rounded-xl tw-border tw-border-solid`;
        case CreateDropType.QUOTE:
          return "";
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
      <div className={`${getWrapperClasses()} tw-relative tw-bg-iron-900`}>
        <button
          onClick={() => onViewChange(CreateDropViewType.COMPACT)}
          type="button"
          className="tw-relative tw-ml-auto tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-transparent hover:tw-bg-iron-900 tw-border-0 tw-text-iron-300 hover:tw-text-iron-400 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-sr-only tw-text-sm">Cancel</span>
          <svg
            className="tw-h-6 tw-w-6"
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        {children}
        <div className="tw-flex tw-justify-end tw-mb-2 tw-mt-2.5">
          {titleState === TITLE_STATE.BUTTON && (
            <button
              onClick={() => setTitleState(TITLE_STATE.INPUT)}
              type="button"
              className="tw-text-xs tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 
            tw-px-3 tw-py-2 tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 hover:tw-text-iron-200 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-mr-1.5 -tw-ml-1"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Add title</span>
            </button>
          )}
        </div>
        <div className="tw-flex tw-w-full tw-gap-x-4">
          <div className="tw-mt-0.5">
            <DropPfp pfpUrl={profile?.pfp} />
          </div>
          <div className="tw-w-full">
            <div className="tw-space-y-4">
              {titleState === TITLE_STATE.INPUT && (
                <div>
                  <input
                    id="title"
                    type="text"
                    placeholder="Drop title"
                    value={title ?? ""}
                    onChange={(e) => onTitle(e.target.value)}
                    maxLength={250}
                    className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-pr-3 tw-bg-iron-800 tw-text-iron-50 tw-text-md tw-leading-6 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-bg-iron-900 focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-700 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                  />
                </div>
              )}
              <CreateDropContent
                ref={editorRef}
                viewType={CreateDropViewType.FULL}
                editorState={editorState}
                type={type}
                drop={drop}
                canAddPart={canAddPart}
                missingMedia={missingMedia}
                missingMetadata={missingMetadata}
                onEditorState={onEditorState}
                onMentionedUser={onMentionedUser}
                onReferencedNft={onReferencedNft}
                onViewClick={() => onViewChange(CreateDropViewType.COMPACT)}
                onFileChange={onFileChange}
                onDropPart={onDropPart}
              />
            </div>

            {file && (
              <div className="tw-mt-3">
                <div className="tw-w-full">
                  <div className="tw-px-4 tw-py-2 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 tw-bg-iron-900 tw-rounded-lg tw-flex tw-items-center tw-gap-x-1 tw-justify-between tw-transition tw-duration-300 tw-ease-out">
                    <div className="tw-flex tw-items-center tw-gap-x-3">
                      <CreateDropSelectedFileIcon file={file} />
                      <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50 tw-max-w-[456px] tw-truncate">
                        {file.name}
                      </p>
                    </div>
                    <button
                      onClick={() => onFileChange(null)}
                      type="button"
                      aria-label="Remove file"
                      className="-tw-mr-1 tw-flex-shrink-0 tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-0 tw-rounded-full hover:tw-bg-iron-800"
                    >
                      <svg
                        className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-red"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
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
            <div className="tw-mt-6">
              <CreateDropFullDesktopMetadata
                metadata={metadata}
                onMetadataEdit={onMetadataEdit}
                onMetadataRemove={onMetadataRemove}
              />
            </div>
            {showSubmit && (
              <CreateDropDesktopFooter
                disabled={!canSubmit}
                type={type}
                loading={loading}
                onDrop={onDrop}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
);

CreateDropFullDesktop.displayName = "CreateDropFullDesktop";
export default CreateDropFullDesktop;
