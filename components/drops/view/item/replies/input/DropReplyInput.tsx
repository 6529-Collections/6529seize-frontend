import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { EditorState, RootNode } from "lexical";
import {
  CreateDropConfig,
  MentionedUser,
  ReferencedNft,
} from "../../../../../../entities/IDrop";
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { MentionNode } from "../../../../create/lexical/nodes/MentionNode";
import { HashtagNode } from "../../../../create/lexical/nodes/HashtagNode";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { ImageNode } from "../../../../create/lexical/nodes/ImageNode";
import ExampleTheme from "../../../../create/lexical/ExampleTheme";
import ClearEditorPlugin, {
  ClearEditorPluginHandles,
} from "../../../../create/lexical/plugins/ClearEditorPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import NewMentionsPlugin, {
  NewMentionsPluginHandles,
} from "../../../../create/lexical/plugins/mentions/MentionsPlugin";
import NewHashtagsPlugin, {
  NewHastagsPluginHandles,
} from "../../../../create/lexical/plugins/hashtags/HashtagsPlugin";
import { MaxLengthPlugin } from "../../../../create/lexical/plugins/MaxLengthPlugin";
import DragDropPastePlugin from "../../../../create/lexical/plugins/DragDropPastePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import EnterKeyPlugin from "../../../../create/lexical/plugins/enter/EnterKeyPlugin";
import AutoFocusPlugin from "../../../../create/lexical/plugins/AutoFocusPlugin";

export interface DropReplyInputHandles {
  clearEditorState: () => void;
}

const DropReplyInput = forwardRef<
  DropReplyInputHandles,
  {
    readonly editorState: EditorState | null;
    readonly drop: CreateDropConfig | null;
    readonly canSubmit: boolean;
    readonly onDrop?: () => void;
    readonly onEditorState: (editorState: EditorState) => void;
    readonly onReferencedNft: (referencedNft: ReferencedNft) => void;
    readonly onMentionedUser: (
      mentionedUser: Omit<MentionedUser, "current_handle">
    ) => void;
    readonly onFileChange: (file: File) => void;
    readonly children?: React.ReactNode;
  }
>(
  (
    {
      editorState,
      drop,
      canSubmit,
      onDrop,
      onEditorState,
      onReferencedNft,
      onMentionedUser,
      onFileChange,
      children,
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

    const urlRegExp = new RegExp(
      /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/
    );
    function validateUrl(url: string): boolean {
      return url === "https://" || urlRegExp.test(url);
    }

    const clearEditorRef = useRef<ClearEditorPluginHandles | null>(null);

    const clearEditorState = () => {
      clearEditorRef.current?.clearEditorState();
    };

    useImperativeHandle(ref, () => ({
      clearEditorState,
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
      <div className="tailwind-scope tw-w-full">
        <LexicalComposer initialConfig={editorConfig}>
          <div className="tw-flex tw-items-end tw-gap-x-3">
            <div className="tw-relative tw-w-full">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="editor-input-one-liner tw-pr-24 tw-resize-none tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-iron-900 focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-md tw-leading-6 tw-transition tw-duration-300 tw-ease-out 
                  tw-pl-3.5 tw-py-2.5"
                  />
                }
                placeholder={
                  <span className="editor-placeholder">Drop a reply...</span>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin />

              <OnChangePlugin onChange={onEditorStateChange} />
              <NewMentionsPlugin
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
              <EnterKeyPlugin
                handleSubmit={handleSubmit}
                canSubmitWithEnter={canSubmitWithEnter}
                disabled={false}
              />
              <AutoFocusPlugin />
            </div>
            {children && <div>{children}</div>}
          </div>
        </LexicalComposer>
      </div>
    );
  }
);

DropReplyInput.displayName = "DropReplyInput";
export default DropReplyInput;
