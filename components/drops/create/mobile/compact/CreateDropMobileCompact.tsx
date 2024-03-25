import { EditorState } from "lexical";
import { CreateDropScreenType, CreateDropViewType } from "../../CreateDrop";
import CreateDropContent from "../../utils/CreateDropContent";
import { MentionedUser, ReferencedNft } from "../../../../../entities/IDrop";

export default function CreateDropMobileCompact({
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
  const onViewClick = () => onViewType(CreateDropViewType.FULL);

  return (
    <div className="tw-w-full tw-inline-flex tw-justify-between tw-space-x-4">
      <div className="tw-w-full">
        <CreateDropContent
          screenType={CreateDropScreenType.MOBILE}
          viewType={viewType}
          editorState={editorState}
          onEditorState={onEditorState}
          onMentionedUser={onMentionedUser}
          onReferencedNft={onReferencedNft}
          onFileChange={onFileChange}
          onViewClick={onViewClick}
        />
      </div>
      <button className="tw-w-12">Drop</button>
    </div>
  );
}
