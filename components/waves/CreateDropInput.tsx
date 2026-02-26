"use client";


import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { COMMAND_PRIORITY_CRITICAL, createCommand, RootNode } from "lexical";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import PlainTextPastePlugin from "@/components/drops/create/lexical/plugins/PlainTextPastePlugin";
import { SAFE_MARKDOWN_TRANSFORMERS } from "@/components/drops/create/lexical/transformers/markdownTransformers";
import type {
  MentionedUser,
  MentionedWave,
  ReferencedNft,
} from "@/entities/IDrop";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import useCapacitor from "@/hooks/useCapacitor";
import { ActiveDropAction } from "@/types/dropInteractionTypes";

import ExampleTheme from "../drops/create/lexical/ExampleTheme";
import { EmojiNode } from "../drops/create/lexical/nodes/EmojiNode";
import { HashtagNode } from "../drops/create/lexical/nodes/HashtagNode";
import { ImageNode } from "../drops/create/lexical/nodes/ImageNode";
import { MentionNode } from "../drops/create/lexical/nodes/MentionNode";
import { WaveMentionNode } from "../drops/create/lexical/nodes/WaveMentionNode";
import ClearEditorPlugin from "../drops/create/lexical/plugins/ClearEditorPlugin";
import DragDropPastePlugin from "../drops/create/lexical/plugins/DragDropPastePlugin";
import EmojiPlugin from "../drops/create/lexical/plugins/emoji/EmojiPlugin";
import EnterKeyPlugin from "../drops/create/lexical/plugins/enter/EnterKeyPlugin";
import NewHashtagsPlugin from "../drops/create/lexical/plugins/hashtags/HashtagsPlugin";
import { MaxLengthPlugin } from "../drops/create/lexical/plugins/MaxLengthPlugin";
import NewMentionsPlugin from "../drops/create/lexical/plugins/mentions/MentionsPlugin";
import NewWaveMentionsPlugin from "../drops/create/lexical/plugins/waves/WaveMentionsPlugin";

import CreateDropEmojiPicker from "./CreateDropEmojiPicker";

import type { ClearEditorPluginHandles } from "../drops/create/lexical/plugins/ClearEditorPlugin";
import type { NewHastagsPluginHandles } from "../drops/create/lexical/plugins/hashtags/HashtagsPlugin";
import type { NewMentionsPluginHandles } from "../drops/create/lexical/plugins/mentions/MentionsPlugin";
import type { NewWaveMentionsPluginHandles } from "../drops/create/lexical/plugins/waves/WaveMentionsPlugin";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import type { EditorState } from "lexical";
import type { FocusEvent } from "react";

export interface CreateDropInputHandles {
  clearEditorState: () => void;
  focus: () => void;
}

// Create a custom command
const DISABLE_EDIT_COMMAND = createCommand("DISABLE_EDIT");

// Create a custom plugin to handle disabling
function DisableEditPlugin({ disabled }: { disabled: boolean }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (disabled) {
      return editor.registerCommand(
        DISABLE_EDIT_COMMAND,
        () => {
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      );
    }
    return () => {};
  }, [editor, disabled]);

  return null;
}

const CreateDropInput = forwardRef<
  CreateDropInputHandles,
  {
    readonly waveId: string;
    readonly editorState: EditorState | null;
    readonly type: ActiveDropAction | null;
    readonly canSubmit: boolean;
    readonly isStormMode: boolean;
    readonly submitting: boolean;
    readonly isDropMode: boolean;
    readonly onDrop?: (() => void) | undefined;
    readonly onEditorState: (editorState: EditorState) => void;
    readonly onEditorBlur?: (event: FocusEvent<HTMLDivElement>) => void;
    readonly onReferencedNft: (referencedNft: ReferencedNft) => void;
    readonly onMentionedUser: (
      mentionedUser: Omit<MentionedUser, "current_handle">
    ) => void;
    readonly onMentionedWave: (mentionedWave: MentionedWave) => void;
  }
