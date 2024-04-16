import { useState } from "react";
import CreateDropFullMobileWrapper from "./CreateDropFullMobileWrapper";
import {
  CreateDropScreenType,
  CreateDropViewType,
} from "../../utils/CreateDropWrapper";
import { EditorState } from "lexical";
import {
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../../../entities/IDrop";

import CreateDropContent from "../../utils/CreateDropContent";
import CreateDropFullMobileMetadata from "./CreateDropFullMobileMetadata";
import CreateDropSelectFile from "../../utils/select-file/CreateDropSelectFile";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import DropPfp from "../../utils/DropPfp";
import { CreateDropType } from "../../CreateDrop";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";

enum TITLE_STATE {
  BUTTON = "BUTTON",
  INPUT = "INPUT",
}

export default function CreateDropFullMobile({
  profile,
  title,
  editorState,
  metadata,
  file,
  disabled,
  type,
  onEditorState,
  onMetadataEdit,
  onMetadataRemove,
  onMentionedUser,
  onReferencedNft,
  onTitle,
  onFileChange,
  onViewChange,
  onDrop,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly title: string | null;
  readonly editorState: EditorState | null;
  readonly metadata: DropMetadata[];
  readonly file: File | null;
  readonly disabled: boolean;
  readonly type: CreateDropType;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMetadataEdit: (param: DropMetadata) => void;
  readonly onMetadataRemove: (key: string) => void;
  readonly onMentionedUser: (newUser: MentionedUser) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
  readonly onTitle: (newV: string | null) => void;
  readonly onFileChange: (file: File | null) => void;
  readonly onViewChange: (newV: CreateDropViewType) => void;
  readonly onDrop: () => void;
}) {
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

  return (
    <CreateDropFullMobileWrapper
      isOpen={isOpen}
      type={type}
      onClose={onClose}
      onViewClick={onViewClick}
    >
      <div className="tw-relative tw-flex-1 tw-space-y-4 tw-divide-y tw-divide-iron-800 tw-divide-x-0 tw-divide-solid">
        <div className="tw-relative tw-px-4 sm:tw-px-6 tw-space-y-4">
          <div className="tw-absolute tw-right-4 -tw-top-4">
           {/*  <DropPfp pfpUrl={profile.profile?.pfp_url} /> */}
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
            screenType={CreateDropScreenType.MOBILE}
            viewType={CreateDropViewType.FULL}
            editorState={editorState}
            type={type}
            onEditorState={onEditorState}
            onMentionedUser={onMentionedUser}
            onReferencedNft={onReferencedNft}
            onViewClick={onViewClick}
            onFileChange={onFileChange}
          />
          <CreateDropFullMobileMetadata
            metadata={metadata}
            onMetadataEdit={onMetadataEdit}
            onMetadataRemove={onMetadataRemove}
          />

          <CreateDropSelectFile onFileChange={onFileChange} file={file} />
        </div>
        <div className="tw-px-4 sm:tw-px-6 tw-pt-4">
          <button
            type="button"
            disabled={disabled}
            onClick={onDrop}
            className={`${
              disabled
                ? "tw-opacity-50 tw-text-iron-200"
                : "tw-text-white hover:tw-ring-primary-600 hover:tw-bg-primary-600"
            } tw-w-full tw-block tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold  tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-rounded-lg tw-shadow-sm  tw-transition tw-duration-300 tw-ease-out`}
          >
            {getSubmitText()}
          </button>
        </div>
      </div>
    </CreateDropFullMobileWrapper>
  );
}
