"use client";

import type { AppToastInput } from "@/components/utils/toast/AppToast";
import type { CreateDropConfig } from "@/entities/IDrop";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef } from "react";
import { handleComposerFileChange } from "./content-helpers";
import type { MutableCurrentRef, ScopedValueState } from "./types";

export const useCreateDropFileHandlers = ({
  drop,
  files,
  isWideContainer,
  waveId,
  externalAttachmentDrop,
  onExternalAttachmentDropConsumed,
  setToast,
  setFiles,
  setDrop,
  setShowOptionsState,
  shouldAnimateOptionsRef,
  closeOnNextInputRef,
}: {
  readonly drop: CreateDropConfig | null;
  readonly files: File[];
  readonly isWideContainer: boolean;
  readonly waveId: string;
  readonly externalAttachmentDrop:
    | {
        readonly token: number;
        readonly files: File[];
      }
    | null
    | undefined;
  readonly onExternalAttachmentDropConsumed: (() => void) | undefined;
  readonly setToast: (toast: AppToastInput) => void;
  readonly setFiles: Dispatch<SetStateAction<File[]>>;
  readonly setDrop: Dispatch<SetStateAction<CreateDropConfig | null>>;
  readonly setShowOptionsState: Dispatch<
    SetStateAction<ScopedValueState<boolean> | null>
  >;
  readonly shouldAnimateOptionsRef: MutableCurrentRef<boolean>;
  readonly closeOnNextInputRef: MutableCurrentRef<boolean>;
}) => {
  const lastExternalAttachmentDropTokenRef = useRef<number | null>(null);

  const handleFileChange = (newFiles: File[]) => {
    handleComposerFileChange({
      newFiles,
      drop,
      files,
      isWideContainer,
      waveId,
      setToast,
      setFiles,
      setShowOptionsState,
      shouldAnimateOptionsRef,
      closeOnNextInputRef,
    });
  };

  const latestHandleFileChangeRef = useRef(handleFileChange);
  latestHandleFileChangeRef.current = handleFileChange;

  useEffect(() => {
    if (!externalAttachmentDrop || externalAttachmentDrop.files.length === 0) {
      return;
    }

    if (
      lastExternalAttachmentDropTokenRef.current ===
      externalAttachmentDrop.token
    ) {
      return;
    }

    lastExternalAttachmentDropTokenRef.current = externalAttachmentDrop.token;
    latestHandleFileChangeRef.current(externalAttachmentDrop.files);
    onExternalAttachmentDropConsumed?.();
  }, [externalAttachmentDrop, onExternalAttachmentDropConsumed]);

  const removeFile = (file: File, partIndex?: number) => {
    if (partIndex === undefined) {
      // Remove file from the current files array
      setFiles((prevFiles) => prevFiles.filter((f) => f !== file));
    } else {
      // Remove file from a specific part
      setDrop((prevDrop) => {
        if (!prevDrop) return null;

        const newParts = [...prevDrop.parts];
        const part = newParts[partIndex];
        if (!part) return prevDrop;
        newParts[partIndex] = {
          ...part,
          media: part.media.filter((f) => f !== file),
        };
        return { ...prevDrop, parts: newParts };
      });
    }
  };

  return {
    handleFileChange,
    removeFile,
  };
};