>(
  (
    {
      waveId,
      editorState,
      type,
      canSubmit,
      isStormMode,
      isDropMode,
      submitting,
      onEditorState,
      onEditorBlur,
      onReferencedNft,
      onMentionedUser,
      onMentionedWave,
      onDrop,
    },
    ref
  ) => {
    const { isCapacitor } = useCapacitor();
    const editorConfig: InitialConfigType = {
      namespace: "User Drop",
      nodes: [
        MentionNode,
        HashtagNode,
        WaveMentionNode,
        RootNode,
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        CodeNode,
        CodeHighlightNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        AutoLinkNode,
        LinkNode,
        HorizontalRuleNode,
        ImageNode,
        EmojiNode,
      ],
      editorState,
      editable: !submitting,
      onError(error: Error): void {
        throw error;
      },
      theme: ExampleTheme,
    };

    const onEditorStateChange = (editorState: EditorState) =>
      onEditorState(editorState);

    const onMentionedUserAdded = (
      user: Omit<MentionedUser, "current_handle">
    ) => {
      onMentionedUser(user);
    };
    const onMentionedWaveAdded = (wave: MentionedWave) => {
      onMentionedWave(wave);
    };
    const onHashtagAdded = (hashtag: ReferencedNft) => onReferencedNft(hashtag);

    const getPlaceHolderText = () => {
      if (isStormMode) return "Add to the storm";
      if (type === null) return isDropMode ? "Create a drop" : "Create a post";
      switch (type) {
        case ActiveDropAction.REPLY:
          return isDropMode ? "Drop a reply" : "Post a reply";
        case ActiveDropAction.QUOTE:
          return isDropMode ? "Quote a drop" : "Post a quote";
        default:
          assertUnreachable(type);
          return "";
      }
    };

    const urlRegExp = new RegExp(
      /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/
    );
    function validateUrl(url: string): boolean {
      return url === "https://" || urlRegExp.test(url);
    }

    const clearEditorRef = useRef<ClearEditorPluginHandles | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const clearEditorState = () => {
      clearEditorRef.current?.clearEditorState();
    };

    useImperativeHandle(ref, () => ({
      clearEditorState,
      focus: () => {
        (
          editorRef.current?.querySelector(
            '[contenteditable="true"]'
          ) as HTMLElement
        ).focus();
      },
    }));

    const mentionsPluginRef = useRef<NewMentionsPluginHandles | null>(null);
    const isMentionsOpen = () => !!mentionsPluginRef.current?.isMentionsOpen();

    const hashtagPluginRef = useRef<NewHastagsPluginHandles | null>(null);
    const isHashtagsOpen = () => !!hashtagPluginRef.current?.isHashtagsOpen();

    const waveMentionsPluginRef = useRef<NewWaveMentionsPluginHandles | null>(
      null
    );
    const isWaveMentionsOpen = () =>
      !!waveMentionsPluginRef.current?.isWaveMentionsOpen();

    const canSubmitWithEnter = () =>
      !isMentionsOpen() && !isHashtagsOpen() && !isWaveMentionsOpen();

    const canSubmitRef = useRef(canSubmit);
    const onDropRef = useRef(onDrop);

    useEffect(() => {
      canSubmitRef.current = canSubmit;
    }, [canSubmit]);

    useEffect(() => {
      onDropRef.current = onDrop;
    }, [onDrop]);

    const handleSubmit = useCallback(() => {
      if (!canSubmitRef.current || !onDropRef.current) {
        return;
      }
      onDropRef.current();
    }, []);

    return (
      <div className="tailwind-scope" ref={editorRef}>
        <LexicalComposer initialConfig={editorConfig}>
          <div className="tw-flex tw-items-end tw-gap-x-3">
            <div className="tw-relative tw-w-full">
              <RichTextPlugin
                contentEditable={
                  <div className="tw-relative">
                    <ContentEditable
                      spellCheck={true}
                      autoCorrect="on"
                      style={{ touchAction: "manipulation" }}
                      onClick={(e) => {
                        // Ensure the contenteditable is properly focused and ready for paste
                        const target = e.currentTarget;
                        if (!submitting) {
                          // Use a microtask to ensure focus happens after any other handlers
                          Promise.resolve().then(() => {
                            target.focus();
                            // If there's no selection, place cursor at end
                            const selection = window.getSelection();
                            if (selection?.rangeCount === 0) {
                              const range = document.createRange();
                              range.selectNodeContents(target);
                              range.collapse(false);
                              selection.addRange(range);
                            }
                          });
                        }
                      }}
                      onBlur={onEditorBlur}
                      className={`editor-input-one-liner tw-form-input tw-block tw-max-h-[40vh] tw-w-full tw-resize-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-2.5 tw-pl-3 tw-text-base tw-font-normal tw-leading-6 tw-text-white tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out tw-scrollbar-thin tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-600 placeholder:tw-text-iron-500 focus:tw-bg-iron-950 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-text-sm ${
                        submitting ? "tw-cursor-default tw-opacity-50" : ""
                      } ${isCapacitor ? "tw-pr-[35px]" : "tw-pr-[40px]"}`}
                    />
                    <CreateDropEmojiPicker />
                  </div>
                }
                placeholder={
                  <span
                    className={`editor-placeholder ${
                      submitting ? "tw-opacity-50" : ""
                    }`}
                  >
                    {getPlaceHolderText()}
                  </span>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin />
              <OnChangePlugin onChange={onEditorStateChange} />
              <NewMentionsPlugin
                waveId={waveId}
                onSelect={onMentionedUserAdded}
                ref={mentionsPluginRef}
              />
              <NewWaveMentionsPlugin
                onSelect={onMentionedWaveAdded}
                ref={waveMentionsPluginRef}
              />
              <NewHashtagsPlugin
                onSelect={onHashtagAdded}
                ref={hashtagPluginRef}
              />
              <MaxLengthPlugin maxLength={25000} />
              <DragDropPastePlugin />
              <ListPlugin />
              <PlainTextPastePlugin />
              <MarkdownShortcutPlugin
                transformers={SAFE_MARKDOWN_TRANSFORMERS}
              />
              <TabIndentationPlugin />
              <LinkPlugin validateUrl={validateUrl} />
              <ClearEditorPlugin ref={clearEditorRef} />
              <DisableEditPlugin disabled={submitting} />
              <EnterKeyPlugin
                handleSubmit={handleSubmit}
                canSubmitWithEnter={canSubmitWithEnter}
                disabled={submitting}
              />
              <EmojiPlugin />
            </div>
          </div>
        </LexicalComposer>
      </div>
    );
  }
);

CreateDropInput.displayName = "CreateDropInput";
export default CreateDropInput;
