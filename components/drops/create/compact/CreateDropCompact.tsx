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
import CreateDropDesktopFooter from "../utils/CreateDropDesktopFooter";
import CreateDropCompactTitle from "./CreateDropCompactTitle";
import CreateDropMetadataItems from "../utils/metadata/CreateDropMetadataItems";
import PrimaryButton from "../../../utils/buttons/PrimaryButton";

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
    <div className="tw-px-4 tw-py-6 lg:tw-px-6 tw-bg-iron-900 tw-border tw-border-iron-800 tw-border-solid tw-rounded-xl">
      {title && (
        <CreateDropCompactTitle
          title={title}
          onEditClick={() => onViewChange(CreateDropViewType.FULL)}
        />
      )}
      <div className="tw-inline-flex tw-w-full tw-items-start tw-gap-x-3">
        {screenType === CreateDropScreenType.DESKTOP && (
          <DropPfp pfpUrl={profile.profile?.pfp_url} />
        )}
        <div className="tw-w-full tw-inline-flex tw-gap-x-3">
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
        <div className="tw-mt-2">
          <div className="tw-py-2 tw-flex tw-items-center tw-gap-x-3">
            <p className="tw-mb-0 tw-text-sm tw-font-normal tw-text-iron-300">
              {file.name}
            </p>{" "}
            <button onClick={() => onFileChange(null)}>X</button>
          </div>
        </div>
      )}
    </div>
  );
}
