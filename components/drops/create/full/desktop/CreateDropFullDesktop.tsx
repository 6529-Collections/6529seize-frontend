import { EditorState } from "lexical";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import { CreateDropViewType } from "../../utils/CreateDropWrapper";
import CreateDropContent from "../../utils/CreateDropContent";
import DropPfp from "../../utils/DropPfp";
import {
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../../../entities/IDrop";
import CreateDropFullDesktopMetadata from "./CreateDropFullDesktopMetadata";
import CreateDropDesktopFooter from "../../utils/CreateDropDesktopFooter";
import { useState } from "react";
import { CreateDropType } from "../../CreateDrop";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";

enum TITLE_STATE {
  BUTTON = "BUTTON",
  INPUT = "INPUT",
}

export default function CreateDropFullDesktop({
  profile,
  title,
  editorState,
  metadata,
  file,
  disabled,
  type,
  loading,
  onViewChange,
  onMetadataEdit,
  onMetadataRemove,
  onTitle,
  onEditorState,
  onMentionedUser,
  onReferencedNft,
  onFileChange,
  onDrop,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly title: string | null;
  readonly editorState: EditorState | null;
  readonly metadata: DropMetadata[];
  readonly file: File | null;
  readonly disabled: boolean;
    readonly type: CreateDropType;
  readonly loading: boolean;
  readonly onViewChange: (newV: CreateDropViewType) => void;
  readonly onMetadataEdit: (param: DropMetadata) => void;
  readonly onMetadataRemove: (data_key: string) => void;
  readonly onTitle: (newV: string | null) => void;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMentionedUser: (newUser: MentionedUser) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
  readonly onFileChange: (file: File | null) => void;
  readonly onDrop: () => void;
}) {
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
      <div className="tw-relative tw-flex tw-justify-end -tw-mb-4 tw-mt-2">
        {titleState === TITLE_STATE.BUTTON && (
          <button
            onClick={() => setTitleState(TITLE_STATE.INPUT)}
            type="button"
            className="tw-text-xs tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 
            tw-px-2.5 tw-py-2 tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
          >
            <svg
              className="tw-w-4 tw-h-4 tw-mr-2 -tw-ml-1"
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
        <div className="tw-flex tw-flex-col tw-space-y-5 tw-w-full">
          {titleState === TITLE_STATE.INPUT && (
            <div>
              <label
                htmlFor="title"
                className="tw-block tw-font-medium tw-text-iron-300 tw-text-sm"
              >
                Title
              </label>
              <div className="tw-mt-1 5">
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
            </div>
          )}
          <CreateDropContent
            viewType={CreateDropViewType.FULL}
            editorState={editorState}
            type={type}
            onEditorState={onEditorState}
            onMentionedUser={onMentionedUser}
            onReferencedNft={onReferencedNft}
            onViewClick={() => onViewChange(CreateDropViewType.COMPACT)}
            onFileChange={onFileChange}
          />
          <CreateDropFullDesktopMetadata
            metadata={metadata}
            onMetadataEdit={onMetadataEdit}
            onMetadataRemove={onMetadataRemove}
          />
          <CreateDropDesktopFooter
            file={file}
            disabled={disabled}
            type={type}
            loading={loading}
            onFileChange={onFileChange}
            onDrop={onDrop}
          />
        </div>
      </div>
    </div>
  );
}
