import { EditorState } from "lexical";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import { CreateDropViewType } from "../../CreateDrop";
import CreateDropDesktopCompactContent from "./CreateDropDesktopCompactContent";
import { MentionedUser, ReferencedNft } from "../../../../../entities/IDrop";
import CreateDropPfp from "../../utils/CreateDropPfp";

export default function CreateDropDesktopCompact({
  viewType,
  profile,
  editorState,
  onViewType,
  onEditorState,
  onMentionedUser,
  onReferencedNft,
}: {
  readonly viewType: CreateDropViewType;
  readonly profile: IProfileAndConsolidations;
  readonly editorState: EditorState | null;
  readonly onViewType: (newV: CreateDropViewType) => void;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMentionedUser: (newUser: MentionedUser) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
}) {
  return (
    <div className="tw-inline-flex tw-w-full tw-items-center tw-space-x-2">
      <CreateDropPfp profile={profile} />
      <div className="tw-w-full">
        <CreateDropDesktopCompactContent
          viewType={viewType}
          editorState={editorState}
          onViewType={onViewType}
          onEditorState={onEditorState}
          onMentionedUser={onMentionedUser}
          onReferencedNft={onReferencedNft}
        />
      </div>
    </div>
  );
}
