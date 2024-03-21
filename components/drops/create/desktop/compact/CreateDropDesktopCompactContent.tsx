import { CreateDropScreenType, CreateDropViewType } from "../../CreateDrop";
import CreateDropContent from "../../utils/CreateDropContent";
import { EditorState } from "lexical";
import { MentionedUser, ReferencedNft } from "../../../../../entities/IDrop";

export default function CreateDropDesktopCompactContent({
  viewType,
  editorState,
  onViewType,
  onEditorState,
  onMentionedUser,
  onReferencedNft,
}: {
  readonly viewType: CreateDropViewType;
  readonly editorState: EditorState | null;
  readonly onViewType: (newV: CreateDropViewType) => void;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMentionedUser: (newUser: MentionedUser) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
}) {
  const onViewClick = () => onViewType(CreateDropViewType.FULL);

  return (
    <CreateDropContent
      screenType={CreateDropScreenType.DESKTOP}
      viewType={viewType}
      editorState={editorState}
      onEditorState={onEditorState}
      onMentionedUser={onMentionedUser}
      onReferencedNft={onReferencedNft}
      onViewClick={onViewClick}
    />
  );
}
