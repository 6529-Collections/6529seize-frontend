import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
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
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { MENTION_TRANSFORMER } from "../../../../create/lexical/transformers/MentionTransformer";
import { HASHTAG_TRANSFORMER } from "../../../../create/lexical/transformers/HastagTransformer";
import { IMAGE_TRANSFORMER } from "../../../../create/lexical/transformers/ImageTransformer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import NewMentionsPlugin from "../../../../create/lexical/plugins/mentions/MentionsPlugin";
import NewHashtagsPlugin from "../../../../create/lexical/plugins/hashtags/HashtagsPlugin";
import { MaxLengthPlugin } from "../../../../create/lexical/plugins/MaxLengthPlugin";
import DragDropPastePlugin from "../../../../create/lexical/plugins/DragDropPastePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";

export interface DropReplyInputHandles {
  clearEditorState: () => void;
}

const DropReplyInput = forwardRef<
  DropReplyInputHandles,
  {
    readonly editorState: EditorState | null;
    readonly drop: CreateDropConfig | null;
    readonly onEditorState: (editorState: EditorState) => void;
    readonly onReferencedNft: (referencedNft: ReferencedNft) => void;
    readonly onMentionedUser: (
      mentionedUser: Omit<MentionedUser, "current_handle">
    ) => void;
    readonly onFileChange: (file: File) => void;
  }
>(
  (
    {
      editorState,
      drop,
      onEditorState,
      onReferencedNft,
      onMentionedUser,
      onFileChange,
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

    const currentPartCount = (drop?.parts.length ?? 0) + 1;
    const [charsCount, setCharsCount] = useState(0);
    useEffect(() => {
      editorState?.read(() =>
        setCharsCount(
          $convertToMarkdownString([
            ...TRANSFORMERS,
            MENTION_TRANSFORMER,
            HASHTAG_TRANSFORMER,
            IMAGE_TRANSFORMER,
          ])?.length ?? 0
        )
      );
    }, [editorState]);

    return (
      <div className="tailwind-scope tw-w-full">
        <LexicalComposer initialConfig={editorConfig}>
          <div>
            <div className="tw-relative">
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
              <AutoFocusPlugin defaultSelection="rootStart" />
              <OnChangePlugin onChange={onEditorStateChange} />
              <NewMentionsPlugin onSelect={onMentionedUserAdded} />
              <NewHashtagsPlugin onSelect={onHashtagAdded} />
              <MaxLengthPlugin maxLength={25000} />
              <DragDropPastePlugin />
              <ListPlugin />
              <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
              <TabIndentationPlugin />
              <LinkPlugin validateUrl={validateUrl} />
              <ClearEditorPlugin ref={clearEditorRef} />
            </div>
          </div>
        </LexicalComposer>
        <div className="tw-flex tw-w-full tw-justify-between tw-items-center tw-gap-x-6 tw-text-xs tw-font-medium tw-text-iron-400">
          {!!drop?.parts.length && (
            <p className="tw-mb-0 tw-mt-1.5 tw-pb-2">
              <>
                <span className="tw-font-semibold tw-text-iron-500">
                  Part:{" "}
                  <span className="tw-text-iron-50">{currentPartCount}</span>,
                </span>
                <span
                  className={`${charsCount > 240 && "tw-text-error"} tw-pl-1`}
                >
                  length: {formatNumberWithCommas(charsCount)}
                </span>
              </>
            </p>
          )}
        </div>
        <div className="tw-mt-3 tw-flex tw-items-center tw-gap-x-6">
          <label>
            <div
              role="button"
              aria-label="Select audio file"
              className="tw-cursor-pointer tw-flex tw-items-center tw-gap-x-2 tw-text-iron-400 hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300"
            >
              <svg
                className="tw-flex-shrink-0 tw-h-5 tw-w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                aria-hidden="true"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
              <input
                type="file"
                className="tw-hidden"
                accept="image/*,video/*,audio/*"
                onChange={(e: any) => {
                  if (e.target.files) {
                    const f = e.target.files[0];
                    onFileChange(f);
                  }
                }}
              />
              <span className="tw-text-sm tw-font-medium">Upload Media</span>
            </div>
          </label>
        </div>
      </div>
    );
  }
);

DropReplyInput.displayName = "DropReplyInput";
export default DropReplyInput;
