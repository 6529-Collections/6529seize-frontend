"use client";

import { CreateDropScreenType } from "../utils/CreateDropWrapper";
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
import PrimaryButton from "../../../utils/button/PrimaryButton";
import CreateDropSelectedFileIcon from "../utils/file/CreateDropSelectedFileIcon";
import { CreateDropType, CreateDropViewType } from "../types";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import CreateDropSelectedFilePreview from "../utils/file/CreateDropSelectedFilePreview";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { ApiWaveParticipationRequirement } from "../../../../generated/models/ApiWaveParticipationRequirement";
import { ApiWaveRequiredMetadata } from "../../../../generated/models/ApiWaveRequiredMetadata";
import { ProfileMinWithoutSubs } from "../../../../helpers/ProfileTypes";

export interface CreateDropCompactHandles {
  clearEditorState: () => void;
}
interface CreateDropCompactProps {
  readonly waveId: string | null;
  readonly profile: ProfileMinWithoutSubs;
  readonly showProfile?: boolean;
  readonly screenType: CreateDropScreenType;
  readonly editorState: EditorState | null;
  readonly title: string | null;
  readonly files: File[];
  readonly metadata: DropMetadata[];
  readonly canSubmit: boolean;
  readonly canAddPart: boolean;
  readonly loading: boolean;
  readonly type: CreateDropType;
  readonly drop: CreateDropConfig | null;
  readonly showSubmit: boolean;
  readonly showDropError?: boolean;
  readonly missingMedia: ApiWaveParticipationRequirement[];
  readonly missingMetadata: ApiWaveRequiredMetadata[];
  readonly children: React.ReactNode;
  readonly onViewChange: (newV: CreateDropViewType) => void;
  readonly onMetadataRemove: (key: string) => void;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMentionedUser: (
    newUser: Omit<MentionedUser, "current_handle">
  ) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
  readonly onFileRemove: (file: File) => void;
  readonly setFiles: (files: File[]) => void;
  readonly onDrop?: () => void;
  readonly onDropPart: () => void;
}

const CreateDropCompact = forwardRef<
  CreateDropCompactHandles,
  CreateDropCompactProps
>(
  (
    {
      waveId,
      profile,
      showProfile = true,
      editorState,
      screenType,
      files,
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
      <div className={`${getWrapperClasses()}  tw-bg-iron-900`}>
        {children}
        <div className="tw-inline-flex tw-w-full tw-items-start tw-gap-x-2 sm:tw-gap-x-3">
          <div className="tw-w-full tw-flex tw-gap-x-2 sm:tw-gap-x-3">
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
                onDropPart={onDropPart}>
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
                        }>
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
              <div className="tw-px-4 tw-py-2 tw-ring-1 tw-ring-inset tw-ring-iron-650 hover:tw-ring-iron-600 tw-bg-iron-900 tw-rounded-lg tw-flex tw-items-center tw-gap-x-1 tw-justify-between tw-transition tw-duration-300 tw-ease-out">
                <div className="tw-flex tw-items-center tw-gap-x-3 tw-truncate">
                  <CreateDropSelectedFileIcon file={file} />
                  <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50 tw-truncate">
                    {file.name}
                  </p>
                </div>
                <button
                  onClick={() => onFileRemove(file)}
                  type="button"
                  aria-label="Remove file"
                  className="-tw-mb-0.5 tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-0 tw-rounded-full hover:tw-bg-iron-800">
                  <svg
                    className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-red"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg">
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
