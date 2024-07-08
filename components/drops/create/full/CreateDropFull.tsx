import { EditorState } from "lexical";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { CreateDropScreenType } from "../utils/CreateDropWrapper";
import CreateDropFullDesktop, {
  CreateDropFullDesktopHandles,
} from "./desktop/CreateDropFullDesktop";
import CreateDropFullMobile, {
  CreateDropFullMobileHandles,
} from "./mobile/CreateDropFullMobile";
import {
  CreateDropConfig,
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../../entities/IDrop";
import { CreateDropType, CreateDropViewType } from "../CreateDrop";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { ProfileMin } from "../../../../generated/models/ProfileMin";

export interface CreateDropFullHandles {
  clearEditorState: () => void;
}

const CreateDropFull = forwardRef<
  CreateDropFullHandles,
  {
    readonly screenType: CreateDropScreenType;
    readonly profile: ProfileMin;
    readonly title: string | null;
    readonly metadata: DropMetadata[];
    readonly editorState: EditorState | null;
    readonly file: File | null;
    readonly canSubmit: boolean;
    readonly canAddPart: boolean;
    readonly loading: boolean;
    readonly showSubmit: boolean;
    readonly type: CreateDropType;
    readonly drop: CreateDropConfig | null;
    readonly showDropError?: boolean;
    readonly isStormMode: boolean;
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
  }
>(
  (
    {
      screenType,
      profile,
      title,
      editorState,
      metadata,
      file,
      canSubmit,
      canAddPart,
      loading,
      showSubmit,
      type,
      drop,
      showDropError = false,
      isStormMode,
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
    },
    ref
  ) => {
    const desktopEditorRef = useRef<CreateDropFullDesktopHandles | null>(null);
    const mobileEditorRef = useRef<CreateDropFullMobileHandles | null>(null);
    const clearEditorState = () => {
      desktopEditorRef.current?.clearEditorState();
      mobileEditorRef.current?.clearEditorState();
    };

    useImperativeHandle(ref, () => ({
      clearEditorState,
    }));

    const components: Record<CreateDropScreenType, JSX.Element> = {
      [CreateDropScreenType.DESKTOP]: (
        <CreateDropFullDesktop
          ref={desktopEditorRef}
          profile={profile}
          title={title}
          editorState={editorState}
          metadata={metadata}
          file={file}
          canSubmit={canSubmit}
          canAddPart={canAddPart}
          type={type}
          loading={loading}
          showSubmit={showSubmit}
          drop={drop}
          showDropError={showDropError}
          isStormMode={isStormMode}
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
          ref={mobileEditorRef}
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
          showSubmit={showSubmit}
          isStormMode={isStormMode}
          onEditorState={onEditorState}
          onMetadataEdit={onMetadataEdit}
          onMetadataRemove={onMetadataRemove}
          onMentionedUser={onMentionedUser}
          onReferencedNft={onReferencedNft}
          onTitle={onTitle}
          onFileChange={onFileChange}
          onViewChange={onViewChange}
          onDrop={onDrop}
          onDropPart={onDropPart}
        />
      ),
    };
    return <div>{components[screenType]}</div>;
  }
);

CreateDropFull.displayName = "CreateDropFull";
export default CreateDropFull;
