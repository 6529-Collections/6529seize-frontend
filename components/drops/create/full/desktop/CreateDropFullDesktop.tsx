import { EditorState } from "lexical";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import {
  CreateDropScreenType,
  CreateDropViewType,
} from "../../utils/CreateDropWrapper";
import CreateDropContent from "../../utils/CreateDropContent";
import CreateDropPfp from "../../utils/CreateDropPfp";
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
    <div>
      <div className="tw-w-full tw-inline-flex tw-justify-between">
        <CreateDropPfp profile={profile} />
        <CreateDropFullDesktopTitle title={title} onTitle={onTitle} />
      </div>
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
  );
}
