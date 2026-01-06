"use client";

import PrimaryButton from "@/components/utils/button/PrimaryButton";
import type {
  CreateDropConfig,
  MentionedUser,
  ReferencedNft,
} from "@/entities/IDrop";
import type { ApiWaveParticipationRequirement } from "@/generated/models/ApiWaveParticipationRequirement";
import type { ApiWaveRequiredMetadata } from "@/generated/models/ApiWaveRequiredMetadata";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import type { EditorState } from "lexical";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { CreateDropType, CreateDropViewType } from "../types";
import type { CreateDropContentHandles } from "../utils/CreateDropContent";
import CreateDropContent from "../utils/CreateDropContent";
import { CreateDropScreenType } from "../utils/CreateDropWrapper";
import CreateDropSelectedFileIcon from "../utils/file/CreateDropSelectedFileIcon";
import CreateDropSelectedFilePreview from "../utils/file/CreateDropSelectedFilePreview";

export interface CreateDropCompactHandles {
  clearEditorState: () => void;
}
interface CreateDropCompactProps {
  readonly waveId: string | null;
  readonly screenType: CreateDropScreenType;
  readonly editorState: EditorState | null;
  readonly files: File[];
  readonly canSubmit: boolean;
  readonly canAddPart: boolean;
  readonly loading: boolean;
  readonly type: CreateDropType;
  readonly drop: CreateDropConfig | null;
  readonly showSubmit: boolean;
  readonly showDropError?: boolean | undefined;
  readonly missingMedia: ApiWaveParticipationRequirement[];
  readonly missingMetadata: ApiWaveRequiredMetadata[];
  readonly children: React.ReactNode;
  readonly onViewChange: (newV: CreateDropViewType) => void;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMentionedUser: (
    newUser: Omit<MentionedUser, "current_handle">
  ) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
  readonly onFileRemove: (file: File) => void;
  readonly setFiles: (files: File[]) => void;
  readonly onDrop?: (() => void) | undefined;
  readonly onDropPart: () => void;
}

const CreateDropCompact = forwardRef<
  CreateDropCompactHandles,
  CreateDropCompactProps
>(
  (
    {
      waveId,
      editorState,
      screenType,
      files,
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
      onEditorState,
      onMentionedUser,
      onReferencedNft,
      onFileRemove,
      setFiles,
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
          } tw-p-2 sm:tw-px-4 sm:tw-py-3 tw-rounded-xl tw-border tw-border-solid`;
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
      <div className={`${getWrapperClasses()} tw-bg-iron-900`}>
        {children}
        <div className="tw-inline-flex tw-w-full tw-items-start tw-gap-x-2 sm:tw-gap-x-3">
          <div className="tw-flex tw-w-full tw-gap-x-2 sm:tw-gap-x-3">
            <div className="tw-w-full">
              <CreateDropContent
                ref={editorRef}
                viewType={CreateDropViewType.COMPACT}
                editorState={editorState}
                type={type}
                waveId={waveId}
                drop={drop}
                canAddPart={canAddPart}
                canSubmit={canSubmit}
                missingMedia={missingMedia}
                missingMetadata={missingMetadata}
                onEditorState={onEditorState}
                onMentionedUser={onMentionedUser}
                onReferencedNft={onReferencedNft}
                onDrop={onDrop}
                onViewClick={() => onViewChange(CreateDropViewType.FULL)}
                setFiles={setFiles}
                onDropPart={onDropPart}
              >
                {showSubmit && (
                  <div>
                    {onDrop && (
                      <PrimaryButton
                        onClicked={onDrop}
                        disabled={!canSubmit}
                        loading={loading}
                        padding={
                          screenType === CreateDropScreenType.MOBILE
                            ? "tw-px-3 tw-py-2"
                            : "tw-px-4 tw-py-2.5"
                        }
                      >
                        {getSubmitText()}
                      </PrimaryButton>
                    )}
                  </div>
                )}
              </CreateDropContent>
            </div>
          </div>
        </div>

        {files.map((file, i) => (
          <div key={`drop-compact-file-${i}`} className="tw-mt-3">
            <div className="tw-w-full">
              <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-1 tw-rounded-lg tw-bg-iron-900 tw-px-4 tw-py-2 tw-ring-1 tw-ring-inset tw-ring-iron-650 tw-transition tw-duration-300 tw-ease-out hover:tw-ring-iron-600">
                <div className="tw-flex tw-items-center tw-gap-x-3 tw-truncate">
                  <CreateDropSelectedFileIcon file={file} />
                  <p className="tw-mb-0 tw-truncate tw-text-sm tw-font-medium tw-text-iron-50">
                    {file.name}
                  </p>
                </div>
                <button
                  onClick={() => onFileRemove(file)}
                  type="button"
                  aria-label="Remove file"
                  className="-tw-mb-0.5 tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent hover:tw-bg-iron-800"
                >
                  <svg
                    className="tw-size-5 tw-flex-shrink-0 tw-text-red"
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
        ))}
      </div>
    );
  }
);

CreateDropCompact.displayName = "CreateDropCompact";
export default CreateDropCompact;
