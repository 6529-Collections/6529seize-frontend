import { EditorState } from "lexical";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { CreateDropViewType } from "../CreateDrop";
import { MentionedUser, ReferencedNft } from "../../../../entities/IDrop";
import CreateDropMobileCompact from "./compact/CreateDropMobileCompact";
import CreateDropMobileFull from "./full/CreateDropMobileFull";

export default function CreateDropMobile({
  viewType,
  profile,
  title,
  editorState,
  onTitle,
  onViewType,
  onEditorState,
  onMentionedUser,
  onReferencedNft,
}: {
  readonly viewType: CreateDropViewType;
  readonly profile: IProfileAndConsolidations;
  readonly title: string | null;
  readonly editorState: EditorState | null;
  readonly onViewType: (newV: CreateDropViewType) => void;
  readonly onTitle: (newV: string | null) => void;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMentionedUser: (newUser: MentionedUser) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
}) {
  const components: Record<CreateDropViewType, JSX.Element> = {
    [CreateDropViewType.COMPACT]: (
      <CreateDropMobileCompact
        viewType={viewType}
        editorState={editorState}
        onViewType={onViewType}
        onEditorState={onEditorState}
        onMentionedUser={onMentionedUser}
        onReferencedNft={onReferencedNft}
      />
    ),
    [CreateDropViewType.FULL]: (
      <CreateDropMobileFull
        viewType={viewType}
        editorState={editorState}
        title={title}
        onViewType={onViewType}
        onEditorState={onEditorState}
        onTitle={onTitle}
        onMentionedUser={onMentionedUser}
        onReferencedNft={onReferencedNft}
      />
    ),
  };

  return components[viewType];
}
