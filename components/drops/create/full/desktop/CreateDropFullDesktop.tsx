import { EditorState } from "lexical";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";

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
import CreateDropStormView from "../../utils/storm/CreateDropStormView";
import CreateDropSelectFile from "../../utils/file/CreateDropSelectFile";

enum TITLE_STATE {
  BUTTON = "BUTTON",
  INPUT = "INPUT",
}

export interface CreateDropFullDesktopHandles {
  clearEditorState: () => void;
}

const CreateDropFullDesktop = forwardRef<
  CreateDropFullDesktopHandles,
  {
    readonly profile: IProfileAndConsolidations;
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
          return "tw-px-4 sm:tw-p-5 tw-border tw-border-iron-700 tw-border-solid tw-rounded-xl";
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
          className="tw-relative tw-ml-auto tw-p-2.5 -tw-m-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-900 tw-border-0 tw-text-iron-400 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
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
        {!!drop?.parts.length && <CreateDropStormView drop={drop} />}
        <div className="tw-flex tw-justify-end tw-mb-2 tw-mt-4">
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
            <DropPfp pfpUrl={profile.profile?.pfp_url} />
          </div>
          <div className="tw-space-y-5 tw-w-full">
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
              onEditorState={onEditorState}
              onMentionedUser={onMentionedUser}
              onReferencedNft={onReferencedNft}
              onViewClick={() => onViewChange(CreateDropViewType.COMPACT)}
              onFileChange={onFileChange}
            />
            {/*  <div className="tw-flex tw-justify-end">
              <button
                type="button"
                onClick={onDropPart}
                disabled={!canAddPart}
                className={`${ 
                  canAddPart
                    ? "tw-text-iron-400 hover:tw-text-primary-400"
                    : "tw-text-iron-600"
                } `}
              >
                <svg
                  className="tw-flex-shrink-0 tw-w-4 tw-h-4 tw-mr-2"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14.2495 2H8.49395C8.31447 2 8.22473 2 8.14551 2.02733C8.07544 2.05149 8.01163 2.09093 7.95868 2.14279C7.89881 2.20143 7.85868 2.2817 7.77841 2.44223L3.57841 10.8422C3.38673 11.2256 3.29089 11.4173 3.31391 11.5731C3.33401 11.7091 3.40927 11.8309 3.52197 11.9097C3.65104 12 3.86534 12 4.29395 12H10.4995L7.49953 22L19.6926 9.35531C20.104 8.9287 20.3097 8.7154 20.3217 8.53288C20.3321 8.37446 20.2667 8.22049 20.1454 8.11803C20.0057 8 19.7094 8 19.1167 8H11.9995L14.2495 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Add storm</span>
              </button>
            </div>  */}
            <CreateDropSelectFile onFileChange={onFileChange} file={file} />
            <CreateDropFullDesktopMetadata
              metadata={metadata}
              onMetadataEdit={onMetadataEdit}
              onMetadataRemove={onMetadataRemove}
            />
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
