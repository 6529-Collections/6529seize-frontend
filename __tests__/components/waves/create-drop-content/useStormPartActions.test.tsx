jest.unmock("lexical");

import { act, renderHook } from "@testing-library/react";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
  type EditorState,
} from "lexical";
import { useStormPartActions } from "@/components/waves/create-drop-content/useStormPartActions";
import type { CreateDropConfig } from "@/entities/IDrop";

const createEditorState = (content: string): EditorState => {
  const editor = createEditor({
    namespace: "storm-mention-alias-test",
    onError: (error) => {
      throw error;
    },
  });
  editor.update(
    () => {
      $getRoot().append(
        $createParagraphNode().append($createTextNode(content))
      );
    },
    { discrete: true }
  );
  return editor.getEditorState();
};

const updatedDrop: CreateDropConfig = {
  parts: [],
  referenced_nfts: [],
  mentioned_users: [],
  metadata: [],
  signature: null,
};

const createParams = ({
  expandMentionAliases,
}: {
  readonly expandMentionAliases: jest.Mock;
}) => ({
  canAddPart: true,
  canMentionAll: false,
  collapseOptions: jest.fn(),
  createDropInputRef: {
    current: {
      blur: jest.fn(),
      clearEditorState: jest.fn(),
      expandMentionAliases,
      focus: jest.fn(),
      setMarkdown: jest.fn(),
    },
  },
  drop: null,
  editingPartIndex: null,
  finalizeAndAddDropPartDraft: jest.fn(() => updatedDrop),
  keepOptionsVisible: false,
  onMentionAliasExpansionError: jest.fn(),
  refreshState: jest.fn(),
  setDrop: jest.fn(),
  setEditingPartIndex: jest.fn(),
  setEditorState: jest.fn(),
  setFiles: jest.fn(),
  setIsStormMode: jest.fn(),
  submitting: false,
});

describe("useStormPartActions", () => {
  it("expands mention aliases before finalizing the first storm part", async () => {
    const expandMentionAliases = jest.fn(async () => ({
      completed: true,
      editorState: createEditorState("resolved part"),
    }));
    const params = createParams({ expandMentionAliases });
    const { result } = renderHook(() => useStormPartActions(params));

    await act(async () => {
      await result.current.breakIntoStorm();
    });

    expect(expandMentionAliases).toHaveBeenCalledTimes(1);
    expect(params.finalizeAndAddDropPartDraft).toHaveBeenCalledWith(
      "resolved part",
      null
    );
    expect(params.setIsStormMode).toHaveBeenCalledWith(true);
    expect(params.collapseOptions).toHaveBeenCalledTimes(1);
  });

  it("does not finalize when mention alias expansion is incomplete", async () => {
    const expandMentionAliases = jest.fn(async () => ({
      completed: false,
      editorState: createEditorState("unresolved @frens"),
    }));
    const params = createParams({ expandMentionAliases });
    const { result } = renderHook(() => useStormPartActions(params));

    await act(async () => {
      await result.current.breakIntoStorm();
    });

    expect(params.finalizeAndAddDropPartDraft).not.toHaveBeenCalled();
    expect(params.setIsStormMode).not.toHaveBeenCalled();
  });

  it("ignores a second finalization while alias expansion is in progress", async () => {
    let completeExpansion: ((editorState: EditorState) => void) | undefined;
    const expandMentionAliases = jest.fn(
      () =>
        new Promise<{ completed: true; editorState: EditorState }>(
          (resolve) => {
            completeExpansion = (editorState) =>
              resolve({ completed: true, editorState });
          }
        )
    );
    const params = createParams({ expandMentionAliases });
    const { result } = renderHook(() => useStormPartActions(params));

    await act(async () => {
      const firstFinalization = result.current.breakIntoStorm();
      const duplicateFinalization = result.current.breakIntoStorm();
      completeExpansion?.(createEditorState("resolved once"));
      await Promise.all([firstFinalization, duplicateFinalization]);
    });

    expect(expandMentionAliases).toHaveBeenCalledTimes(1);
    expect(params.finalizeAndAddDropPartDraft).toHaveBeenCalledTimes(1);
    expect(params.finalizeAndAddDropPartDraft).toHaveBeenCalledWith(
      "resolved once",
      null
    );
  });
});
