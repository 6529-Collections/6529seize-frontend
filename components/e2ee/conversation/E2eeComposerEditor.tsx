"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import type { ComponentProps } from "react";
import {
  $getRoot,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  type LexicalEditor,
  type EditorState,
  type RangeSelection,
} from "lexical";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "@lexical/markdown";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import {
  ComposerEditor,
  COMPOSER_RICH_TEXT_NODES,
} from "@/components/composer/ComposerEditor";
import { ComposerEmojiContext } from "@/components/composer/ComposerEmojiContext";
import ExampleTheme from "@/components/drops/create/lexical/ExampleTheme";
import { E2EE_COMPOSER_TRANSFORMERS } from "./e2eeComposerTransformers";
import EnterKeyPlugin from "@/components/drops/create/lexical/plugins/enter/EnterKeyPlugin";
import EditLastDropArrowUpPlugin from "@/components/waves/EditLastDropArrowUpPlugin";
import { E2eeComposerEmojiPicker } from "./E2eeEmojiPicker";
import { E2eeEmojiText } from "./E2eeEmojiText";
import { useE2eeEmojis } from "./E2eeEmojiProvider";
import { E2eeComposerInputPlugin } from "./E2eeComposerInputPlugin";
import { getActiveMentionQuery } from "./e2eeMentions";

export interface E2eeComposerEditorHandle {
  focus: () => void;
  blur: () => void;
  getText: () => string;
  replaceMention: (handle: string) => void;
}

type InputProps = ComponentProps<typeof ComposerEditor>["inputProps"];

const isSelectionAttached = (selection: RangeSelection | null) =>
  selection !== null &&
  $getNodeByKey(selection.anchor.key)?.isAttached() &&
  $getNodeByKey(selection.focus.key)?.isAttached();

function restoreEmojiCaret(
  editor: LexicalEditor,
  caret: RangeSelection | null
) {
  editor.focus(() =>
    editor.update(
      () => {
        if (isSelectionAttached(caret)) $setSelection(caret);
      },
      { discrete: true }
    )
  );
}

export const E2eeComposerEditor = forwardRef<
  E2eeComposerEditorHandle,
  {
    readonly value: string;
    readonly placeholder: string;
    readonly inputProps: InputProps;
    readonly onChange: (value: string) => void;
    readonly onSelection: (text: string, caret: number | null) => void;
    readonly onKeyDown: (event: KeyboardEvent) => boolean;
    readonly onSubmit: () => void;
    readonly onPasteImages: (images: readonly File[]) => void;
    readonly canAttach: boolean;
    readonly canEditLastMessage: boolean;
    readonly onEditLastMessage?: (() => boolean) | undefined;
    readonly canUseShortcuts: () => boolean;
  }
>((props, ref) => {
  const editorRef = useRef<LexicalEditor | null>(null);
  const savedSelection = useRef<RangeSelection | null>(null);
  const { sources } = useE2eeEmojis();
  const emojis = useMemo(
    () => ({
      isValid: (id: string) => sources.has(id),
      render: (id: string) => <E2eeEmojiText text={`:${id}:`} />,
    }),
    [sources]
  );

  useImperativeHandle(
    ref,
    () => ({
      focus: () => editorRef.current?.focus(),
      blur: () => editorRef.current?.blur(),
      getText: () =>
        editorRef.current
          ?.getEditorState()
          .read(() => $convertToMarkdownString(E2EE_COMPOSER_TRANSFORMERS)) ??
        "",
      replaceMention: (handle: string) =>
        editorRef.current?.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;
          const node = selection.anchor.getNode();
          if (!$isTextNode(node)) return;
          const query = getActiveMentionQuery(
            node.getTextContent(),
            selection.anchor.offset
          );
          if (!query) return;
          selection.anchor.set(node.getKey(), query.start, "text");
          selection.insertText(`@${handle} `);
        }),
    }),
    []
  );

  const onEditorState = (state: EditorState) =>
    state.read(() => {
      const markdown = $convertToMarkdownString(E2EE_COMPOSER_TRANSFORMERS);
      props.onChange(markdown);
      const selection = $getSelection();
      if (
        $isRangeSelection(selection) &&
        $isTextNode(selection.anchor.getNode())
      ) {
        props.onSelection(
          selection.anchor.getNode().getTextContent(),
          selection.anchor.offset
        );
      } else {
        props.onSelection("", null);
      }
    });

  const rememberSelection = () =>
    editorRef.current?.getEditorState().read(() => {
      const selection = $getSelection();
      savedSelection.current = $isRangeSelection(selection)
        ? selection.clone()
        : null;
    });

  const insertEmoji = (text: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.update(
      () => {
        const selection = savedSelection.current;
        if (isSelectionAttached(selection)) {
          $setSelection(selection);
        } else {
          $getRoot().selectEnd();
        }
        const current = $getSelection();
        if ($isRangeSelection(current)) current.insertText(text);
      },
      { discrete: true }
    );
    const caret = editor.getEditorState().read(() => {
      const selection = $getSelection();
      return $isRangeSelection(selection) ? selection.clone() : null;
    });
    // Restore the insertion caret after the picker has restored its trigger focus.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (editorRef.current !== editor) return;
        restoreEmojiCaret(editor, caret);
      })
    );
  };

  return (
    <ComposerEmojiContext.Provider value={emojis}>
      <ComposerEditor
        initialConfig={{
          namespace: "Encrypted message",
          nodes: COMPOSER_RICH_TEXT_NODES,
          theme: ExampleTheme,
          editorState: () =>
            $convertFromMarkdownString(props.value, E2EE_COMPOSER_TRANSFORMERS),
          onError: (error) => {
            throw error;
          },
        }}
        placeholder={props.placeholder}
        inputProps={props.inputProps}
        onEditorState={onEditorState}
        transformers={E2EE_COMPOSER_TRANSFORMERS}
        picker={
          <E2eeComposerEmojiPicker
            onOpen={rememberSelection}
            onSelect={insertEmoji}
          />
        }
      >
        <EditorRefPlugin editorRef={editorRef} />
        <E2eeComposerInputPlugin
          value={props.value}
          canAttach={props.canAttach}
          onPasteImages={props.onPasteImages}
          onKeyDown={props.onKeyDown}
        />
        <EnterKeyPlugin
          disabled={false}
          canSubmitWithEnter={props.canUseShortcuts}
          handleSubmit={props.onSubmit}
        />
        <EditLastDropArrowUpPlugin
          canEditLastDropWithArrow={props.canEditLastMessage}
          onRequestEditLastDrop={props.onEditLastMessage}
          canUseArrowUpShortcut={props.canUseShortcuts}
        />
      </ComposerEditor>
    </ComposerEmojiContext.Provider>
  );
});
E2eeComposerEditor.displayName = "E2eeComposerEditor";
