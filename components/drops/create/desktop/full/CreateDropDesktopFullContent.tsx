import { EditorState } from "lexical";
import { CreateDropScreenType, CreateDropViewType } from "../../CreateDrop";
import { MentionedUser, ReferencedNft } from "../../../../../entities/IDrop";
import CreateDropContent from "../../utils/CreateDropContent";

export default function CreateDropDesktopFullContent({
  viewType,
  editorState,
  onViewType,
  onEditorState,
  onMentionedUser,
  onReferencedNft,
  onFileChange,
}: {
  readonly viewType: CreateDropViewType;
  readonly editorState: EditorState | null;
  readonly onViewType: (newV: CreateDropViewType) => void;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMentionedUser: (newUser: MentionedUser) => void;
    readonly onReferencedNft: (newNft: ReferencedNft) => void;
  readonly onFileChange: (file: File) => void;
}) {
  const onViewClick = () => onViewType(CreateDropViewType.COMPACT);
  return (
    <CreateDropContent
      screenType={CreateDropScreenType.DESKTOP}
      viewType={viewType}
      editorState={editorState}
      onEditorState={onEditorState}
      onMentionedUser={onMentionedUser}
      onReferencedNft={onReferencedNft}
      onViewClick={onViewClick}
      onFileChange={onFileChange}
    />
  );
}
