import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import CreateDropFullMobileWrapper from "./CreateDropFullMobileWrapper";
import { EditorState } from "lexical";
import {
  CreateDropConfig,
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../../../entities/IDrop";
import CreateDropContent, {
  CreateDropContentHandles,
} from "../../utils/CreateDropContent";
import CreateDropFullMobileMetadata from "./CreateDropFullMobileMetadata";
import { CreateDropType, CreateDropViewType } from "../../CreateDrop";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import CircleLoader from "../../../../distribution-plan-tool/common/CircleLoader";
import CreateDropSelectedFileIcon from "../../utils/file/CreateDropSelectedFileIcon";
import CreateDropSelectedFilePreview from "../../utils/file/CreateDropSelectedFilePreview";
import { ApiWaveParticipationRequirement } from "../../../../../generated/models/ApiWaveParticipationRequirement";
import { ApiWaveRequiredMetadata } from "../../../../../generated/models/ApiWaveRequiredMetadata";
import { ProfileMinWithoutSubs } from "../../../../../helpers/ProfileTypes";

enum TITLE_STATE {
  BUTTON = "BUTTON",
  INPUT = "INPUT",
}

export interface CreateDropFullMobileHandles {
  clearEditorState: () => void;
}

interface CreateDropFullMobileProps {
  readonly profile: ProfileMinWithoutSubs;
  readonly title: string | null;
  readonly editorState: EditorState | null;
  readonly metadata: DropMetadata[];
  readonly files: File[];
  readonly canSubmit: boolean;
  readonly canAddPart: boolean;
  readonly type: CreateDropType;
  readonly loading: boolean;
  readonly showSubmit: boolean;
  readonly drop: CreateDropConfig | null;
  readonly missingMedia: ApiWaveParticipationRequirement[];
  readonly missingMetadata: ApiWaveRequiredMetadata[];
  readonly children: React.ReactNode;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMetadataEdit: (param: DropMetadata) => void;
  readonly onMetadataRemove: (key: string) => void;
  readonly onMentionedUser: (
    newUser: Omit<MentionedUser, "current_handle">
  ) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
  readonly onTitle: (newV: string | null) => void;
  readonly setFiles: (files: File[]) => void;
  readonly onFileRemove: (file: File) => void;
  readonly onViewChange: (newV: CreateDropViewType) => void;
  readonly onDrop: () => void;
  readonly onDropPart: () => void;
}

const CreateDropFullMobile = forwardRef<
  CreateDropFullMobileHandles,
  CreateDropFullMobileProps
>(
  (
    {
      profile,
      title,
      editorState,
      metadata,
      files,
      canSubmit,
      canAddPart,
      type,
      loading,
      showSubmit,
      drop,
      missingMedia,
      missingMetadata,
      children,
      onEditorState,
      onMetadataEdit,
      onMetadataRemove,
      onMentionedUser,
      onReferencedNft,
      onTitle,
      onFileRemove,
      setFiles,
      onViewChange,
      onDrop,
      onDropPart,
    },
    ref
  ) => {
    const onViewClick = () => onViewChange(CreateDropViewType.COMPACT);
    const [isOpen, setIsOpen] = useState(true);

    const onClose = () => setIsOpen(false);

    const [titleState, setTitleState] = useState<TITLE_STATE>(
      title?.length ? TITLE_STATE.INPUT : TITLE_STATE.BUTTON
    );

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
      <CreateDropFullMobileWrapper
        isOpen={isOpen}
        type={type}
        onClose={onClose}
        onViewClick={onViewClick}
      >
        <div className="tw-relative tw-flex-1 tw-space-y-4 tw-divide-y tw-divide-iron-800 tw-divide-x-0 tw-divide-solid">
          {children}
          <div className="tw-relative tw-px-4 sm:tw-px-6 tw-space-y-4">
            <div className="tw-flex tw-justify-end -tw-mb-2">
              {titleState === TITLE_STATE.BUTTON && (
                <button
                  onClick={() => setTitleState(TITLE_STATE.INPUT)}
                  type="button"
                  className="tw-text-xs tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 
              tw-px-2.5 tw-py-2 tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
                >
                  <svg
                    className="tw-w-4 tw-h-4 tw-mr-1 -tw-ml-1"
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
            {titleState === TITLE_STATE.INPUT && (
              <input
                type="text"
                placeholder="Drop title"
                value={title ?? ""}
                onChange={(e) => onTitle(e.target.value)}
                maxLength={250}
                className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-pr-3 tw-bg-iron-800 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-bg-iron-900 focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-700 focus:tw-ring-primary-400 tw-text-md tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            )}
            <CreateDropContent
              ref={editorRef}
              viewType={CreateDropViewType.FULL}
              editorState={editorState}
              type={type}
              drop={drop}
              canAddPart={canAddPart}
              canSubmit={canSubmit}
              missingMedia={missingMedia}
              missingMetadata={missingMetadata}
              onEditorState={onEditorState}
              onDrop={onDrop}
              onMentionedUser={onMentionedUser}
              onReferencedNft={onReferencedNft}
              onViewClick={onViewClick}
              setFiles={setFiles}
              onDropPart={onDropPart}
            />
            {files.map((file, i) => (
              <div className="tw-mt-3" key={`full-mobile-file-${i}`}>
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
            ))}
            <CreateDropFullMobileMetadata
              metadata={metadata}
              onMetadataEdit={onMetadataEdit}
              onMetadataRemove={onMetadataRemove}
            />
          </div>
          {showSubmit && (
            <div className="tw-px-4 sm:tw-px-6 tw-pt-4">
              <div className="tw-flex tw-gap-x-3">
                <button
                  type="button"
                  disabled={!canSubmit || loading}
                  onClick={onDrop}
                  className={`${
                    !canSubmit
                      ? "tw-opacity-50 tw-text-iron-200"
                      : "tw-text-white hover:tw-ring-primary-600 hover:tw-bg-primary-600"
                  } tw-relative tw-w-full tw-items-center tw-justify-center tw-inline-flex tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold  tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-rounded-lg tw-shadow-sm  tw-transition tw-duration-300 tw-ease-out`}
                >
                  <div className={loading ? "tw-opacity-0" : ""}>
                    {getSubmitText()}
                  </div>
                  {loading && (
                    <div className="tw-absolute">
                      <CircleLoader />
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </CreateDropFullMobileWrapper>
    );
  }
);

CreateDropFullMobile.displayName = "CreateDropFullMobile";
export default CreateDropFullMobile;
