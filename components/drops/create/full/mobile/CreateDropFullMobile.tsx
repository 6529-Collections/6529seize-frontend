import { useState } from "react";
import CreateDropFullMobileWrapper from "./CreateDropFullMobileWrapper";
import {
  CreateDropScreenType,
  CreateDropViewType,
} from "../../utils/CreateDropWrapper";
import { EditorState } from "lexical";
import {
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../../../entities/IDrop";
import CreateDropFullMobileTitle from "./CreateDropFullMobileTitle";
import CreateDropContent from "../../utils/CreateDropContent";
import CreateDropFullMobileMetadata from "./CreateDropFullMobileMetadata";
import CreateDropSelectFile from "../../utils/select-file/CreateDropSelectFile";

export default function CreateDropFullMobile({
  title,
  editorState,
  metadata,
  file,
  onEditorState,
  onMetadataEdit,
  onMetadataRemove,
  onMentionedUser,
  onReferencedNft,
  onTitle,
  onFileChange,
  onViewChange,
  onDrop,
}: {
  readonly title: string | null;
  readonly editorState: EditorState | null;
  readonly metadata: DropMetadata[];
  readonly file: File | null;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMetadataEdit: (param: DropMetadata) => void;
  readonly onMetadataRemove: (key: string) => void;
  readonly onMentionedUser: (newUser: MentionedUser) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
  readonly onTitle: (newV: string | null) => void;
  readonly onFileChange: (file: File | null) => void;
  readonly onViewChange: (newV: CreateDropViewType) => void;
  readonly onDrop: () => void;
}) {
  const onViewClick = () => onViewChange(CreateDropViewType.COMPACT);
  const [isOpen, setIsOpen] = useState(true);

  const onClose = () => setIsOpen(false);

  return (
    <CreateDropFullMobileWrapper
      isOpen={isOpen}
      onClose={onClose}
      onViewClick={onViewClick}
    >
      <div className="tw-relative tw-mt-3 tw-flex-1 tw-px-4 sm:tw-px-6 tw-gap-y-6 tw-flex tw-flex-col">
        <CreateDropFullMobileTitle title={title} onTitle={onTitle} />
        <CreateDropContent
          screenType={CreateDropScreenType.MOBILE}
          viewType={CreateDropViewType.FULL}
          editorState={editorState}
          onEditorState={onEditorState}
          onMentionedUser={onMentionedUser}
          onReferencedNft={onReferencedNft}
          onViewClick={onViewClick}
          onFileChange={onFileChange}
        />
        <CreateDropFullMobileMetadata
          metadata={metadata}
          onMetadataEdit={onMetadataEdit}
          onMetadataRemove={onMetadataRemove}
        />
        <CreateDropSelectFile onFileChange={onFileChange} file={file} />
        <button onClick={onDrop}>Drop</button>
      </div>
    </CreateDropFullMobileWrapper>
  );
}
