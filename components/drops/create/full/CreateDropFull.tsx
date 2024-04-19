import { EditorState } from "lexical";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import {
  CreateDropScreenType,
  CreateDropViewType,
} from "../utils/CreateDropWrapper";
import CreateDropFullDesktop from "./desktop/CreateDropFullDesktop";
import CreateDropFullMobile from "./mobile/CreateDropFullMobile";
import {
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../../entities/IDrop";
import { CreateDropType } from "../CreateDrop";

export default function CreateDropFull({
  screenType,
  profile,
  title,
  editorState,
  metadata,
  file,
  disabled,
  loading,
  type,
  onTitle,
  onMetadataEdit,
  onMetadataRemove,
  onViewChange,
  onEditorState,
  onMentionedUser,
  onReferencedNft,
  onFileChange,
  onDrop,
}: {
  readonly screenType: CreateDropScreenType;
  readonly profile: IProfileAndConsolidations;
  readonly title: string | null;
  readonly metadata: DropMetadata[];
  readonly editorState: EditorState | null;
  readonly file: File | null;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly type: CreateDropType;
  readonly onTitle: (newV: string | null) => void;
  readonly onMetadataEdit: (param: DropMetadata) => void;
  readonly onMetadataRemove: (key: string) => void;
  readonly onViewChange: (newV: CreateDropViewType) => void;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMentionedUser: (newUser: MentionedUser) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
  readonly onFileChange: (file: File | null) => void;
  readonly onDrop: () => void;
}) {
  const components: Record<CreateDropScreenType, JSX.Element> = {
    [CreateDropScreenType.DESKTOP]: (
      <CreateDropFullDesktop
        profile={profile}
        title={title}
        editorState={editorState}
        metadata={metadata}
        file={file}
        disabled={disabled}
        type={type}
        loading={loading}
        onTitle={onTitle}
        onMetadataEdit={onMetadataEdit}
        onMetadataRemove={onMetadataRemove}
        onEditorState={onEditorState}
        onMentionedUser={onMentionedUser}
        onReferencedNft={onReferencedNft}
        onFileChange={onFileChange}
        onViewChange={onViewChange}
        onDrop={onDrop}
      />
    ),
    [CreateDropScreenType.MOBILE]: (
      <CreateDropFullMobile
        profile={profile}
        title={title}
        editorState={editorState}
        metadata={metadata}
        file={file}
        disabled={disabled}
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
