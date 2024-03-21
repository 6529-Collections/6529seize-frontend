import { EditorState } from "lexical";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { CreateDropViewType } from "../CreateDrop";
import CreateDropDesktopCompact from "./compact/CreateDropDesktopCompact";
import CreateDropDesktopFull from "./full/CreateDropDesktopFull";
import { MentionedUser, ReferencedNft } from "../../../../entities/IDrop";
import CreateDropDesktopFooter from "./CreateDropDesktopFooter";

export default function CreateDropDesktop({
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
      <CreateDropDesktopCompact
        viewType={viewType}
        profile={profile}
        editorState={editorState}
        onViewType={onViewType}
        onEditorState={onEditorState}
        onMentionedUser={onMentionedUser}
        onReferencedNft={onReferencedNft}
      />
    ),
    [CreateDropViewType.FULL]: (
      <CreateDropDesktopFull
        viewType={viewType}
        profile={profile}
        title={title}
        editorState={editorState}
        onViewType={onViewType}
        onTitle={onTitle}
        onEditorState={onEditorState}
        onMentionedUser={onMentionedUser}
        onReferencedNft={onReferencedNft}
      />
    ),
  };

  return (
    <div className="tw-bg-iron-700 tw-p-8 tw-rounded-lg tw-space-y-4">
      {components[viewType]}
      <CreateDropDesktopFooter />
    </div>
  );
}
