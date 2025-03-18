import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import {
  forwardRef,
  useImperativeHandle,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  EditorState,
  RootNode,
  COMMAND_PRIORITY_CRITICAL,
  createCommand,
} from "lexical";

import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";

import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { ListNode, ListItemNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { MentionedUser, ReferencedNft } from "../../entities/IDrop";
import { ActiveDropAction } from "../../types/dropInteractionTypes";
import { MentionNode } from "../drops/create/lexical/nodes/MentionNode";
import { HashtagNode } from "../drops/create/lexical/nodes/HashtagNode";
import { ImageNode } from "../drops/create/lexical/nodes/ImageNode";
import ExampleTheme from "../drops/create/lexical/ExampleTheme";
import { assertUnreachable } from "../../helpers/AllowlistToolHelpers";
import ClearEditorPlugin, {
  ClearEditorPluginHandles,
} from "../drops/create/lexical/plugins/ClearEditorPlugin";
import NewMentionsPlugin, {
  NewMentionsPluginHandles,
} from "../drops/create/lexical/plugins/mentions/MentionsPlugin";
import NewHashtagsPlugin, {
  NewHastagsPluginHandles,
} from "../drops/create/lexical/plugins/hashtags/HashtagsPlugin";
import { MaxLengthPlugin } from "../drops/create/lexical/plugins/MaxLengthPlugin";
import DragDropPastePlugin from "../drops/create/lexical/plugins/DragDropPastePlugin";
import EnterKeyPlugin from "../drops/create/lexical/plugins/enter/EnterKeyPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

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
    readonly onDrop?: () => void;
    readonly onEditorState: (editorState: EditorState) => void;
    readonly onReferencedNft: (referencedNft: ReferencedNft) => void;
    readonly onMentionedUser: (
      mentionedUser: Omit<MentionedUser, "current_handle">
    ) => void;
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
      onReferencedNft,
      onMentionedUser,
      onDrop,
    },
    ref
  ) => {
    const editorConfig: InitialConfigType = {
      namespace: "User Drop",
      nodes: [
        MentionNode,
        HashtagNode,
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
    const onHashtagAdded = (hashtag: ReferencedNft) => onReferencedNft(hashtag);

    const getPlaceHolderText = () => {
      if (isStormMode) return "Add to the storm";
      if (!type) return isDropMode ? "Create a drop" : "Create a post";
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
        )?.focus();
      },
    }));

    const mentionsPluginRef = useRef<NewMentionsPluginHandles | null>(null);
    const isMentionsOpen = () => !!mentionsPluginRef.current?.isMentionsOpen();

    const hashtagPluginRef = useRef<NewHastagsPluginHandles | null>(null);
    const isHashtagsOpen = () => !!hashtagPluginRef.current?.isHashtagsOpen();

    const canSubmitWithEnter = () => !isMentionsOpen() && !isHashtagsOpen();

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
                  <ContentEditable
                    className={`tw-max-h-[40vh] editor-input-one-liner tw-resize-none tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-iron-950 focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-text-sm tw-leading-6 tw-transition tw-duration-300 tw-ease-out 
                    tw-pl-3 tw-py-2.5 tw-scrollbar-thin tw-scrollbar-thumb-iron-600 tw-scrollbar-track-iron-900 ${
                      submitting ? "tw-opacity-50 tw-cursor-default" : ""
                    }`}
                  />
                }
                placeholder={
                  <span
                    className={`editor-placeholder ${
                      submitting ? "tw-opacity-50" : ""
                    }`}>
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
              <NewHashtagsPlugin
                onSelect={onHashtagAdded}
                ref={hashtagPluginRef}
              />
              <MaxLengthPlugin maxLength={25000} />
              <DragDropPastePlugin />
              <ListPlugin />
              <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
              <TabIndentationPlugin />
              <LinkPlugin validateUrl={validateUrl} />
              <ClearEditorPlugin ref={clearEditorRef} />
              <DisableEditPlugin disabled={submitting} />
              <EnterKeyPlugin
                handleSubmit={handleSubmit}
                canSubmitWithEnter={canSubmitWithEnter}
                disabled={submitting}
              />
            </div>
          </div>
        </LexicalComposer>
      </div>
    );
  }
);

CreateDropInput.displayName = "CreateDropInput";
export default CreateDropInput;
