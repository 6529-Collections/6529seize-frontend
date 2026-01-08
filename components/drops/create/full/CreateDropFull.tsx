"use client";

import type { EditorState } from "lexical";
import { CreateDropScreenType } from "../utils/CreateDropWrapper";
import type {
  CreateDropFullDesktopHandles,
} from "./desktop/CreateDropFullDesktop";
import CreateDropFullDesktop from "./desktop/CreateDropFullDesktop";
import type {
  CreateDropFullMobileHandles,
} from "./mobile/CreateDropFullMobile";
import CreateDropFullMobile from "./mobile/CreateDropFullMobile";
import type {
  CreateDropConfig,
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "@/entities/IDrop";
import type { CreateDropType, CreateDropViewType } from "../types";
import { forwardRef, useImperativeHandle, useRef, type JSX } from "react";
import type { ApiWaveParticipationRequirement } from "@/generated/models/ApiWaveParticipationRequirement";
import type { ApiWaveRequiredMetadata } from "@/generated/models/ApiWaveRequiredMetadata";

export interface CreateDropFullHandles {
  clearEditorState: () => void;
}

interface CreateDropFullProps {
  readonly screenType: CreateDropScreenType;
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
  readonly showDropError?: boolean | undefined;
  readonly missingMedia: ApiWaveParticipationRequirement[];
  readonly missingMetadata: ApiWaveRequiredMetadata[];
  readonly waveId: string | null;
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
      waveId,
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
          title={title}
          editorState={editorState}
          metadata={metadata}
          canSubmit={canSubmit}
          canAddPart={canAddPart}
          type={type}
          waveId={waveId}
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
          title={title}
          files={files}
          editorState={editorState}
          metadata={metadata}
          canSubmit={canSubmit}
          canAddPart={canAddPart}
          type={type}
          waveId={waveId}
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
