import { EditorState } from "lexical";
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
import { WaveParticipationRequirement } from "../../../../generated/models/WaveParticipationRequirement";
import { WaveRequiredMetadata } from "../../../../generated/models/WaveRequiredMetadata";
import { ProfileMinWithoutSubs } from "../../../../helpers/ProfileTypes";

export interface CreateDropFullHandles {
  clearEditorState: () => void;
}

export interface CreateDropFullWaveProps {
  readonly name: string;
  readonly image: string | null;
  readonly id: string | null;
}

export interface CreateDropFullProps {
  readonly screenType: CreateDropScreenType;
  readonly profile: ProfileMinWithoutSubs;
  readonly title: string | null;
  readonly metadata: DropMetadata[];
  readonly editorState: EditorState | null;
  readonly files: File[];
  readonly canSubmit: boolean;
  readonly canAddPart: boolean;
  readonly loading: boolean;
  readonly showSubmit: boolean;
  readonly type: CreateDropType;
  readonly drop: CreateDropConfig | null;
  readonly showDropError?: boolean;
  readonly missingMedia: WaveParticipationRequirement[];
  readonly missingMetadata: WaveRequiredMetadata[];
  readonly children: React.ReactNode;
  readonly onTitle: (newV: string | null) => void;
  readonly onMetadataEdit: (param: DropMetadata) => void;
  readonly onMetadataRemove: (key: string) => void;
  readonly onViewChange: (newV: CreateDropViewType) => void;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMentionedUser: (
    newUser: Omit<MentionedUser, "current_handle">
  ) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
  readonly onFileRemove: (file: File) => void;
  readonly setFiles: (files: File[]) => void;
  readonly onDrop: () => void;
  readonly onDropPart: () => void;
}

const CreateDropFull = forwardRef<CreateDropFullHandles, CreateDropFullProps>(
  (
    {
      screenType,
      profile,
      title,
      editorState,
      metadata,
      files,
      canSubmit,
      canAddPart,
      loading,
      showSubmit,
      type,
      drop,
      showDropError = false,
      missingMedia,
      missingMetadata,
      children,
      onTitle,
      onMetadataEdit,
      onMetadataRemove,
      onViewChange,
      onEditorState,
      onMentionedUser,
      onReferencedNft,
      onFileRemove,
      setFiles,
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
          canSubmit={canSubmit}
          canAddPart={canAddPart}
          type={type}
          files={files}
          loading={loading}
          showSubmit={showSubmit}
          drop={drop}
          showDropError={showDropError}
          missingMedia={missingMedia}
          missingMetadata={missingMetadata}
          onTitle={onTitle}
          onMetadataEdit={onMetadataEdit}
          onMetadataRemove={onMetadataRemove}
          onEditorState={onEditorState}
          onMentionedUser={onMentionedUser}
          onReferencedNft={onReferencedNft}
          setFiles={setFiles}
          onFileRemove={onFileRemove}
          onViewChange={onViewChange}
          onDrop={onDrop}
          onDropPart={onDropPart}
        >
          {children}
        </CreateDropFullDesktop>
      ),
      [CreateDropScreenType.MOBILE]: (
        <CreateDropFullMobile
          ref={mobileEditorRef}
          profile={profile}
          title={title}
          files={files}
          editorState={editorState}
          metadata={metadata}
          canSubmit={canSubmit}
          canAddPart={canAddPart}
          type={type}
          loading={loading}
          drop={drop}
          showSubmit={showSubmit}
          missingMedia={missingMedia}
          missingMetadata={missingMetadata}
          onEditorState={onEditorState}
          onMetadataEdit={onMetadataEdit}
          onMetadataRemove={onMetadataRemove}
          onMentionedUser={onMentionedUser}
          onReferencedNft={onReferencedNft}
          onTitle={onTitle}
          setFiles={setFiles}
          onFileRemove={onFileRemove}
          onViewChange={onViewChange}
          onDrop={onDrop}
          onDropPart={onDropPart}
        >
          {children}
        </CreateDropFullMobile>
      ),
    };
    return <div>{components[screenType]}</div>;
  }
);

CreateDropFull.displayName = "CreateDropFull";
export default CreateDropFull;
