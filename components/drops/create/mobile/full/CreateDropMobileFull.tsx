import { useState } from "react";
import { CreateDropScreenType, CreateDropViewType } from "../../CreateDrop";
import { EditorState } from "lexical";
import { MentionedUser, ReferencedNft } from "../../../../../entities/IDrop";
import CreateDropContent from "../../utils/CreateDropContent";
import CreateDropMobileFullWrapper from "./CreateDropMobileFullWrapper";
import CreateDropMobileFullTitle from "./CreateDropMobileFullTitle";
import CreateDropMobileFullMetadata from "./metadata/CreateDropMobileFullMetadata";
import CreateDropSelectFile from "../../utils/select-file/CreateDropSelectFile";

export default function CreateDropMobileFull({
  viewType,
  editorState,
  title,
  metadata,
  onViewType,
  onEditorState,
  onTitle,
  onMetadataEdit,
  onMetadataRemove,
  onFileChange,
  onMentionedUser,
  onReferencedNft,
}: {
  readonly viewType: CreateDropViewType;
  readonly editorState: EditorState | null;
  readonly title: string | null;
  readonly metadata: { readonly key: string; readonly value: string }[];
  readonly onViewType: (newV: CreateDropViewType) => void;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onTitle: (newV: string | null) => void;
  readonly onMetadataEdit: (param: {
    readonly key: string;
    readonly value: string;
  }) => void;
  readonly onMetadataRemove: (key: string) => void;
  readonly onFileChange: (file: File) => void;
  readonly onMentionedUser: (newUser: MentionedUser) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
}) {
  const onViewClick = () => onViewType(CreateDropViewType.COMPACT);
  const [isOpen, setIsOpen] = useState(true);

  const onClose = () => setIsOpen(false);

  return (
    <CreateDropMobileFullWrapper
      isOpen={isOpen}
      onClose={onClose}
      onViewClick={onViewClick}
    >
      <div className="tw-relative tw-mt-3 tw-flex-1 tw-px-4 sm:tw-px-6 tw-gap-y-6 tw-flex tw-flex-col">
        <CreateDropMobileFullTitle title={title} onTitle={onTitle} />
        <CreateDropContent
          screenType={CreateDropScreenType.MOBILE}
          viewType={viewType}
          editorState={editorState}
          onEditorState={onEditorState}
          onMentionedUser={onMentionedUser}
          onReferencedNft={onReferencedNft}
          onViewClick={onViewClick}
          onFileChange={onFileChange}
        />
        <CreateDropMobileFullMetadata
          metadata={metadata}
          onMetadataEdit={onMetadataEdit}
          onMetadataRemove={onMetadataRemove}
        />
        <CreateDropSelectFile onFileChange={onFileChange} />
        <button>Drop</button>
      </div>
    </CreateDropMobileFullWrapper>
  );
}
