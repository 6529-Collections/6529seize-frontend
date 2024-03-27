import { EditorState } from "lexical";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import {
  CreateDropScreenType,
  CreateDropViewType,
} from "../../utils/CreateDropWrapper";
import CreateDropContent from "../../utils/CreateDropContent";
import DropPfp from "../../utils/DropPfp";
import CreateDropFullDesktopTitle from "./CreateDropFullDesktopTitle";
import {
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../../../entities/IDrop";
import CreateDropFullDesktopMetadata from "./CreateDropFullDesktopMetadata";
import CreateDropDesktopFooter from "../../utils/CreateDropDesktopFooter";

export default function CreateDropFullDesktop({
  profile,
  title,
  editorState,
  metadata,
  file,
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
  return (
    <div className="tw-px-4 sm:tw-p-5 tw-bg-iron-900 tw-border tw-border-iron-700 tw-border-solid tw-rounded-xl">
      <div className="tw-justify-end tw-flex">
        <button
          type="button"
          className="tw-p-2.5 -tw-m-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-900 tw-border-0 tw-text-iron-400 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
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
      </div>
      <div className="tw-mt-2 tw-flex tw-w-full tw-gap-x-3">
        <DropPfp pfpUrl={profile.profile?.pfp_url} />
        <div className="tw-flex tw-flex-col tw-space-y-4 tw-w-full">
          {/* <CreateDropFullDesktopTitle title={title} onTitle={onTitle} /> */}
        {/*   <input
            type="text"
            placeholder="Drop title"
            value={title ?? ""}
            maxLength={250}
            className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-pr-3 tw-bg-iron-800 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-700 focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          /> */}
          <CreateDropContent
            screenType={CreateDropScreenType.DESKTOP}
            viewType={CreateDropViewType.FULL}
            editorState={editorState}
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
            onFileChange={onFileChange}
            onDrop={onDrop}
          />
        </div>
      </div>
    </div>
  );
}
