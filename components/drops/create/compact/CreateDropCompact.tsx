import {
  CreateDropScreenType,
  CreateDropViewType,
} from "../utils/CreateDropWrapper";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import DropPfp from "../utils/DropPfp";
import CreateDropContent from "../utils/CreateDropContent";
import { EditorState } from "lexical";
import {
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../../entities/IDrop";
import CreateDropCompactTitle from "./CreateDropCompactTitle";
import PrimaryButton from "../../../utils/buttons/PrimaryButton";
import CreateDropSelectedFileIcon from "../utils/select-file/CreateDropSelectedFileIcon";

export default function CreateDropCompact({
  profile,
  editorState,
  screenType,
  file,
  title,
  metadata,
  onViewChange,
  onMetadataRemove,
  onEditorState,
  onMentionedUser,
  onReferencedNft,
  onFileChange,
  onDrop,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly screenType: CreateDropScreenType;
  readonly editorState: EditorState | null;
  readonly title: string | null;
  readonly file: File | null;
  readonly metadata: DropMetadata[];
  readonly onViewChange: (newV: CreateDropViewType) => void;
  readonly onMetadataRemove: (key: string) => void;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMentionedUser: (newUser: MentionedUser) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
  readonly onFileChange: (file: File | null) => void;
  readonly onDrop: () => void;
}) {
  return (
    <div className="tw-p-4 sm:tw-p-5 tw-bg-iron-900 tw-border tw-border-iron-700 tw-border-solid tw-rounded-xl">
      {/* {title && (
        <CreateDropCompactTitle
          title={title}
          onEditClick={() => onViewChange(CreateDropViewType.FULL)}
        />
      )} */}
      <div className="tw-inline-flex tw-w-full tw-items-start tw-gap-x-2 sm:tw-gap-x-3">
        <div className="tw-mt-0.5">
          <DropPfp pfpUrl={profile.profile?.pfp_url} />
        </div>
        <div className="tw-w-full tw-flex tw-gap-x-2 sm:tw-gap-x-3">
          <div className="tw-w-full">
            <CreateDropContent
              screenType={screenType}
              viewType={CreateDropViewType.COMPACT}
              editorState={editorState}
              onEditorState={onEditorState}
              onMentionedUser={onMentionedUser}
              onReferencedNft={onReferencedNft}
              onViewClick={() => onViewChange(CreateDropViewType.FULL)}
              onFileChange={onFileChange}
            />
          </div>
          <div className="tw-self-end">
            <PrimaryButton onClick={onDrop}>Drop</PrimaryButton>
          </div>
        </div>
      </div>

      {file && (
        <div>
          <div className="tw-mt-2">
            <div className="tw-w-full tw-px-4 tw-py-2 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out">
              <div className="tw-flex tw-items-center tw-gap-x-1 tw-justify-between">
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
                    className="tw-w-5 tw-h-5 tw-text-red"
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
