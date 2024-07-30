import { CreateDropScreenType } from "../utils/CreateDropWrapper";
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
import { forwardRef, useImperativeHandle, useRef } from "react";
import { WaveParticipationRequirement } from "../../../../generated/models/WaveParticipationRequirement";
import { WaveRequiredMetadata } from "../../../../generated/models/WaveRequiredMetadata";
import { ProfileMinWithoutSubs } from "../../../../helpers/ProfileTypes";

export interface CreateDropCompactHandles {
  clearEditorState: () => void;
}
interface CreateDropCompactProps {
  readonly profile: ProfileMinWithoutSubs;
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
  readonly showSubmit: boolean;
  readonly showDropError?: boolean;
  readonly missingMedia: WaveParticipationRequirement[];
  readonly missingMetadata: WaveRequiredMetadata[];
  readonly children: React.ReactNode;
  readonly onViewChange: (newV: CreateDropViewType) => void;
  readonly onMetadataRemove: (key: string) => void;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMentionedUser: (
    newUser: Omit<MentionedUser, "current_handle">
  ) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
  readonly onFileChange: (file: File | null) => void;
  readonly onDrop?: () => void;
  readonly onDropPart: () => void;
}

const CreateDropCompact = forwardRef<
  CreateDropCompactHandles,
  CreateDropCompactProps
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
      showSubmit,
      type,
      drop,
      showDropError = false,
      missingMedia,
      missingMetadata,
      children,
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
          return `${
            showDropError ? "tw-border-error " : "tw-border-iron-800"
          } tw-p-2 sm:tw-p-4 tw-rounded-xl tw-border tw-border-solid`;
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
      <div className={`${getWrapperClasses()}  tw-bg-iron-900`}>
        {children}
        <div className="tw-inline-flex tw-w-full tw-items-start tw-gap-x-2">
          <div className="tw-hidden sm:tw-block">
            <DropPfp pfpUrl={profile?.pfp} />
          </div>
          <div className="tw-w-full tw-flex tw-items-end tw-gap-x-2">
            <div className="tw-w-full">
              <CreateDropContent
                ref={editorRef}
                viewType={CreateDropViewType.COMPACT}
                editorState={editorState}
                type={type}
                drop={drop}
                canAddPart={canAddPart}
                missingMedia={missingMedia}
                missingMetadata={missingMetadata}
                onEditorState={onEditorState}
                onMentionedUser={onMentionedUser}
                onReferencedNft={onReferencedNft}
                onViewClick={() => onViewChange(CreateDropViewType.FULL)}
                onFileChange={onFileChange}
                onDropPart={onDropPart}
              />
            </div>
            {showSubmit && (
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
            )}
          </div>
        </div>

        <div className="tw-ml-14 tw-text-xs tw-font-medium tw-text-iron-400">
          <p className="tw-mb-0 tw-mt-1.5 tw-pb-2">
            <>
              <span className="tw-font-semibold tw-text-iron-500">
                Part: <span className="tw-text-iron-50">77</span>,{" "}
              </span>
              <span
              /*  className={`${charsCount > 240 && "tw-text-error"} tw-pl-1`} */
              >
                length:
              </span>
            </>
          </p>
        </div>

        <div className="tw-ml-10 tw-mt-2.5 tw-flex tw-items-center tw-gap-x-6">
          <div className="tw-flex tw-items-center tw-gap-x-6">
            <button
              type="button"
              className="tw-border-0 tw-bg-transparent tw-cursor-pointer tw-flex tw-items-center tw-text-iron-400 hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300"
            >
              <svg
                className="tw-h-4 tw-w-4 tw-flex-shrink-0 -tw-mr-0.5"
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
              <svg
                className="tw-h-[1.15rem] tw-w-[1.15rem] tw-flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 4H3M20 8L6 8M18 12L9 12M15 16L8 16M17 20H12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="tw-ml-2 tw-text-sm tw-font-medium">
                Break into storm
              </span>
            </button>
          </div>
          <div className="tw-flex tw-items-center tw-gap-x-6">
            <label>
              <div
                role="button"
                aria-label="Select audio file"
                className="tw-cursor-pointer tw-flex tw-items-center tw-gap-x-2 tw-text-iron-400 hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300"
              >
                <svg
                  className="tw-flex-shrink-0 tw-h-5 tw-w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
                <input
                  type="file"
                  className="tw-hidden"
                  accept="image/*,video/*,audio/*"
                  onChange={(e: any) => {
                    if (e.target.files) {
                      const f = e.target.files[0];
                      onFileChange(f);
                    }
                  }}
                />
                <span className="tw-text-sm tw-font-medium">Upload Media</span>
              </div>
            </label>
          </div>
        </div>

        {file && (
          <div className="tw-mt-3 sm:tw-ml-[3.25rem]">
            <div className="tw-w-full">
              <div className="tw-px-4 tw-py-2 tw-ring-1 tw-ring-inset tw-ring-iron-650 hover:tw-ring-iron-600 tw-bg-iron-900 tw-rounded-lg tw-flex tw-items-center tw-gap-x-1 tw-justify-between tw-transition tw-duration-300 tw-ease-out">
                <div className="tw-flex tw-items-center tw-gap-x-3 tw-truncate">
                  <CreateDropSelectedFileIcon file={file} />
                  <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50 tw-truncate">
                    {file.name}
                  </p>
                </div>
                <button
                  onClick={() => onFileChange(null)}
                  type="button"
                  aria-label="Remove file"
                  className="-tw-mb-0.5 tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-0 tw-rounded-full hover:tw-bg-iron-800"
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
      </div>
    );
  }
);

CreateDropCompact.displayName = "CreateDropCompact";
export default CreateDropCompact;
