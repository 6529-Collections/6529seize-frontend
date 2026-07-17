"use client";

import type { CreateDropConfig } from "@/entities/IDrop";
import { getMentionedGroupsFromParts } from "@/helpers/waves/drop-group-mentions";
import type { EditorState } from "lexical";
import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { CreateDropInputHandles } from "../CreateDropInput";
import type { MutableCurrentRef } from "./types";

interface UseStormPartActionsParams {
  readonly canAddPart: boolean;
  readonly canMentionAll: boolean;
  readonly collapseOptions: () => void;
  readonly createDropInputRef: MutableCurrentRef<CreateDropInputHandles | null>;
  readonly drop: CreateDropConfig | null;
  readonly editingPartIndex: number | null;
  readonly finalizeAndAddDropPartDraft: (
    replacePartIndex?: number | null
  ) => CreateDropConfig;
  readonly keepOptionsVisible: boolean;
  readonly refreshState: () => void;
  readonly setDrop: Dispatch<SetStateAction<CreateDropConfig | null>>;
  readonly setEditingPartIndex: Dispatch<SetStateAction<number | null>>;
  readonly setEditorState: Dispatch<SetStateAction<EditorState | null>>;
  readonly setFiles: Dispatch<SetStateAction<File[]>>;
  readonly setIsStormMode: Dispatch<SetStateAction<boolean>>;
  readonly submitting: boolean;
}

export const useStormPartActions = ({
  canAddPart,
  canMentionAll,
  collapseOptions,
  createDropInputRef,
  drop,
  editingPartIndex,
  finalizeAndAddDropPartDraft,
  keepOptionsVisible,
  refreshState,
  setDrop,
  setEditingPartIndex,
  setEditorState,
  setFiles,
  setIsStormMode,
  submitting,
}: UseStormPartActionsParams) => {
  const finalizeAndAddDropPart = useCallback(() => {
    const updatedDrop = finalizeAndAddDropPartDraft(editingPartIndex);
    setEditingPartIndex(null);
    return updatedDrop;
  }, [editingPartIndex, finalizeAndAddDropPartDraft, setEditingPartIndex]);

  const onEditPart = useCallback(
    (partIndex: number) => {
      if (submitting || editingPartIndex !== null || canAddPart) {
        return;
      }

      const part = drop?.parts[partIndex];
      if (!part) {
        return;
      }

      setEditingPartIndex(partIndex);
      createDropInputRef.current?.clearEditorState();
      setEditorState(null);
      setFiles([...part.media]);
      if (part.content) {
        createDropInputRef.current?.setMarkdown(part.content);
      }
      createDropInputRef.current?.focus();
    },
    [
      canAddPart,
      createDropInputRef,
      drop,
      editingPartIndex,
      setEditingPartIndex,
      setEditorState,
      setFiles,
      submitting,
    ]
  );

  const onCancelPartEdit = useCallback(() => {
    createDropInputRef.current?.clearEditorState();
    setEditorState(null);
    setFiles([]);
    setEditingPartIndex(null);
    createDropInputRef.current?.focus();
  }, [createDropInputRef, setEditingPartIndex, setEditorState, setFiles]);

  const onMovePart = useCallback(
    (partIndex: number, direction: -1 | 1) => {
      if (submitting || editingPartIndex !== null) {
        return;
      }

      setDrop((currentDrop) => {
        if (!currentDrop) {
          return null;
        }

        const destinationIndex = partIndex + direction;
        if (
          destinationIndex < 0 ||
          destinationIndex >= currentDrop.parts.length
        ) {
          return currentDrop;
        }

        const parts = [...currentDrop.parts];
        const currentPart = parts[partIndex];
        const destinationPart = parts[destinationIndex];
        if (!currentPart || !destinationPart) {
          return currentDrop;
        }

        parts[partIndex] = destinationPart;
        parts[destinationIndex] = currentPart;
        return {
          ...currentDrop,
          parts,
          mentioned_groups: getMentionedGroupsFromParts(parts, canMentionAll),
        };
      });
    },
    [canMentionAll, editingPartIndex, setDrop, submitting]
  );

  const onRemovePart = useCallback(
    (partIndex: number) => {
      if (submitting || editingPartIndex !== null) {
        return;
      }

      setDrop((currentDrop) => {
        if (!currentDrop) {
          return null;
        }

        const parts = currentDrop.parts.filter(
          (_, index) => index !== partIndex
        );
        return {
          ...currentDrop,
          parts,
          mentioned_groups: getMentionedGroupsFromParts(parts, canMentionAll),
        };
      });
    },
    [canMentionAll, editingPartIndex, setDrop, submitting]
  );

  const onDiscardStorm = useCallback(() => {
    refreshState();
    setEditingPartIndex(null);
    setIsStormMode(false);
  }, [refreshState, setEditingPartIndex, setIsStormMode]);

  const breakIntoStorm = useCallback(() => {
    finalizeAndAddDropPart();
    setIsStormMode(true);
    if (!keepOptionsVisible) {
      collapseOptions();
    }
  }, [
    collapseOptions,
    finalizeAndAddDropPart,
    keepOptionsVisible,
    setIsStormMode,
  ]);

  return {
    breakIntoStorm,
    finalizeAndAddDropPart,
    onCancelPartEdit,
    onDiscardStorm,
    onEditPart,
    onMovePart,
    onRemovePart,
  };
};
