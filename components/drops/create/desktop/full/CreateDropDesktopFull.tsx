import { MentionedUser, ReferencedNft } from "../../../../../entities/IDrop";
import { EditorState } from "lexical";
import { CreateDropViewType } from "../../CreateDrop";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import CreateDropDesktopFullContent from "./CreateDropDesktopFullContent";
import CreateDropDesktopFullTitle from "./CreateDropDesktopFullTitle";
import CreateDropPfp from "../../utils/CreateDropPfp";

export default function CreateDropDesktopFull({
  viewType,
  profile,
  title,
  editorState,
  onViewType,
  onTitle,
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
  return (
    <>
      <div className="tw-w-full tw-inline-flex tw-justify-between">
        <CreateDropPfp profile={profile} />
        <CreateDropDesktopFullTitle title={title} onTitle={onTitle} />
      </div>
      <CreateDropDesktopFullContent
        viewType={viewType}
        editorState={editorState}
        onEditorState={onEditorState}
        onMentionedUser={onMentionedUser}
        onReferencedNft={onReferencedNft}
        onViewType={onViewType}
      />
    </>
  );
}
