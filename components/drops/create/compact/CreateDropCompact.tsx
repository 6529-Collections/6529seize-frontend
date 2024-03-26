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
    <div>
      {title && (
        <CreateDropCompactTitle
          title={title}
          onEditClick={() => onViewChange(CreateDropViewType.FULL)}
        />
      )}
      <div className="tw-inline-flex tw-w-full tw-items-center tw-space-x-2">
        {screenType === CreateDropScreenType.DESKTOP && (
          <DropPfp pfpUrl={profile.profile?.pfp_url} />
        )}
        <div className="tw-w-full tw-inline-flex tw-space-x-2">
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
          {screenType === CreateDropScreenType.MOBILE && (
            <button onClick={onDrop}>Drop</button>
          )}
        </div>
      </div>
      <CreateDropMetadataItems
        items={metadata}
        onMetadataRemove={onMetadataRemove}
      />
      {screenType === CreateDropScreenType.DESKTOP && (
        <CreateDropDesktopFooter
          file={file}
          onFileChange={onFileChange}
          onDrop={onDrop}
        />
      )}

      {screenType === CreateDropScreenType.MOBILE && file && (
        <div>
          {file.name} <button onClick={() => onFileChange(null)}>X</button>
        </div>
      )}
    </div>
  );
}
