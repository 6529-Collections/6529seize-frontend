import { EditorState } from "lexical";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { CreateDropScreenType } from "../utils/CreateDropWrapper";
import CreateDropFullDesktop from "./desktop/CreateDropFullDesktop";
import CreateDropFullMobile from "./mobile/CreateDropFullMobile";
import {
  CreateDropConfig,
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../../entities/IDrop";
import { CreateDropType, CreateDropViewType } from "../CreateDrop";

export default function CreateDropFull({
  screenType,
  profile,
  title,
  editorState,
  metadata,
  file,
  canSubmit,
  canAddPart,
  loading,
  type,
  drop,
  onTitle,
  onMetadataEdit,
  onMetadataRemove,
  onViewChange,
  onEditorState,
  onMentionedUser,
  onReferencedNft,
  onFileChange,
  onDrop,
  onDropPart,
}: {
  readonly screenType: CreateDropScreenType;
  readonly profile: IProfileAndConsolidations;
  readonly title: string | null;
  readonly metadata: DropMetadata[];
  readonly editorState: EditorState | null;
  readonly file: File | null;
  readonly canSubmit: boolean;
  readonly canAddPart: boolean;
  readonly loading: boolean;
  readonly type: CreateDropType;
  readonly drop: CreateDropConfig | null;
  readonly onTitle: (newV: string | null) => void;
  readonly onMetadataEdit: (param: DropMetadata) => void;
  readonly onMetadataRemove: (key: string) => void;
  readonly onViewChange: (newV: CreateDropViewType) => void;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMentionedUser: (
    newUser: Omit<MentionedUser, "current_handle">
  ) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
  readonly onFileChange: (file: File | null) => void;
  readonly onDrop: () => void;
  readonly onDropPart: () => void;
}) {
  const components: Record<CreateDropScreenType, JSX.Element> = {
    [CreateDropScreenType.DESKTOP]: (
      <CreateDropFullDesktop
        profile={profile}
        title={title}
        editorState={editorState}
        metadata={metadata}
        file={file}
        canSubmit={canSubmit}
        canAddPart={canAddPart}
        type={type}
        loading={loading}
        drop={drop}
        onTitle={onTitle}
        onMetadataEdit={onMetadataEdit}
        onMetadataRemove={onMetadataRemove}
        onEditorState={onEditorState}
        onMentionedUser={onMentionedUser}
        onReferencedNft={onReferencedNft}
        onFileChange={onFileChange}
        onViewChange={onViewChange}
        onDrop={onDrop}
        onDropPart={onDropPart}
      />
    ),
    [CreateDropScreenType.MOBILE]: (
      <CreateDropFullMobile
        profile={profile}
        title={title}
        editorState={editorState}
        metadata={metadata}
        file={file}
        canSubmit={canSubmit}
        type={type}
        loading={loading}
        onEditorState={onEditorState}
        onMetadataEdit={onMetadataEdit}
        onMetadataRemove={onMetadataRemove}
        onMentionedUser={onMentionedUser}
        onReferencedNft={onReferencedNft}
        onTitle={onTitle}
        onFileChange={onFileChange}
        onViewChange={onViewChange}
        onDrop={onDrop}
      />
    ),
  };
  return <div>{components[screenType]}</div>;
}
