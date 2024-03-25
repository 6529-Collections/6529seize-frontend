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
  metadata,
  editorState,
  onTitle,
  onMetadataEdit,
  onMetadataRemove,
  onViewType,
  onEditorState,
  onMentionedUser,
  onReferencedNft,
  onFileChange,
}: {
  readonly viewType: CreateDropViewType;
  readonly profile: IProfileAndConsolidations;
  readonly title: string | null;
  readonly metadata: { readonly key: string; readonly value: string }[];
  readonly editorState: EditorState | null;
  readonly onViewType: (newV: CreateDropViewType) => void;
  readonly onTitle: (newV: string | null) => void;
  readonly onMetadataEdit: (param: {
    readonly key: string;
    readonly value: string;
  }) => void;
  readonly onMetadataRemove: (key: string) => void;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMentionedUser: (newUser: MentionedUser) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
  readonly onFileChange: (file: File) => void;
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
        onFileChange={onFileChange}
      />
    ),
    [CreateDropViewType.FULL]: (
      <CreateDropDesktopFull
        viewType={viewType}
        profile={profile}
        title={title}
        metadata={metadata}
        editorState={editorState}
        onViewType={onViewType}
        onTitle={onTitle}
        onMetadataEdit={onMetadataEdit}
        onMetadataRemove={onMetadataRemove}
        onEditorState={onEditorState}
        onMentionedUser={onMentionedUser}
        onReferencedNft={onReferencedNft}
        onFileChange={onFileChange}
      />
    ),
  };

  return (
    <div className="tw-bg-iron-700 tw-p-8 tw-rounded-lg tw-space-y-4">
      {components[viewType]}
      <CreateDropDesktopFooter onFileChange={onFileChange} />
    </div>
  );
}
