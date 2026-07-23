"use client";

import type { CreateDropConfig } from "@/entities/IDrop";
import { getMentionedGroupsFromParts } from "@/helpers/waves/drop-group-mentions";
import type { EditorState } from "lexical";
import { useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import type { CreateDropInputHandles } from "../CreateDropInput";
import { exportComposerMarkdown } from "./exportComposerMarkdown";
import type { MutableCurrentRef } from "./types";

interface UseStormPartActionsParams {
  readonly canAddPart: boolean;
  readonly canMentionAll: boolean;
  readonly collapseOptions: () => void;
  readonly createDropInputRef: MutableCurrentRef<CreateDropInputHandles | null>;
  readonly drop: CreateDropConfig | null;
  readonly editingPartIndex: number | null;
  readonly finalizeAndAddDropPartDraft: (
    markdownOverride?: string | null,
    replacePartIndex?: number | null
  ) => CreateDropConfig;
  readonly keepOptionsVisible: boolean;
  readonly onMentionAliasExpansionError: () => void;
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
  onMentionAliasExpansionError,
  refreshState,
  setDrop,
  setEditingPartIndex,
  setEditorState,
  setFiles,
  setIsStormMode,
  submitting,
}: UseStormPartActionsParams) => {
  const isFinalizingPartRef = useRef(false);

  const finalizeResolvedDropPart = useCallback(
    (resolvedMarkdown: string | null) => {
      const updatedDrop = finalizeAndAddDropPartDraft(
        resolvedMarkdown,
        editingPartIndex
      );
      setEditingPartIndex(null);
      return updatedDrop;
    },
    [editingPartIndex, finalizeAndAddDropPartDraft, setEditingPartIndex]
  );

  const finalizeCurrentDropPart = useCallback(async () => {
    if (isFinalizingPartRef.current) {
      return null;
    }

    isFinalizingPartRef.current = true;
    try {
      const expandMentionAliases =
        createDropInputRef.current?.expandMentionAliases;
      if (!expandMentionAliases) {
        onMentionAliasExpansionError();
        return null;
      }

      const expansion = await expandMentionAliases();
      if (!expansion.completed) {
        return null;
      }

      return finalizeResolvedDropPart(
        exportComposerMarkdown(expansion.editorState)
      );
    } catch {
      onMentionAliasExpansionError();
      return null;
    } finally {
      isFinalizingPartRef.current = false;
    }
  }, [
    createDropInputRef,
    finalizeResolvedDropPart,
    onMentionAliasExpansionError,
  ]);

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

  const breakIntoStorm = useCallback(async () => {
    const updatedDrop = await finalizeCurrentDropPart();
    if (!updatedDrop) {
      return;
    }

    setIsStormMode(true);
    if (!keepOptionsVisible) {
      collapseOptions();
    }
  }, [
    collapseOptions,
    finalizeCurrentDropPart,
    keepOptionsVisible,
    setIsStormMode,
  ]);

  return {
    breakIntoStorm,
    finalizeResolvedDropPart,
    onCancelPartEdit,
    onDiscardStorm,
    onEditPart,
    onMovePart,
    onRemovePart,
  };
};
